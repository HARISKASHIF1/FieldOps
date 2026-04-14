import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

const navItems = {
  admin: [
    { to: '/admin/dashboard', label: '📊 Dashboard' },
    { to: '/admin/jobs',      label: '🔧 Jobs' },
    { to: '/admin/users',     label: '👥 Users' },
  ],
  technician: [
    { to: '/technician/jobs', label: '🔧 My Jobs' },
  ],
  client: [
    { to: '/client/jobs', label: '📋 My Jobs' },
  ],
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const links = user ? navItems[user.role] : []

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-56 bg-gray-900 text-white flex flex-col">
        <div className="px-5 py-5 border-b border-gray-700">
          <h1 className="font-bold text-lg">⚡ FieldOps</h1>
          <p className="text-xs text-gray-400 mt-0.5 capitalize">{user?.role}</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {links.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-gray-700">
          <p className="text-xs text-gray-400 truncate mb-2">{user?.name}</p>
          <button
            onClick={handleLogout}
            className="w-full text-left text-sm text-gray-300 hover:text-white px-2 py-1 rounded transition-colors"
          >
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
