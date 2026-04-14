import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../api/client'
import { Job, User, JobStatus } from '../../types'
import { useAuthStore } from '../../store/authStore'
import {
  Button, Card, StatusBadge, Spinner, Alert, Select, Textarea
} from '../../components/ui'

const ADMIN_STATUSES: JobStatus[] = ['pending','assigned','in_progress','on_hold','completed','cancelled']
const TECH_STATUSES:  JobStatus[] = ['in_progress','on_hold','completed']

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [job, setJob] = useState<Job | null>(null)
  const [technicians, setTechnicians] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [note, setNote] = useState('')
  const [noteLoading, setNoteLoading] = useState(false)
  const [updateLoading, setUpdateLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Edit state (admin only)
  const [editStatus, setEditStatus] = useState<JobStatus | ''>('')
  const [editTech, setEditTech] = useState('')

  const fetchJob = async () => {
    try {
      const r = await api.get(`/jobs/${id}`)
      const j = r.data.data
      setJob(j)
      setEditStatus(j.status)
      setEditTech(j.technician_id || '')
    } catch {
      setError('Job not found')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJob()
    if (user?.role === 'admin') {
      api.get('/users?role=technician').then(r => setTechnicians(r.data.data))
    }
  }, [id])

  const handleUpdate = async () => {
    setError(''); setSuccess(''); setUpdateLoading(true)
    try {
      const payload: any = {}
      if (editStatus && editStatus !== job?.status) payload.status = editStatus
      if (user?.role === 'admin' && editTech !== (job?.technician_id || '')) {
        payload.technician_id = editTech || null
      }
      if (Object.keys(payload).length === 0) return
      await api.patch(`/jobs/${id}`, payload)
      setSuccess('Job updated')
      fetchJob()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Update failed')
    } finally {
      setUpdateLoading(false)
    }
  }

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!note.trim()) return
    setNoteLoading(true)
    try {
      await api.post(`/jobs/${id}/notes`, { content: note })
      setNote('')
      fetchJob()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add note')
    } finally {
      setNoteLoading(false)
    }
  }

  const backPath = user?.role === 'admin' ? '/admin/jobs'
    : user?.role === 'technician' ? '/technician/jobs' : '/client/jobs'

  if (loading) return <Spinner />
  if (!job) return <div className="p-6 text-red-500">Job not found</div>

  const availableStatuses = user?.role === 'admin' ? ADMIN_STATUSES : TECH_STATUSES
  const canEdit = user?.role === 'admin' || (user?.role === 'technician' && job.technician_id === user.id)

  return (
    <div className="p-6 space-y-5 max-w-4xl">
      <button onClick={() => navigate(backPath)} className="text-sm text-blue-600 hover:underline">
        ← Back to Jobs
      </button>

      {error   && <Alert message={error} />}
      {success && <Alert message={success} type="success" />}

      {/* Job Header */}
      <Card className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{job.title}</h2>
            <p className="text-sm text-gray-500 mt-1">{job.description || 'No description'}</p>
          </div>
          <StatusBadge status={job.status} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 pt-4 border-t border-gray-100 text-sm">
          <div>
            <p className="text-xs text-gray-400">Client</p>
            <p className="font-medium">{job.client_name || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Technician</p>
            <p className="font-medium">{job.technician_name || 'Unassigned'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Scheduled</p>
            <p className="font-medium">
              {job.scheduled_at ? new Date(job.scheduled_at).toLocaleString() : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Created</p>
            <p className="font-medium">{new Date(job.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      </Card>

      {/* Update Panel */}
      {canEdit && (
        <Card className="p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Update Job</h3>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="min-w-[160px]">
              <Select
                label="Status"
                value={editStatus}
                onChange={e => setEditStatus(e.target.value as JobStatus)}
              >
                {availableStatuses.map(s => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </Select>
            </div>

            {user?.role === 'admin' && (
              <div className="min-w-[200px]">
                <Select
                  label="Reassign Technician"
                  value={editTech}
                  onChange={e => setEditTech(e.target.value)}
                >
                  <option value="">— Unassigned —</option>
                  {technicians.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </Select>
              </div>
            )}

            <Button onClick={handleUpdate} loading={updateLoading}>Save Changes</Button>
          </div>
        </Card>
      )}

      {/* Activity Timeline */}
      <Card>
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Activity Timeline</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {(job.activities || []).length === 0 && (
            <p className="p-4 text-sm text-gray-400">No activity yet</p>
          )}
          {(job.activities || []).map(a => (
            <div key={a.id} className="px-5 py-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded mr-2 ${
                    a.type === 'status_change' ? 'bg-blue-50 text-blue-600' :
                    a.type === 'note' ? 'bg-gray-100 text-gray-600' :
                    a.type === 'assignment' ? 'bg-purple-50 text-purple-600' :
                    'bg-yellow-50 text-yellow-600'
                  }`}>{a.type.replace('_', ' ')}</span>
                  <span className="text-sm text-gray-800">{a.content}</span>
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {new Date(a.created_at).toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5 ml-0">{a.user_name}</p>
            </div>
          ))}
        </div>

        {/* Add Note */}
        <div className="px-5 py-4 border-t border-gray-100">
          <form onSubmit={handleAddNote} className="flex gap-3">
            <Textarea
              placeholder="Add a note..."
              rows={2}
              value={note}
              onChange={e => setNote(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" loading={noteLoading} size="sm" className="self-end">
              Add Note
            </Button>
          </form>
        </div>
      </Card>
    </div>
  )
}
