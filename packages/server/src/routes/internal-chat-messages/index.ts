import { checkFlowPermission } from '../../community-auth/flow-permissions'
import express from 'express'
import chatMessagesController from '../../controllers/chat-messages'
const router = express.Router()

// CREATE

// READ
router.get(['/', '/:id'], checkFlowPermission('view'), chatMessagesController.getAllInternalChatMessages)

// UPDATE

// DELETE

export default router
