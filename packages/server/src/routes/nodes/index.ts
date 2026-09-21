import { checkAnyPermission, API_KEY_PERMISSIONS } from '../../community-auth/permissions'
import express from 'express'
import nodesController from '../../controllers/nodes'
const router = express.Router()

router.use(checkAnyPermission(API_KEY_PERMISSIONS))

// READ
router.get('/', nodesController.getAllNodes)
router.get(['/', '/:name'], nodesController.getNodeByName)
router.get('/category/:name', nodesController.getNodesByCategory)

export default router
