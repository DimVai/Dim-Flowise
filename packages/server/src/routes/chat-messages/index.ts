import { checkFlowPermission } from '../../community-auth/flow-permissions'
import express from 'express'
import chatMessageController from '../../controllers/chat-messages'
const router = express.Router()

// CREATE
// NOTE: Unused route
// router.post(['/', '/:id'], chatMessageController.createChatMessage)

// READ
router.get(['/', '/:id'], checkFlowPermission('view'), chatMessageController.getAllChatMessages)

// UPDATE
router.put(['/abort/', '/abort/:chatflowid/:chatid'], chatMessageController.abortChatMessage)

// DELETE
router.delete(['/', '/:id'], checkFlowPermission('delete'), chatMessageController.removeAllChatMessages)

export default router
