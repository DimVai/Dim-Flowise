import { checkFlowPermission } from '../../community-auth/flow-permissions'
import express from 'express'
import statsController from '../../controllers/stats'

const router = express.Router()

// READ
router.get(['/', '/:id'], checkFlowPermission('view'), statsController.getChatflowStats)

export default router
