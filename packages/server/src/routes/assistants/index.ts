import express from 'express'
import assistantsController from '../../controllers/assistants'
import { checkPermission, checkAnyPermission } from '../../community-auth/permissions'

const router = express.Router()

// CREATE
router.post('/', checkPermission('assistants:create'), assistantsController.createAssistant)

// READ
router.get('/', checkPermission('assistants:view'), assistantsController.getAllAssistants)
router.get(['/', '/:id'], checkPermission('assistants:view'), assistantsController.getAssistantById)

// UPDATE
router.put(['/', '/:id'], checkAnyPermission('assistants:update'), assistantsController.updateAssistant)

// DELETE
router.delete(['/', '/:id'], checkPermission('assistants:delete'), assistantsController.deleteAssistant)

router.get('/components/chatmodels', checkPermission('assistants:view'), assistantsController.getChatModels)
router.get('/components/docstores', checkPermission('documentStores:view'), assistantsController.getDocumentStores)
router.get('/components/tools', checkPermission('tools:view'), assistantsController.getTools)

// Generate Assistant Instruction
router.post('/generate/instruction', checkAnyPermission('assistants:create,assistants:update'), assistantsController.generateAssistantInstruction)

export default router
