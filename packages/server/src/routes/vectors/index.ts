import { requireOwner } from '../../community-auth/permissions'
import { checkFlowPermission } from '../../community-auth/flow-permissions'
import express from 'express'
import vectorsController from '../../controllers/vectors'
import { getMulterStorage } from '../../utils'

const router = express.Router()

// CREATE
router.post(
    ['/upsert/', '/upsert/:id'],
    checkFlowPermission('update'),
    getMulterStorage().array('files'),
    vectorsController.getRateLimiterMiddleware,
    vectorsController.upsertVectorMiddleware
)
router.post(['/internal-upsert/', '/internal-upsert/:id'], requireOwner, getMulterStorage().array('files'), vectorsController.createInternalUpsert)

export default router
