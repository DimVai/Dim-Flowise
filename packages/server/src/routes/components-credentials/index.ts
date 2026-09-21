import { checkAnyPermission, API_KEY_PERMISSIONS } from '../../community-auth/permissions'
import express from 'express'
import componentsCredentialsController from '../../controllers/components-credentials'
const router = express.Router()

router.use(checkAnyPermission(API_KEY_PERMISSIONS))

// READ
router.get('/', componentsCredentialsController.getAllComponentsCredentials)
router.get(['/', '/:name'], componentsCredentialsController.getComponentByName)

export default router
