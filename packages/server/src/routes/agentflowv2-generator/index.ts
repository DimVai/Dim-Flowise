import { checkAnyPermission } from '../../community-auth/permissions'
import express from 'express'
import agentflowv2GeneratorController from '../../controllers/agentflowv2-generator'
const router = express.Router()

router.post('/generate', checkAnyPermission('agentflows:create,agentflows:update'), agentflowv2GeneratorController.generateAgentflowv2)

export default router
