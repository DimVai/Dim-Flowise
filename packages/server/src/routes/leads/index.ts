import { checkFlowPermission } from '../../community-auth/flow-permissions'
import express from 'express'
import leadsController from '../../controllers/leads'
const router = express.Router()

// CREATE
router.post('/', leadsController.createLeadInChatflow)

// READ
router.get(['/', '/:id'], checkFlowPermission('view'), leadsController.getAllLeadsForChatflow)

export default router
