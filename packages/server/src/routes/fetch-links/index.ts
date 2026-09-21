import { checkAnyPermission } from '../../community-auth/permissions'
import express from 'express'
import fetchLinksController from '../../controllers/fetch-links'
const router = express.Router()

// READ
router.get('/', checkAnyPermission('chatflows:create,chatflows:update,agentflows:create,agentflows:update,documentStores:add-loader'), fetchLinksController.getAllLinks)

export default router
