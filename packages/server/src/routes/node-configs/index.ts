import { checkAnyPermission, API_KEY_PERMISSIONS } from '../../community-auth/permissions'
import express from 'express'
import nodeConfigsController from '../../controllers/node-configs'
const router = express.Router()

router.use(checkAnyPermission(API_KEY_PERMISSIONS))

// CREATE
router.post('/', nodeConfigsController.getAllNodeConfigs)

export default router
