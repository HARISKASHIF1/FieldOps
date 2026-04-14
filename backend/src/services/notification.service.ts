import { v4 as uuidv4 } from 'uuid'
import { db } from '../config/db'

interface NotifyOptions {
  userId: string
  jobId?: string
  type: string
  title: string
  message: string
}

export async function notify(opts: NotifyOptions): Promise<void> {
  try {
    await db.query(
      `INSERT INTO notifications (id, user_id, job_id, type, title, message)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [uuidv4(), opts.userId, opts.jobId || null, opts.type, opts.title, opts.message]
    )
  } catch (err) {
    console.error('[Notify] Failed:', err)
  }
}

export async function notifyMany(users: string[], opts: Omit<NotifyOptions, 'userId'>) {
  await Promise.all(users.map(userId => notify({ ...opts, userId })))
}
