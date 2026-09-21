import { Request, RequestHandler } from 'express'
import { COMMUNITY_PERMISSIONS } from './constants'

export const API_KEY_PERMISSIONS: readonly string[] = COMMUNITY_PERMISSIONS.filter(
    (permission) => !['workspace', 'datasets', 'evaluations', 'evaluators', 'logs'].includes(permission.split(':')[0])
)

export const isOwnerRequest = (req: Request): boolean => req.user?.authType === 'owner'

// Unknown, malformed and empty permissions never grant implicit access.
export const normalizeApiKeyPermissions = (permissions: unknown): string[] =>
    Array.isArray(permissions)
        ? [...new Set(permissions.filter((permission): permission is string => typeof permission === 'string' && API_KEY_PERMISSIONS.includes(permission)))]
        : []

export const hasPermission = (req: Request, permission: string): boolean =>
    isOwnerRequest(req) ||
    (req.user?.authType === 'apiKey' && API_KEY_PERMISSIONS.includes(permission) && req.user.permissions.includes(permission))

export const requireOwner: RequestHandler = (req, res, next) => {
    if (isOwnerRequest(req)) return next()
    res.status(req.user ? 403 : 401).json({ error: 'Owner session required' })
}

export const checkAnyPermission = (permissions: string | readonly string[]): RequestHandler => {
    const required = (typeof permissions === 'string' ? permissions.split(',') : permissions).map((permission) => permission.trim()).filter(Boolean)
    return (req, res, next) => {
        if (isOwnerRequest(req) || required.some((permission) => hasPermission(req, permission))) return next()
        res.status(req.user ? 403 : 401).json({ error: 'Forbidden: missing API-key permission' })
    }
}

export const checkPermission = (permission: string): RequestHandler => checkAnyPermission([permission])

export const getApiKeyPermissionCatalog = () => {
    const catalog: Record<string, { key: string; value: string; isOpenSource: boolean }[]> = {}
    for (const key of API_KEY_PERMISSIONS) {
        const [category, action] = key.split(':')
        const value = action.replace(/-/g, ' ')
        ;(catalog[category] ??= []).push({ key, value: value.charAt(0).toUpperCase() + value.slice(1), isOpenSource: true })
    }
    return catalog
}
