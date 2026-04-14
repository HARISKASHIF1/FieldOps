import { Router } from 'express'
import { authenticate, authorize } from '../middleware/auth'
import { getDashboard } from '../controllers/admin.controller'

const router = Router()

router.use(authenticate, authorize('admin'))
router.get('/dashboard', getDashboard)

export default router
