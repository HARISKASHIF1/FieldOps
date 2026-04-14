import { Request, Response, NextFunction } from 'express'
import { db } from '../config/db'

export async function listNotifications(req: Request, res: Response, next: NextFunction) {
  try {
    const [rows]: any = await db.query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [req.user!.id]
    )
    res.json({ success: true, data: rows })
  } catch (err) { next(err) }
}

export async function markRead(req: Request, res: Response, next: NextFunction) {
  try {
    await db.query(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
      [req.params.id, req.user!.id]
    )
    res.json({ success: true })
  } catch (err) { next(err) }
}

export async function markAllRead(req: Request, res: Response, next: NextFunction) {
  try {
    await db.query('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [req.user!.id])
    res.json({ success: true })
  } catch (err) { next(err) }
}
