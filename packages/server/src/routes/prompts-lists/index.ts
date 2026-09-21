import { checkAnyPermission, API_KEY_PERMISSIONS } from '../../community-auth/permissions'
import express from 'express'
import promptsListController from '../../controllers/prompts-lists'
const router = express.Router()

router.use(checkAnyPermission(API_KEY_PERMISSIONS))

// CREATE
router.post('/', promptsListController.createPromptsList)

export default router
