import { requireCommunityAuth } from './middleware'
import cookieParser from 'cookie-parser'
import express from 'express'
import request from 'supertest'
import communityAuthRouter from './routes'

const ENVIRONMENT_VARIABLES = ['FLOWISE_USERNAME', 'FLOWISE_PASSWORD', 'FLOWISE_SECRET', 'FLOWISE_JWΤ_DURATION'] as const
const originalEnvironment = Object.fromEntries(ENVIRONMENT_VARIABLES.map((name) => [name, process.env[name]]))

const restoreEnvironment = (): void => {
    for (const name of ENVIRONMENT_VARIABLES) {
        const originalValue = originalEnvironment[name]
        if (originalValue === undefined) delete process.env[name]
        else process.env[name] = originalValue
    }
}

const createTestApp = () => {
    const app = express()
    app.use(express.json())
    app.use(cookieParser())
    app.use('/auth/logout', requireCommunityAuth)
    app.use('/auth', communityAuthRouter)
    return app
}

describe('community authentication routes', () => {
    beforeEach(() => {
        process.env.FLOWISE_USERNAME = 'community-user'
        process.env.FLOWISE_PASSWORD = 'community-password'
        process.env.FLOWISE_SECRET = 'test-only-secret-with-at-least-32-characters'
        process.env.FLOWISE_JWΤ_DURATION = '24h'
    })

    afterAll(restoreEnvironment)

    it('logs in and restores the single-user context from the session cookie', async () => {
        const agent = request.agent(createTestApp())
        const loginResponse = await agent.post('/auth/login').send({
            username: 'community-user',
            password: 'community-password'
        })

        expect(loginResponse.status).toBe(200)
        expect(loginResponse.headers['set-cookie']?.[0]).toContain('flowise_auth=')
        expect(loginResponse.body.activeWorkspaceId).toBe('0')

        const resolveResponse = await agent.post('/auth/resolve').send({})
        expect(resolveResponse.status).toBe(200)
        expect(resolveResponse.body).toMatchObject({
            redirectUrl: '/',
            user: {
                id: '0',
                activeOrganizationId: '0',
                activeWorkspaceId: '0'
            }
        })
    })

    it('rejects invalid credentials without issuing a session cookie', async () => {
        const response = await request(createTestApp()).post('/auth/login').send({
            username: 'community-user',
            password: 'incorrect-password'
        })

        expect(response.status).toBe(401)
        expect(response.headers['set-cookie']).toBeUndefined()
    })

    it('clears the session cookie on logout', async () => {
        const agent = request.agent(createTestApp())
        await agent.post('/auth/login').send({ username: 'community-user', password: 'community-password' }).expect(200)

        const logoutResponse = await agent.post('/auth/logout').send({})
        expect(logoutResponse.status).toBe(200)
        expect(logoutResponse.headers['set-cookie']?.[0]).toContain('flowise_auth=;')

        const resolveResponse = await agent.post('/auth/resolve').send({})
        expect(resolveResponse.body).toEqual({ redirectUrl: '/signin' })
    })
})
