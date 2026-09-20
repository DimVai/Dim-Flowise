import { NextFunction, Request, Response } from 'express'
import { getCommunityUserFromRequest, TokenExpiredError } from './service'

export const requireCommunityAuth = (req: Request, res: Response, next: NextFunction): void => {
    try {
        const user = getCommunityUserFromRequest(req)
        if (!user) {
            res.status(401).json({ message: 'Invalid or Missing token' })
            return
        }

        req.user = user
        next()
    } catch (error) {
        if (error instanceof TokenExpiredError) {
            res.status(401).json({ message: 'Token Expired', retry: false })
            return
        }

        res.status(401).json({ message: 'Invalid or Missing token' })
    }
}
