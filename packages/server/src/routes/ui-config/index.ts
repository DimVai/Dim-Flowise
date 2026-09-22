import express from 'express'
import { requireOwner } from '../../community-auth/permissions'

const router = express.Router()

router.get('/', requireOwner, (_req, res) => {
    res.json({ showDeprecatingNodes: String(process.env.SHOW_DEPRECATING_NODES).toLowerCase() === 'true' })
})

export default router
