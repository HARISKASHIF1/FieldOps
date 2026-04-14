import { Request, Response, NextFunction } from 'express'
import { db } from '../config/db'
import { AppError } from '../middleware/errorHandler'

// GET /users  (admin: all users; technician: list of technicians only)
export async function listUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const { role } = req.query
    let query = `SELECT id, name, email, role, is_active, created_at FROM users WHERE 1=1`
    const params: unknown[] = []

    if (role) {
      params.push(role)
      query += ` AND role = ?`
    }

    query += ' ORDER BY created_at DESC'
    const [rows]: any = await db.query(query, params)
    res.json({ success: true, data: rows })
  } catch (err) {
    next(err)
  }
}

// GET /users/:id
export async function getUser(req: Request, res: Response, next: NextFunction) {
  try {
    const [rows]: any = await db.query(
      'SELECT id, name, email, role, is_active, created_at FROM users WHERE id = ?',
      [req.params.id]
    )
    if (!rows[0]) throw new AppError('User not found', 404)
    res.json({ success: true, data: rows[0] })
  } catch (err) {
    next(err)
  }
}

// PATCH /users/:id/deactivate  (admin only)
export async function toggleActive(req: Request, res: Response, next: NextFunction) {
  try {
    const [rows]: any = await db.query(
      `UPDATE users SET is_active = NOT is_active, updated_at = NOW()
       WHERE id = ? RETURNING id, name, is_active`,
      [req.params.id]
    )
    if (!rows[0]) throw new AppError('User not found', 404)
    res.json({ success: true, data: rows[0] })
  } catch (err) {
    next(err)
  }
}