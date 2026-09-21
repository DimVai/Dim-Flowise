import { checkAnyPermission } from '../../community-auth/permissions'
import express from 'express'
import textToSpeechController from '../../controllers/text-to-speech'

const router = express.Router()

router.post('/generate', textToSpeechController.generateTextToSpeech)

router.post('/abort', textToSpeechController.abortTextToSpeech)

router.get('/voices', checkAnyPermission('chatflows:config,agentflows:config'), textToSpeechController.getVoices)

export default router
