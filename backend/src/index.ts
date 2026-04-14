import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'

import { ENV } from './config/env'
import { checkDbConnection } from './config/db'
import { errorHandler } from './middleware/errorHandler'

import authRoutes          from './routes/auth.routes'
import jobsRoutes          from './routes/jobs.routes'
import usersRoutes         from './routes/users.routes'
import adminRoutes         from './routes/admin.routes'
import notificationsRoutes from './routes/notifications.routes'

const app = express()

// ── Security ──────────────────────────────────────────────
app.use(helmet())
app.use(cors({
  origin: ENV.CLIENT_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

// ── Parsing ───────────────────────────────────────────────
app.use(express.json({ limit: '5mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(morgan(ENV.NODE_ENV === 'development' ? 'dev' : 'combined'))

// ── Routes ────────────────────────────────────────────────
app.use('/api/auth',          authRoutes)
app.use('/api/jobs',          jobsRoutes)
app.use('/api/users',         usersRoutes)
app.use('/api/admin',         adminRoutes)
app.use('/api/notifications', notificationsRoutes)

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'FieldOps API running', ts: new Date() })
})

// ── 404 ───────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' })
})

// ── Global Error Handler ──────────────────────────────────
app.use(errorHandler)

// ── Start ─────────────────────────────────────────────────
async function start() {
  await checkDbConnection()
  app.listen(ENV.PORT, () => {
    console.log(`🚀 FieldOps API → http://localhost:${ENV.PORT} [${ENV.NODE_ENV}]`)
  })
}

start().catch(err => {
  console.error('❌ Failed to start server:', err)
  process.exit(1)
})

export default app
