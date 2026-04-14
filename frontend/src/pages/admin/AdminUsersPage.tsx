import { useEffect, useState } from 'react'
import api from '../../api/client'
import { User, UserRole } from '../../types'
import { Button, Card, Spinner, Alert } from '../../components/ui'

const roleBadge: Record<UserRole, string> = {
  admin:      'bg-red-100 text-red-700',
  technician: 'bg-blue-100 text-blue-700',
  client:     'bg-green-100 text-green-700',
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchUsers = () => {
    setLoading(true)
    api.get('/users')
      .then(r => setUsers(r.data.data))
      .catch(() => setError('Failed to load users'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchUsers() }, [])

  const toggleActive = async (id: string) => {
    try {
      await api.patch(`/users/${id}/toggle-active`)
      fetchUsers()
    } catch {
      setError('Failed to update user')
    }
  }

  return (
    <div className="p-6 space-y-5">
      <h2 className="text-xl font-bold text-gray-900">Users</h2>
      {error && <Alert message={error} />}

      {loading ? <Spinner /> : (
        <Card>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900">{u.name}</td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${roleBadge[u.role]}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      u.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      size="sm"
                      variant={u.is_active ? 'danger' : 'secondary'}
                      onClick={() => toggleActive(u.id)}
                    >
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
