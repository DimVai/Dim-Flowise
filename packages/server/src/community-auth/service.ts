import { createHmac, timingSafeEqual } from 'crypto'
import { CookieOptions, Request } from 'express'
import jwt, { JwtPayload, TokenExpiredError } from 'jsonwebtoken'
import moment from 'moment'
import {
    COMMUNITY_AUTH_AUDIENCE,
    COMMUNITY_AUTH_COOKIE,
    COMMUNITY_AUTH_DEFAULT_TOKEN_DURATION,
    COMMUNITY_AUTH_ISSUER,
    COMMUNITY_ORGANIZATION_ID,
    COMMUNITY_PERMISSIONS,
    COMMUNITY_USER_ID,
    COMMUNITY_WORKSPACE_ID,
    COMMUNITY_WORKSPACE_NAME
} from './constants'
import { CommunityAuthTokenPayload, CommunityAuthUser } from './types'

interface CommunityAuthConfig {
    username: string
    password: string
    secret: string
    tokenDurationSeconds: number
}

const getRequiredEnvironmentValue = (name: 'FLOWISE_USERNAME' | 'FLOWISE_PASSWORD' | 'FLOWISE_SECRET'): string => {
    const value = process.env[name]
    if (!value || !value.trim()) throw new Error(`${name} must be set for community authentication`)
    return value
}

const parseTokenDurationSeconds = (value: string): number => {
    const match = value.trim().match(/^(\d+(?:\.\d+)?)(ms|s|m|h|d|w|M|Q|y)$/)
    if (!match) {
        throw new Error('FLOWISE_JTW_DURATION must use Moment.js duration notation, for example 24h or 3d')
    }

    const amount = Number(match[1])
    const unit = match[2] as moment.unitOfTime.DurationConstructor
    const seconds = Math.floor(moment.duration(amount, unit).asSeconds())
    if (!Number.isSafeInteger(seconds) || seconds < 1) {
        throw new Error('FLOWISE_JTW_DURATION must represent a positive duration of at least 1 second')
    }

    return seconds
}

export const getCommunityAuthConfig = (): CommunityAuthConfig => {
    const config = {
        username: getRequiredEnvironmentValue('FLOWISE_USERNAME'),
        password: getRequiredEnvironmentValue('FLOWISE_PASSWORD'),
        secret: getRequiredEnvironmentValue('FLOWISE_SECRET'),
        tokenDurationSeconds: parseTokenDurationSeconds(process.env.FLOWISE_JTW_DURATION || COMMUNITY_AUTH_DEFAULT_TOKEN_DURATION)
    }

    if (config.secret.length < 32) throw new Error('FLOWISE_SECRET must contain at least 32 characters')
    return config
}

export const validateCommunityAuthConfiguration = (): void => {
    getCommunityAuthConfig()
}

const deriveKey = (secret: string, purpose: string): Buffer => createHmac('sha256', secret).update(purpose).digest()

const digestCredential = (credential: string, secret: string): Buffer =>
    createHmac('sha256', deriveKey(secret, 'flowise-community-credential-comparison-v1')).update(credential).digest()

const matchesCredential = (provided: string, expected: string, secret: string): boolean =>
    timingSafeEqual(digestCredential(provided, secret), digestCredential(expected, secret))

export const validateCommunityCredentials = (username: unknown, password: unknown): boolean => {
    if (typeof username !== 'string' || typeof password !== 'string') return false

    const config = getCommunityAuthConfig()
    const usernameMatches = matchesCredential(username, config.username, config.secret)
    const passwordMatches = matchesCredential(password, config.password, config.secret)
    return usernameMatches && passwordMatches
}

export const createCommunityUser = (username?: string): CommunityAuthUser => {
    const resolvedUsername = username || getCommunityAuthConfig().username
    return {
        authType: 'owner',
        id: COMMUNITY_USER_ID,
        email: resolvedUsername,
        name: resolvedUsername,
        roleId: COMMUNITY_USER_ID,
        role: 'owner',
        status: 'active',
        isSSO: false,
        activeOrganizationId: COMMUNITY_ORGANIZATION_ID,
        activeOrganizationSubscriptionId: COMMUNITY_ORGANIZATION_ID,
        activeOrganizationCustomerId: COMMUNITY_ORGANIZATION_ID,
        activeOrganizationProductId: COMMUNITY_ORGANIZATION_ID,
        isOrganizationAdmin: true,
        activeWorkspaceId: COMMUNITY_WORKSPACE_ID,
        activeWorkspace: COMMUNITY_WORKSPACE_NAME,
        assignedWorkspaces: [
            {
                id: COMMUNITY_WORKSPACE_ID,
                name: COMMUNITY_WORKSPACE_NAME,
                role: 'owner',
                organizationId: COMMUNITY_ORGANIZATION_ID
            }
        ],
        permissions: [...COMMUNITY_PERMISSIONS],
        features: {}
    }
}

const getTokenSigningKey = (secret: string): Buffer => deriveKey(secret, 'flowise-community-auth-token-v1')

export const createCommunityAuthToken = (username?: string): string => {
    const config = getCommunityAuthConfig()
    const payload: CommunityAuthTokenPayload = {
        sub: COMMUNITY_USER_ID,
        username: username || config.username,
        activeWorkspaceId: COMMUNITY_WORKSPACE_ID,
        activeOrganizationId: COMMUNITY_ORGANIZATION_ID
    }

    return jwt.sign(payload, getTokenSigningKey(config.secret), {
        algorithm: 'HS256',
        expiresIn: config.tokenDurationSeconds,
        issuer: COMMUNITY_AUTH_ISSUER,
        audience: COMMUNITY_AUTH_AUDIENCE
    })
}

export const verifyCommunityAuthToken = (token: string): CommunityAuthUser => {
    const config = getCommunityAuthConfig()
    const payload = jwt.verify(token, getTokenSigningKey(config.secret), {
        algorithms: ['HS256'],
        issuer: COMMUNITY_AUTH_ISSUER,
        audience: COMMUNITY_AUTH_AUDIENCE
    }) as JwtPayload & Partial<CommunityAuthTokenPayload>

    if (
        payload.sub !== COMMUNITY_USER_ID ||
        payload.username !== config.username ||
        payload.activeWorkspaceId !== COMMUNITY_WORKSPACE_ID ||
        payload.activeOrganizationId !== COMMUNITY_ORGANIZATION_ID
    ) {
        throw new Error('Invalid community authentication token')
    }

    return createCommunityUser(payload.username)
}

export const getCommunityUserFromRequest = (req: Request): CommunityAuthUser | undefined => {
    const token = req.cookies?.[COMMUNITY_AUTH_COOKIE]
    if (typeof token !== 'string' || !token) return undefined
    return verifyCommunityAuthToken(token)
}

export const getCommunityAuthCookieOptions = (): CookieOptions => ({
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.SECURE_COOKIES === 'true',
    path: '/',
    maxAge: getCommunityAuthConfig().tokenDurationSeconds * 1000
})

export const getCommunityAuthClearCookieOptions = (): CookieOptions => {
    const { maxAge: _maxAge, ...options } = getCommunityAuthCookieOptions()
    return options
}

export { COMMUNITY_AUTH_COOKIE, TokenExpiredError }
