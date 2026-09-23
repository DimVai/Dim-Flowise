import { NextFunction, Request, Response } from 'express'
import { COMMUNITY_AUTH_COOKIE } from './constants'
import { requireCommunityAuth } from './middleware'
import { createCommunityAuthToken } from './service'

const ENVIRONMENT_VARIABLES = ['FLOWISE_USERNAME', 'FLOWISE_PASSWORD', 'FLOWISE_SECRET', 'FLOWISE_JWΤ_DURATION'] as const
const originalEnvironment = Object.fromEntries(ENVIRONMENT_VARIABLES.map((name) => [name, process.env[name]]))

const restoreEnvironment = (): void => {
    for (const name of ENVIRONMENT_VARIABLES) {
        const originalValue = originalEnvironment[name]
        if (originalValue === undefined) delete process.env[name]
        else process.env[name] = originalValue
    }
}

const createResponse = (): Response => {
    const response = {
        status: jest.fn(),
        json: jest.fn()
    } as unknown as Response
    ;(response.status as jest.Mock).mockReturnValue(response)
    return response
}

const tamperWithToken = (token: string): string => {
    const parts = token.split('.')
    parts[2] = `${parts[2][0] === 'a' ? 'b' : 'a'}${parts[2].slice(1)}`
    return parts.join('.')
}

describe('community authentication middleware', () => {
    beforeEach(() => {
        process.env.FLOWISE_USERNAME = 'community-user'
        process.env.FLOWISE_PASSWORD = 'community-password'
        process.env.FLOWISE_SECRET = 'test-only-secret-with-at-least-32-characters'
        process.env.FLOWISE_JWΤ_DURATION = '24h'
    })

    afterEach(() => jest.restoreAllMocks())
    afterAll(restoreEnvironment)

    it('accepts a valid token and attaches the fixed single-user context to the request', () => {
        const request = {
            cookies: { [COMMUNITY_AUTH_COOKIE]: createCommunityAuthToken() }
        } as unknown as Request
        const response = createResponse()
        const next = jest.fn() as NextFunction

        requireCommunityAuth(request, response, next)

        expect(next).toHaveBeenCalledTimes(1)
        expect(response.status).not.toHaveBeenCalled()
        expect(request.user).toMatchObject({
            id: '0',
            activeOrganizationId: '0',
            activeWorkspaceId: '0'
        })
    })

    it('rejects missing, tampered, and expired tokens without continuing to the protected endpoint', () => {
        const assertRejected = (token: string | undefined, expectedBody: object): void => {
            const request = { cookies: token ? { [COMMUNITY_AUTH_COOKIE]: token } : {} } as unknown as Request
            const response = createResponse()
            const next = jest.fn() as NextFunction

            requireCommunityAuth(request, response, next)

            expect(response.status).toHaveBeenCalledWith(401)
            expect(response.json).toHaveBeenCalledWith(expectedBody)
            expect(next).not.toHaveBeenCalled()
        }

        assertRejected(undefined, { message: 'Invalid or Missing token' })
        assertRejected(tamperWithToken(createCommunityAuthToken()), { message: 'Invalid or Missing token' })

        const issuedAt = Date.now()
        const dateNow = jest.spyOn(Date, 'now').mockReturnValue(issuedAt)
        process.env.FLOWISE_JWΤ_DURATION = '1s'
        const expiredToken = createCommunityAuthToken()
        dateNow.mockReturnValue(issuedAt + 2000)
        assertRejected(expiredToken, { message: 'Token Expired', retry: false })
    })
})
