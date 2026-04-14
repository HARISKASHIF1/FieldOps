import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { register, login, refresh, logout, me } from '../controllers/auth.controller'
import { authenticate } from '../middleware/auth'

const router = Router()

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many requests, try again later' },
})

router.post('/register', authLimiter, register)
router.post('/login',    authLimiter, login)
router.post('/refresh',  refresh)
router.post('/logout',   logout)
router.get('/me',        authenticate, me)

export default router
