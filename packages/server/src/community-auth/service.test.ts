import jwt, { JwtPayload } from 'jsonwebtoken'
import {
    createCommunityAuthToken,
    getCommunityAuthCookieOptions,
    getCommunityAuthConfig,
    validateCommunityCredentials,
    verifyCommunityAuthToken
} from './service'

const ENVIRONMENT_VARIABLES = ['FLOWISE_USERNAME', 'FLOWISE_PASSWORD', 'FLOWISE_SECRET', 'FLOWISE_JTW_DURATION'] as const
const originalEnvironment = Object.fromEntries(ENVIRONMENT_VARIABLES.map((name) => [name, process.env[name]]))

const restoreEnvironment = (): void => {
    for (const name of ENVIRONMENT_VARIABLES) {
        const originalValue = originalEnvironment[name]
        if (originalValue === undefined) delete process.env[name]
        else process.env[name] = originalValue
    }
}

describe('community authentication service', () => {
    beforeEach(() => {
        process.env.FLOWISE_USERNAME = 'community-user'
        process.env.FLOWISE_PASSWORD = ' password with spaces '
        process.env.FLOWISE_SECRET = 'test-only-secret-with-at-least-32-characters'
        process.env.FLOWISE_JTW_DURATION = '24h'
    })

    afterAll(restoreEnvironment)

    it('accepts only the exact configured credentials', () => {
        expect(validateCommunityCredentials('community-user', ' password with spaces ')).toBe(true)
        expect(validateCommunityCredentials('community-user', 'password with spaces')).toBe(false)
        expect(validateCommunityCredentials('different-user', ' password with spaces ')).toBe(false)
        expect(validateCommunityCredentials(undefined, undefined)).toBe(false)
    })

    it('round-trips a signed token into the fixed single-user context', () => {
        const user = verifyCommunityAuthToken(createCommunityAuthToken())

        expect(user).toMatchObject({
            id: '0',
            roleId: '0',
            activeOrganizationId: '0',
            activeWorkspaceId: '0',
            isOrganizationAdmin: true
        })
        expect(user.assignedWorkspaces).toEqual([
            {
                id: '0',
                name: 'Default Workspace',
                role: 'owner',
                organizationId: '0'
            }
        ])
        expect(user.permissions).toContain('chatflows:view')
        expect(user.permissions).toContain('credentials:create')
    })

    it('rejects a token whose signature has been changed', () => {
        const tokenParts = createCommunityAuthToken().split('.')
        tokenParts[2] = `${tokenParts[2][0] === 'a' ? 'b' : 'a'}${tokenParts[2].slice(1)}`

        expect(() => verifyCommunityAuthToken(tokenParts.join('.'))).toThrow()
    })

    it('requires a non-blank secret of at least 32 characters', () => {
        delete process.env.FLOWISE_SECRET
        expect(() => getCommunityAuthConfig()).toThrow('FLOWISE_SECRET must be set')

        process.env.FLOWISE_SECRET = 'too-short'
        expect(() => getCommunityAuthConfig()).toThrow('FLOWISE_SECRET must contain at least 32 characters')
    })

    it('uses FLOWISE_JTW_DURATION for both the token and cookie lifetime', () => {
        process.env.FLOWISE_JTW_DURATION = '3d'

        const decodedToken = jwt.decode(createCommunityAuthToken()) as JwtPayload
        expect(decodedToken.exp! - decodedToken.iat!).toBe(3 * 24 * 60 * 60)
        expect(getCommunityAuthCookieOptions().maxAge).toBe(3 * 24 * 60 * 60 * 1000)
    })

    it('rejects invalid or sub-second FLOWISE_JTW_DURATION values', () => {
        process.env.FLOWISE_JTW_DURATION = 'three days'
        expect(() => getCommunityAuthConfig()).toThrow('FLOWISE_JTW_DURATION must use Moment.js duration notation')

        process.env.FLOWISE_JTW_DURATION = '500ms'
        expect(() => getCommunityAuthConfig()).toThrow('FLOWISE_JTW_DURATION must represent a positive duration of at least 1 second')
    })
})
