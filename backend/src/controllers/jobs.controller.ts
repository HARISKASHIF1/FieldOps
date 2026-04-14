import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'
import { db } from '../config/db'
import { AppError } from '../middleware/errorHandler'
import { audit } from '../utils/audit'
import { notify } from '../services/notification.service'
import { JobStatus } from '../types'

const CreateJobSchema = z.object({
  title: z.string().min(3).max(255),
  description: z.string().optional(),
  client_id: z.string().uuid(),
  technician_id: z.string().uuid().optional(),
  scheduled_at: z.string().datetime().optional(),
})

const UpdateJobSchema = z.object({
  title: z.string().min(3).max(255).optional(),
  description: z.string().optional(),
  technician_id: z.string().uuid().nullable().optional(),
  scheduled_at: z.string().datetime().nullable().optional(),
  status: z.enum(['pending','assigned','in_progress','on_hold','completed','cancelled']).optional(),
})

const AddNoteSchema = z.object({
  content: z.string().min(1).max(2000),
})

// Helper: fetch job or throw 404
async function getJobOrFail(id: string) {
  const [rows]: any = await db.query(
    'SELECT * FROM jobs WHERE id = ? AND deleted_at IS NULL',
    [id]
  )
  if (!rows[0]) throw new AppError('Job not found', 404)
  return rows[0]
}

// GET /jobs
export async function listJobs(req: Request, res: Response, next: NextFunction) {
  try {
    const { status, page = '1', limit = '20' } = req.query
    const user = req.user!
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string)

    let whereClause = 'WHERE j.deleted_at IS NULL'
    const params: unknown[] = []

    // Role-based filtering
    if (user.role === 'client') {
      params.push(user.id)
      whereClause += ` AND j.client_id = ?`
    } else if (user.role === 'technician') {
      params.push(user.id)
      whereClause += ` AND j.technician_id = ?`
    }

    if (status) {
      params.push(status)
      whereClause += ` AND j.status = ?`
    }

    params.push(parseInt(limit as string), offset)

    const [rows]: any = await db.query(
      `SELECT
        j.*,
        c.name  AS client_name,
        t.name  AS technician_name
       FROM jobs j
       LEFT JOIN users c ON c.id = j.client_id
       LEFT JOIN users t ON t.id = j.technician_id
       ${whereClause}
       ORDER BY j.created_at DESC
       LIMIT ? OFFSET ?`,
      params
    )

    // Count query
    const countParams = params.slice(0, params.length - 2)
    const [countRows]: any = await db.query(
      `SELECT COUNT(*) as count FROM jobs j ${whereClause}`,
      countParams
    )

    res.json({
      success: true,
      data: rows,
      meta: {
        total: parseInt(countRows[0].count),
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      },
    })
  } catch (err) {
    next(err)
  }
}

// GET /jobs/:id
export async function getJob(req: Request, res: Response, next: NextFunction) {
  try {
    const [rows]: any = await db.query(
      `SELECT j.*,
        c.name AS client_name, c.email AS client_email,
        t.name AS technician_name, t.email AS technician_email
       FROM jobs j
       LEFT JOIN users c ON c.id = j.client_id
       LEFT JOIN users t ON t.id = j.technician_id
       WHERE j.id = ? AND j.deleted_at IS NULL`,
      [req.params.id]
    )
    const job = rows[0]
    if (!job) throw new AppError('Job not found', 404)

    // Clients can only see their own jobs
    if (req.user!.role === 'client' && job.client_id !== req.user!.id) {
      throw new AppError('Forbidden', 403)
    }

    // Fetch activity timeline
    const [activities]: any = await db.query(
      `SELECT a.*, u.name AS user_name, u.role AS user_role
       FROM job_activities a
       JOIN users u ON u.id = a.user_id
       WHERE a.job_id = ?
       ORDER BY a.created_at ASC`,
      [job.id]
    )

    res.json({ success: true, data: { ...job, activities } })
  } catch (err) {
    next(err)
  }
}

// POST /jobs
export async function createJob(req: Request, res: Response, next: NextFunction) {
  try {
    const body = CreateJobSchema.parse(req.body)
    const user = req.user!

    // Verify client exists and has client role
    const [clientRows]: any = await db.query(
      'SELECT id FROM users WHERE id = ? AND role = ?',
      [body.client_id, 'client']
    )
    if (!clientRows[0]) throw new AppError('Client not found', 404)

    // Auto-set status to 'assigned' if technician provided
    const status: JobStatus = body.technician_id ? 'assigned' : 'pending'
    const jobId = uuidv4()

    const [result]: any = await db.query(
      `INSERT INTO jobs (id, title, description, status, client_id, technician_id, scheduled_at, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [jobId, body.title, body.description || null, status, body.client_id,
       body.technician_id || null, body.scheduled_at || null, user.id]
    )
    
    // Fetch the inserted job
    const [rows]: any = await db.query(
      'SELECT * FROM jobs WHERE id = ?',
      [jobId]
    )
    const job = rows[0]

    // Activity log
    await db.query(
      `INSERT INTO job_activities (id, job_id, user_id, type, content)
       VALUES (?, ?, ?, 'system', ?)`,
      [uuidv4(), job.id, user.id, `Job created with status: ${status}`]
    )

    // Notify technician if assigned
    if (body.technician_id) {
      await notify({
        userId: body.technician_id,
        jobId: job.id,
        type: 'job_assigned',
        title: 'New Job Assigned',
        message: `You have been assigned to: ${job.title}`,
      })
    }

    // Notify client
    await notify({
      userId: body.client_id,
      jobId: job.id,
      type: 'job_created',
      title: 'Job Created',
      message: `Your service request "${job.title}" has been received.`,
    })

    await audit({
      userId: user.id,
      action: 'CREATE_JOB',
      entity: 'job',
      entityId: job.id,
      ipAddress: req.ip,
    })

    res.status(201).json({ success: true, data: job })
  } catch (err) {
    next(err)
  }
}

// PATCH /jobs/:id
export async function updateJob(req: Request, res: Response, next: NextFunction) {
  try {
    const body = UpdateJobSchema.parse(req.body)
    const user = req.user!
    const job  = await getJobOrFail(req.params.id)

    // Role-based update restrictions
    if (user.role === 'client') {
      throw new AppError('Clients cannot update jobs directly', 403)
    }
    if (user.role === 'technician') {
      // Technicians can only update status of their own assigned jobs
      if (job.technician_id !== user.id) throw new AppError('Not your job', 403)
      const allowedStatuses: JobStatus[] = ['in_progress', 'on_hold', 'completed']
      if (body.status && !allowedStatuses.includes(body.status)) {
        throw new AppError(`Technicians cannot set status to ${body.status}`, 403)
      }
      // Block other field changes for technicians
      delete body.title
      delete body.description
      delete body.technician_id
      delete body.scheduled_at
    }

    // Track status change for activity log
    const statusChanged = body.status && body.status !== job.status
    const techChanged   = body.technician_id !== undefined && body.technician_id !== job.technician_id

    // Build dynamic update
    const fields: string[] = []
    const values: unknown[] = []

    if (body.title !== undefined)         { fields.push(`title = ?`);          values.push(body.title) }
    if (body.description !== undefined)   { fields.push(`description = ?`);    values.push(body.description) }
    if (body.technician_id !== undefined) { fields.push(`technician_id = ?`);  values.push(body.technician_id) }
    if (body.scheduled_at !== undefined)  { fields.push(`scheduled_at = ?`);   values.push(body.scheduled_at) }
    if (body.status !== undefined) {
      fields.push(`status = ?`)
      values.push(body.status)
      if (body.status === 'completed') {
        fields.push(`completed_at = ?`)
        values.push(new Date())
      }
    }

    if (fields.length === 0) {
      return res.json({ success: true, data: job })
    }

    fields.push(`updated_at = NOW()`)
    values.push(req.params.id)

    await db.query(
      `UPDATE jobs SET ${fields.join(', ')} WHERE id = ?`,
      values
    )
    
    // Fetch the updated job
    const [rows]: any = await db.query(
      'SELECT * FROM jobs WHERE id = ?',
      [req.params.id]
    )
    const updated = rows[0]

    // Activity: status change
    if (statusChanged) {
      await db.query(
        `INSERT INTO job_activities (id, job_id, user_id, type, content, metadata)
         VALUES (?, ?, ?, 'status_change', ?, ?)`,
        [uuidv4(), job.id, user.id, `Status changed from ${job.status} to ${body.status}`,
         JSON.stringify({ from: job.status, to: body.status })]
      )
      // Notify client of status change
      await notify({
        userId: job.client_id,
        jobId: job.id,
        type: 'status_changed',
        title: 'Job Status Updated',
        message: `Your job "${job.title}" is now: ${body.status?.replace('_', ' ')}`,
      })
    }

    // Activity: reassignment
    if (techChanged && body.technician_id) {
      await db.query(
        `INSERT INTO job_activities (id, job_id, user_id, type, content)
         VALUES (?, ?, ?, 'assignment', ?)`,
        [uuidv4(), job.id, user.id, `Job assigned to new technician`]
      )
      await notify({
        userId: body.technician_id,
        jobId: job.id,
        type: 'job_assigned',
        title: 'Job Assigned to You',
        message: `You have been assigned to: ${job.title}`,
      })
    }

    await audit({
      userId: user.id,
      action: 'UPDATE_JOB',
      entity: 'job',
      entityId: job.id,
      changes: body as Record<string, unknown>,
      ipAddress: req.ip,
    })

    res.json({ success: true, data: updated })
  } catch (err) {
    next(err)
  }
}

// POST /jobs/:id/notes
export async function addNote(req: Request, res: Response, next: NextFunction) {
  try {
    const { content } = AddNoteSchema.parse(req.body)
    const user = req.user!
    const job  = await getJobOrFail(req.params.id)

    // Clients can only note on their own jobs
    if (user.role === 'client' && job.client_id !== user.id) {
      throw new AppError('Forbidden', 403)
    }
    // Technicians only on their assigned jobs
    if (user.role === 'technician' && job.technician_id !== user.id) {
      throw new AppError('Forbidden', 403)
    }

    const activityId = uuidv4()
    const [result]: any = await db.query(
      `INSERT INTO job_activities (id, job_id, user_id, type, content)
       VALUES (?, ?, ?, 'note', ?)`,
      [activityId, job.id, user.id, content]
    )
    
    // Fetch the inserted note
    const [rows]: any = await db.query(
      'SELECT * FROM job_activities WHERE id = ?',
      [activityId]
    )

    res.status(201).json({ success: true, data: rows[0] })
  } catch (err) {
    next(err)
  }
}

// DELETE /jobs/:id  (soft delete, admin only)
export async function deleteJob(req: Request, res: Response, next: NextFunction) {
  try {
    const job = await getJobOrFail(req.params.id)

    await db.query(
      `UPDATE jobs SET deleted_at = NOW() WHERE id = ?`,
      [job.id]
    )

    await audit({
      userId: req.user!.id,
      action: 'DELETE_JOB',
      entity: 'job',
      entityId: job.id,
      ipAddress: req.ip,
    })

    res.json({ success: true, message: 'Job deleted' })
  } catch (err) {
    next(err)
  }
}