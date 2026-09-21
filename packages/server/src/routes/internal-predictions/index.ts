import { requireOwner } from '../../community-auth/permissions'
import express from 'express'
import internalPredictionsController from '../../controllers/internal-predictions'
const router = express.Router()

router.use(requireOwner)

// CREATE
router.post(['/', '/:id'], internalPredictionsController.createInternalPrediction)

export default router
