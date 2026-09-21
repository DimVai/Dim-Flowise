import express from 'express'
import chatflowsController from '../../controllers/chatflows'
import { checkFlowPermission } from '../../community-auth/flow-permissions'
import { authenticateApiKeyFromPath } from '../../community-auth/api-auth'
const router = express.Router()

// CREATE
router.post(
    '/',
    checkFlowPermission('create', 'create'),
    chatflowsController.saveChatflow
)

// READ
router.get(
    '/',
    checkFlowPermission('view', 'list'),
    chatflowsController.getAllChatflows
)
router.get(
    ['/', '/:id'],
    checkFlowPermission('view'),
    chatflowsController.getChatflowById
)
router.get(['/apikey/', '/apikey/:apikey'], authenticateApiKeyFromPath, checkFlowPermission('view', 'list'), chatflowsController.getChatflowByApiKey)

// UPDATE
router.put(
    ['/', '/:id'],
    checkFlowPermission('update'),
    chatflowsController.updateChatflow
)

// DELETE
router.delete(['/', '/:id'], checkFlowPermission('delete'), chatflowsController.deleteChatflow)

// WEBHOOK SECRET
router.post('/:id/webhook-secret', checkFlowPermission('update'), chatflowsController.setWebhookSecret)
router.delete('/:id/webhook-secret', checkFlowPermission('update'), chatflowsController.clearWebhookSecret)

// CHECK FOR CHANGE
router.get(
    '/has-changed/:id/:lastUpdatedDateTime',
    checkFlowPermission('view'),
    chatflowsController.checkIfChatflowHasChanged
)

// SCHEDULE
router.get(
    '/:id/schedule/status',
    checkFlowPermission('view'),
    chatflowsController.getScheduleStatus
)
router.patch('/:id/schedule/enabled', checkFlowPermission('update'), chatflowsController.toggleScheduleEnabled)
router.get(
    '/:id/schedule/trigger-logs',
    checkFlowPermission('view'),
    chatflowsController.getScheduleTriggerLogs
)
router.delete(
    '/:id/schedule/trigger-logs',
    checkFlowPermission('update'),
    chatflowsController.deleteScheduleTriggerLogs
)

export default router
