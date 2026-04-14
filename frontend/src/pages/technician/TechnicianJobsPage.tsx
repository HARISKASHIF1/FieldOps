import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/client'
import { Job } from '../../types'
import { Card, StatusBadge, Spinner, Button } from '../../components/ui'

export default function TechnicianJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    setLoading(true)
    const params = statusFilter ? `?status=${statusFilter}` : ''
    api.get(`/jobs${params}`)
      .then(r => setJobs(r.data.data))
      .finally(() => setLoading(false))
  }, [statusFilter])

  return (
    <div className="p-6 space-y-5">
      <h2 className="text-xl font-bold text-gray-900">My Assigned Jobs</h2>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['', 'assigned', 'in_progress', 'on_hold', 'completed'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              statusFilter === s ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {s ? s.replace('_', ' ') : 'All'}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : (
        <div className="grid gap-4">
          {jobs.length === 0 && (
            <Card className="p-8 text-center text-gray-400">No jobs assigned to you</Card>
          )}
          {jobs.map(job => (
            <Card key={job.id} className="p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="font-semibold text-gray-900">{job.title}</h3>
                  {job.description && (
                    <p className="text-sm text-gray-500 line-clamp-2">{job.description}</p>
                  )}
                  <div className="flex gap-4 text-xs text-gray-400 pt-1">
                    <span>Client: {job.client_name || '—'}</span>
                    {job.scheduled_at && (
                      <span>📅 {new Date(job.scheduled_at).toLocaleString()}</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-3">
                  <StatusBadge status={job.status} />
                  <Button size="sm" onClick={() => navigate(`/technician/jobs/${job.id}`)}>
                    Open →
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
