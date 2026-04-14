import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/client'
import { Job } from '../../types'
import { Card, StatusBadge, Spinner, Button } from '../../components/ui'

export default function ClientJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/jobs')
      .then(r => setJobs(r.data.data))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-6 space-y-5">
      <h2 className="text-xl font-bold text-gray-900">My Service Jobs</h2>

      {loading ? <Spinner /> : (
        <div className="grid gap-4">
          {jobs.length === 0 && (
            <Card className="p-8 text-center text-gray-400">
              No jobs found. Contact your service provider.
            </Card>
          )}
          {jobs.map(job => (
            <Card key={job.id} className="p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="space-y-1.5">
                  <h3 className="font-semibold text-gray-900">{job.title}</h3>
                  {job.description && (
                    <p className="text-sm text-gray-500">{job.description}</p>
                  )}
                  <div className="flex gap-4 text-xs text-gray-400">
                    <span>
                      Technician: {job.technician_name || <span className="text-yellow-600">Not yet assigned</span>}
                    </span>
                    {job.scheduled_at && (
                      <span>📅 {new Date(job.scheduled_at).toLocaleString()}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-300">
                    Created: {new Date(job.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-3">
                  <StatusBadge status={job.status} />
                  <Button size="sm" variant="secondary" onClick={() => navigate(`/client/jobs/${job.id}`)}>
                    View Details
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
