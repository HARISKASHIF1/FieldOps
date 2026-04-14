import { Router } from 'express'
import { authenticate, authorize } from '../middleware/auth'
import { listUsers, getUser, toggleActive } from '../controllers/users.controller'

const router = Router()

router.use(authenticate)

router.get('/',                        authorize('admin'), listUsers)
router.get('/:id',                     authorize('admin'), getUser)
router.patch('/:id/toggle-active',     authorize('admin'), toggleActive)

export default router
