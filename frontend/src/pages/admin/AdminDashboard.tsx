import { useEffect, useState } from 'react'
import api from '../../api/client'
import { Card, Spinner, StatusBadge } from '../../components/ui'
import { JobStatus } from '../../types'

interface DashboardData {
  jobs: { total: number; by_status: Record<JobStatus, number> }
  users: { admin: number; technician: number; client: number }
  recent_jobs: Array<{
    id: string; title: string; status: JobStatus
    client_name: string; technician_name: string | null; created_at: string
  }>
  recent_activity: Array<{
    content: string; type: string; created_at: string
    user_name: string; job_title: string
  }>
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/dashboard')
      .then(r => setData(r.data.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />
  if (!data) return <p className="p-6 text-red-500">Failed to load dashboard</p>

  const statCards = [
    { label: 'Total Jobs',    value: data.jobs.total,                  color: 'text-blue-600' },
    { label: 'Pending',       value: data.jobs.by_status.pending || 0, color: 'text-yellow-600' },
    { label: 'In Progress',   value: data.jobs.by_status.in_progress || 0, color: 'text-purple-600' },
    { label: 'Completed',     value: data.jobs.by_status.completed || 0,   color: 'text-green-600' },
    { label: 'Technicians',   value: data.users.technician || 0,       color: 'text-indigo-600' },
    { label: 'Clients',       value: data.users.client || 0,           color: 'text-pink-600' },
  ]

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Dashboard</h2>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map(s => (
          <Card key={s.label} className="p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Jobs */}
        <Card>
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Recent Jobs</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {data.recent_jobs.length === 0 && (
              <p className="p-4 text-sm text-gray-400">No jobs yet</p>
            )}
            {data.recent_jobs.map(job => (
              <div key={job.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{job.title}</p>
                  <p className="text-xs text-gray-400">{job.client_name}</p>
                </div>
                <StatusBadge status={job.status} />
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Activity */}
        <Card>
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Recent Activity</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {data.recent_activity.length === 0 && (
              <p className="p-4 text-sm text-gray-400">No activity yet</p>
            )}
            {data.recent_activity.map((a, i) => (
              <div key={i} className="px-5 py-3">
                <p className="text-sm text-gray-800">{a.content}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {a.user_name} · {a.job_title} · {new Date(a.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
