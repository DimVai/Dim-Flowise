import { checkAnyPermission, API_KEY_PERMISSIONS } from '../../community-auth/permissions'
import express from 'express'
import loadPromptsController from '../../controllers/load-prompts'
const router = express.Router()

router.use(checkAnyPermission(API_KEY_PERMISSIONS))

// CREATE
router.post('/', loadPromptsController.createPrompt)

export default router
