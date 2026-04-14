export type UserRole = 'admin' | 'technician' | 'client'

export type JobStatus =
  | 'pending'
  | 'assigned'
  | 'in_progress'
  | 'on_hold'
  | 'completed'
  | 'cancelled'

export type ActivityType = 'note' | 'status_change' | 'assignment' | 'system'

export interface User {
  id: string
  name: string
  email: string
  password: string
  role: UserRole
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export interface Job {
  id: string
  title: string
  description: string | null
  status: JobStatus
  client_id: string
  technician_id: string | null
  scheduled_at: Date | null
  completed_at: Date | null
  created_by: string
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
}

export interface JobActivity {
  id: string
  job_id: string
  user_id: string
  type: ActivityType
  content: string
  metadata: Record<string, unknown> | null
  created_at: Date
}

export interface Notification {
  id: string
  user_id: string
  job_id: string | null
  type: string
  title: string
  message: string
  is_read: boolean
  created_at: Date
}

// Express augmentation
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
        role: UserRole
      }
    }
  }
}
