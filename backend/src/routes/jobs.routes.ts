import { Router } from 'express'
import { authenticate, authorize } from '../middleware/auth'
import {
  listJobs, getJob, createJob, updateJob, addNote, deleteJob,
} from '../controllers/jobs.controller'

const router = Router()

router.use(authenticate)

router.get('/',         listJobs)
router.get('/:id',      getJob)
router.post('/',        authorize('admin'), createJob)
router.patch('/:id',    authorize('admin', 'technician'), updateJob)
router.post('/:id/notes', addNote)
router.delete('/:id',   authorize('admin'), deleteJob)

export default router
