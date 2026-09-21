import { requireOwner } from '../../community-auth/permissions'
import express from 'express'
import settingsController from '../../controllers/settings'
const router = express.Router()

router.use(requireOwner)

// CREATE
router.get('/', settingsController.getSettingsList)

export default router
