import { checkFlowPermission, checkUpsertHistoryDelete } from '../../community-auth/flow-permissions'
import express from 'express'
import upsertHistoryController from '../../controllers/upsert-history'
const router = express.Router()

// CREATE

// READ
router.get(['/', '/:id'], checkFlowPermission('view'), upsertHistoryController.getAllUpsertHistory)

// PATCH
router.patch('/', checkUpsertHistoryDelete, upsertHistoryController.patchDeleteUpsertHistory)

// DELETE

export default router
