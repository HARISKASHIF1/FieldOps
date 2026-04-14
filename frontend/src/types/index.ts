export type UserRole = 'admin' | 'technician' | 'client'

export type JobStatus =
  | 'pending'
  | 'assigned'
  | 'in_progress'
  | 'on_hold'
  | 'completed'
  | 'cancelled'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  is_active?: boolean
  created_at?: string
}

export interface Job {
  id: string
  title: string
  description: string | null
  status: JobStatus
  client_id: string
  client_name?: string
  technician_id: string | null
  technician_name?: string | null
  scheduled_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
  activities?: JobActivity[]
}

export interface JobActivity {
  id: string
  job_id: string
  user_id: string
  user_name: string
  user_role: UserRole
  type: 'note' | 'status_change' | 'assignment' | 'system'
  content: string
  created_at: string
}

export interface Notification {
  id: string
  job_id: string | null
  type: string
  title: string
  message: string
  is_read: boolean
  created_at: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  meta: { total: number; page: number; limit: number }
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}
