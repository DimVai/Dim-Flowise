import { NextFunction, Request, RequestHandler, Response } from 'express'

const allowSingleUserRequest = (_req: Request, _res: Response, next: NextFunction): void => next()

/**
 * The community fork has one authenticated owner and no RBAC model. These
 * middleware factories preserve the route signatures while authorization is
 * handled centrally by the community authentication middleware.
 */
export const checkPermission = (_permission: string): RequestHandler => allowSingleUserRequest

export const checkAnyPermission = (_permissions: string | string[]): RequestHandler => allowSingleUserRequest
