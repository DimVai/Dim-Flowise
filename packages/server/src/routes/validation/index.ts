import { checkFlowPermission } from '../../community-auth/flow-permissions'
import express from 'express'
import validationController from '../../controllers/validation'
const router = express.Router()

// READ
router.get('/:id', checkFlowPermission('view'), validationController.checkFlowValidation)

export default router
