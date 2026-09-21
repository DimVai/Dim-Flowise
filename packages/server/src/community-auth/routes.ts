import express, { Request, Response } from 'express'
import { rateLimit } from 'express-rate-limit'
import {
    COMMUNITY_AUTH_COOKIE,
    createCommunityAuthToken,
    createCommunityUser,
    getCommunityAuthClearCookieOptions,
    getCommunityAuthCookieOptions,
    getCommunityUserFromRequest,
    validateCommunityCredentials
} from './service'

import { getApiKeyPermissionCatalog, requireOwner } from './permissions'

const router = express.Router()

router.get('/permissions/API_KEY', requireOwner, (_req, res) => res.json(getApiKeyPermissionCatalog()))

const loginRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many login attempts. Please try again later.' }
})

router.post('/resolve', (req: Request, res: Response) => {
    try {
        const user = getCommunityUserFromRequest(req)
        return res.json(user ? { redirectUrl: '/', user } : { redirectUrl: '/signin' })
    } catch {
        return res.json({ redirectUrl: '/signin' })
    }
})

router.post('/login', loginRateLimiter, (req: Request, res: Response) => {
    const username = req.body?.username ?? req.body?.email
    const password = req.body?.password

    if (!validateCommunityCredentials(username, password)) {
        return res.status(401).json({ message: 'Unknown Username or Password' })
    }

    const token = createCommunityAuthToken(username)
    res.cookie(COMMUNITY_AUTH_COOKIE, token, getCommunityAuthCookieOptions())
    return res.json(createCommunityUser(username))
})

router.post('/logout', requireOwner, (_req: Request, res: Response) => {
    res.clearCookie(COMMUNITY_AUTH_COOKIE, getCommunityAuthClearCookieOptions())
    return res.json({ message: 'logged_out', redirectTo: '/signin' })
})

export default router
