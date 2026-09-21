import express from 'express'
import mcpServerController from '../../controllers/mcp-server'
import { checkFlowPermission } from '../../community-auth/flow-permissions'
const router = express.Router()

// GET    /api/v1/mcp-server/:id     → get current config
router.get('/:id', checkFlowPermission('config'), mcpServerController.getMcpServerConfig)

// POST   /api/v1/mcp-server/:id       → enable (generates token)
router.post('/:id', checkFlowPermission('config'), mcpServerController.createMcpServerConfig)

// PUT    /api/v1/mcp-server/:id         → update description/toolName/status
router.put('/:id', checkFlowPermission('config'), mcpServerController.updateMcpServerConfig)

// DELETE /api/v1/mcp-server/:id         → disable (set enabled=false)
router.delete('/:id', checkFlowPermission('config'), mcpServerController.deleteMcpServerConfig)

// POST   /api/v1/mcp-server/:id/refresh → rotate token
router.post('/:id/refresh', checkFlowPermission('config'), mcpServerController.refreshMcpToken)

export default router
