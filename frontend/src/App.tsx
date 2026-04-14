import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import ProtectedRoute from './routes/ProtectedRoute'
import Layout from './components/layout/Layout'

// Auth pages
import LoginPage    from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminJobsPage  from './pages/admin/AdminJobsPage'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import JobDetailPage  from './pages/admin/JobDetailPage'

// Technician pages
import TechnicianJobsPage from './pages/technician/TechnicianJobsPage'

// Client pages
import ClientJobsPage from './pages/client/ClientJobsPage'

function RootRedirect() {
  const { user } = useAuthStore()
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'admin')      return <Navigate to="/admin/dashboard" replace />
  if (user.role === 'technician') return <Navigate to="/technician/jobs" replace />
  return <Navigate to="/client/jobs" replace />
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login"    element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/"         element={<RootRedirect />} />

      <Route path="/unauthorized" element={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-red-500">403</h1>
            <p className="text-gray-600 mt-2">You don't have permission to view this page.</p>
          </div>
        </div>
      } />

      {/* Admin routes */}
      <Route path="/admin" element={
        <ProtectedRoute roles={['admin']}>
          <Layout><div /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/admin/dashboard" element={
        <ProtectedRoute roles={['admin']}>
          <Layout><AdminDashboard /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/admin/jobs" element={
        <ProtectedRoute roles={['admin']}>
          <Layout><AdminJobsPage /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/admin/jobs/:id" element={
        <ProtectedRoute roles={['admin']}>
          <Layout><JobDetailPage /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/admin/users" element={
        <ProtectedRoute roles={['admin']}>
          <Layout><AdminUsersPage /></Layout>
        </ProtectedRoute>
      } />

      {/* Technician routes */}
      <Route path="/technician/jobs" element={
        <ProtectedRoute roles={['technician']}>
          <Layout><TechnicianJobsPage /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/technician/jobs/:id" element={
        <ProtectedRoute roles={['technician']}>
          <Layout><JobDetailPage /></Layout>
        </ProtectedRoute>
      } />

      {/* Client routes */}
      <Route path="/client/jobs" element={
        <ProtectedRoute roles={['client']}>
          <Layout><ClientJobsPage /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/client/jobs/:id" element={
        <ProtectedRoute roles={['client']}>
          <Layout><JobDetailPage /></Layout>
        </ProtectedRoute>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
