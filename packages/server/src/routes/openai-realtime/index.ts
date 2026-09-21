import express from 'express'
import openaiRealTimeController from '../../controllers/openai-realtime'
import { requireOwner } from '../../community-auth/permissions'
import { checkFlowPermission } from '../../community-auth/flow-permissions'

const router = express.Router()

// GET
router.get(
    ['/', '/:id'],
    checkFlowPermission('view'),
    openaiRealTimeController.getAgentTools
)

// EXECUTE
router.post(
    ['/', '/:id'],
    requireOwner,
    openaiRealTimeController.executeAgentTool
)

export default router
