import express from 'express'
import webhookListenerController from '../../controllers/webhook-listener'
import { checkFlowPermission } from '../../community-auth/flow-permissions'

const router = express.Router()

const requireFlowEdit = checkFlowPermission('update')

router.post('/:id/register', requireFlowEdit, webhookListenerController.registerListener)
router.get('/:id/stream/:listenerId', requireFlowEdit, webhookListenerController.streamListener)
router.delete('/:id/listener/:listenerId', requireFlowEdit, webhookListenerController.unregisterListener)

export default router
