import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/client'
import { Job, User } from '../../types'
import { Button, Card, StatusBadge, Spinner, Alert, Input, Select, Textarea } from '../../components/ui'

function CreateJobModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [clients, setClients] = useState<User[]>([])
  const [technicians, setTechnicians] = useState<User[]>([])
  const [form, setForm] = useState({
    title: '', description: '', client_id: '', technician_id: '', scheduled_at: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/users?role=client').then(r => setClients(r.data.data))
    api.get('/users?role=technician').then(r => setTechnicians(r.data.data))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload: any = { ...form }
      if (!payload.technician_id) delete payload.technician_id
      if (!payload.scheduled_at) delete payload.scheduled_at
      else payload.scheduled_at = new Date(payload.scheduled_at).toISOString()
      await api.post('/jobs', payload)
      onCreated()
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create job')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-semibold text-gray-900">Create New Job</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <Alert message={error} />}
          <Input
            label="Job Title *"
            placeholder="e.g. HVAC Inspection"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            required
          />
          <Textarea
            label="Description"
            placeholder="Describe the work to be done..."
            rows={3}
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          />
          <Select
            label="Client *"
            value={form.client_id}
            onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}
            required
          >
            <option value="">— Select client —</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name} ({c.email})</option>)}
          </Select>
          <Select
            label="Assign Technician (optional)"
            value={form.technician_id}
            onChange={e => setForm(f => ({ ...f, technician_id: e.target.value }))}
          >
            <option value="">— Unassigned —</option>
            {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </Select>
          <Input
            label="Scheduled Date/Time (optional)"
            type="datetime-local"
            value={form.scheduled_at}
            onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))}
          />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" loading={loading} className="flex-1">Create Job</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const navigate = useNavigate()

  const fetchJobs = () => {
    setLoading(true)
    const params = statusFilter ? `?status=${statusFilter}` : ''
    api.get(`/jobs${params}`)
      .then(r => setJobs(r.data.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchJobs() }, [statusFilter])

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Jobs</h2>
        <Button onClick={() => setShowCreate(true)}>+ Create Job</Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['', 'pending', 'assigned', 'in_progress', 'on_hold', 'completed', 'cancelled'].map(s => (
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
        <Card>
          {jobs.length === 0 ? (
            <p className="p-6 text-center text-gray-400">No jobs found</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                  <th className="px-5 py-3 font-medium">Job</th>
                  <th className="px-4 py-3 font-medium">Client</th>
                  <th className="px-4 py-3 font-medium">Technician</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Scheduled</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {jobs.map(job => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900">{job.title}</td>
                    <td className="px-4 py-3 text-gray-500">{job.client_name || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{job.technician_name || <span className="text-yellow-600">Unassigned</span>}</td>
                    <td className="px-4 py-3"><StatusBadge status={job.status} /></td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {job.scheduled_at ? new Date(job.scheduled_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Button size="sm" variant="ghost" onClick={() => navigate(`/admin/jobs/${job.id}`)}>
                        View →
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

      {showCreate && (
        <CreateJobModal onClose={() => setShowCreate(false)} onCreated={fetchJobs} />
      )}
    </div>
  )
}
