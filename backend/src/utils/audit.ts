import { v4 as uuidv4 } from 'uuid'
import { db } from '../config/db'

interface AuditOptions {
  userId?: string
  action: string
  entity: string
  entityId?: string
  changes?: Record<string, unknown>
  ipAddress?: string
}

export async function audit(opts: AuditOptions): Promise<void> {
  try {
    await db.query(
      `INSERT INTO audit_logs (id, user_id, action, entity, entity_id, changes, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        uuidv4(),
        opts.userId || null,
        opts.action,
        opts.entity,
        opts.entityId || null,
        opts.changes ? JSON.stringify(opts.changes) : null,
        opts.ipAddress || null,
      ]
    )
  } catch (err) {
    console.error('[Audit] Failed:', err)
  }
}
