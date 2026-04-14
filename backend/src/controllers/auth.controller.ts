import { Request, Response, NextFunction } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'
import { db } from '../config/db'
import { ENV } from '../config/env'
import { AppError } from '../middleware/errorHandler'
import { audit } from '../utils/audit'

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

const RegisterSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['admin', 'technician', 'client']),
})

function signAccess(user: { id: string; email: string; role: string }) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    ENV.JWT_SECRET,
    { expiresIn: ENV.JWT_EXPIRES_IN } as jwt.SignOptions
  )
}

function signRefresh(userId: string) {
  return jwt.sign(
    { id: userId },
    ENV.JWT_REFRESH_SECRET,
    { expiresIn: ENV.JWT_REFRESH_EXPIRES_IN } as jwt.SignOptions
  )
}

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const body = RegisterSchema.parse(req.body)
    const [existing]: any = await db.query('SELECT id FROM users WHERE email = ?', [body.email])
    if (existing.length > 0) throw new AppError('Email already registered', 409)

    const hashed = await bcrypt.hash(body.password, 10)
    const id = uuidv4()
    await db.query(
      'INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
      [id, body.name, body.email, hashed, body.role]
    )
    await audit({ userId: id, action: 'REGISTER', entity: 'user', entityId: id })
    res.status(201).json({
      success: true,
      message: 'Registered successfully',
      data: { id, name: body.name, email: body.email, role: body.role },
    })
  } catch (err) { next(err) }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const body = LoginSchema.parse(req.body)
    const [rows]: any = await db.query('SELECT * FROM users WHERE email = ?', [body.email])
    const user = rows[0]
    if (!user) throw new AppError('Invalid credentials', 401)
    if (!user.is_active) throw new AppError('Account is deactivated', 403)

    const valid = await bcrypt.compare(body.password, user.password)
    if (!valid) throw new AppError('Invalid credentials', 401)

    const accessToken  = signAccess(user)
    const refreshToken = signRefresh(user.id)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString().slice(0, 19).replace('T', ' ')

    await db.query(
      'INSERT INTO refresh_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)',
      [uuidv4(), user.id, refreshToken, expiresAt]
    )
    await audit({ userId: user.id, action: 'LOGIN', entity: 'user', entityId: user.id, ipAddress: req.ip })

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
      },
    })
  } catch (err) { next(err) }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) throw new AppError('Refresh token required', 400)

    let payload: { id: string }
    try {
      payload = jwt.verify(refreshToken, ENV.JWT_REFRESH_SECRET) as { id: string }
    } catch {
      throw new AppError('Invalid refresh token', 401)
    }

    const [rows]: any = await db.query(
      `SELECT rt.*, u.email, u.role, u.name, u.is_active, u.id as uid
       FROM refresh_tokens rt
       JOIN users u ON u.id = rt.user_id
       WHERE rt.token = ? AND rt.expires_at > NOW()`,
      [refreshToken]
    )
    if (!rows[0]) throw new AppError('Token expired or revoked', 401)
    if (!rows[0].is_active) throw new AppError('Account deactivated', 403)

    const newAccess = signAccess({ id: rows[0].uid, email: rows[0].email, role: rows[0].role })
    res.json({ success: true, data: { accessToken: newAccess } })
  } catch (err) { next(err) }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body
    if (refreshToken) await db.query('DELETE FROM refresh_tokens WHERE token = ?', [refreshToken])
    res.json({ success: true, message: 'Logged out' })
  } catch (err) { next(err) }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).userId
    if (!userId) throw new AppError('User not authenticated', 401)

    const [rows]: any = await db.query(
      'SELECT id, name, email, role, is_active FROM users WHERE id = ?',
      [userId]
    )
    if (!rows[0]) throw new AppError('User not found', 404)

    res.json({
      success: true,
      data: rows[0],
    })
  } catch (err) { next(err) }
}