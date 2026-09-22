import { RequestHandler } from 'express'
import { API_KEY_BLACKLIST_URLS, WHITELIST_URLS } from '../utils/constants'
import { validateAPIKey } from '../utils/validateKey'
import { requireCommunityAuth } from './middleware'
import { normalizeApiKeyPermissions } from './permissions'
import { createCommunityUser } from './service'

// Public exceptions match a method and a whole route, never an unrestricted prefix.
const publicRoutes: Record<string, [string[], RegExp]> = {
    '/api/v1/verify/apikey/': [['GET'], /^\/api\/v1\/verify\/apikey\/[^\/]+\/?$/],
    '/api/v1/chatflows/apikey/': [['GET'], /^\/api\/v1\/chatflows\/apikey\/[^\/]+\/?$/],
    '/api/v1/public-chatflows': [['GET'], /^\/api\/v1\/public-chatflows(?:\/[^\/]+)?\/?$/],
    '/api/v1/public-chatbotConfig': [['GET'], /^\/api\/v1\/public-chatbotConfig(?:\/[^\/]+)?\/?$/],
    '/api/v1/public-executions': [['GET'], /^\/api\/v1\/public-executions(?:\/[^\/]+)?\/?$/],
    '/api/v1/prediction/': [['POST'], /^\/api\/v1\/prediction\/[^\/]+\/?$/],
    '/api/v1/webhook/': [['*'], /^\/api\/v1\/webhook\/[^\/]+\/?$/],
    '/api/v1/chatmessage/abort': [['PUT'], /^\/api\/v1\/chatmessage\/abort\/[^\/]+\/[^\/]+\/?$/],
    '/api/v1/node-icon/': [['GET'], /^\/api\/v1\/node-icon\/[^\/]+\/?$/],
    '/api/v1/components-credentials-icon/': [['GET'], /^\/api\/v1\/components-credentials-icon\/[^\/]+\/?$/],
    '/api/v1/chatflows-streaming': [['GET'], /^\/api\/v1\/chatflows-streaming(?:\/[^\/]+)?\/?$/],
    '/api/v1/chatflows-uploads': [['GET'], /^\/api\/v1\/chatflows-uploads(?:\/[^\/]+)?\/?$/],
    '/api/v1/openai-assistants-file/download': [['POST'], /^\/api\/v1\/openai-assistants-file\/download\/?$/],
    '/api/v1/feedback': [['POST', 'PUT'], /^\/api\/v1\/feedback(?:\/[^\/]+)?\/?$/],
    '/api/v1/leads': [['POST'], /^\/api\/v1\/leads\/?$/],
    '/api/v1/get-upload-file': [['GET'], /^\/api\/v1\/get-upload-file\/?$/],
    '/api/v1/ip': [['GET'], /^\/api\/v1\/ip\/?$/],
    '/api/v1/ping': [['GET'], /^\/api\/v1\/ping\/?$/],
    '/api/v1/version': [['GET'], /^\/api\/v1\/version\/?$/],
    '/api/v1/attachments': [['POST'], /^\/api\/v1\/attachments\/[^\/]+\/[^\/]+\/?$/],
    '/api/v1/auth/resolve': [['POST'], /^\/api\/v1\/auth\/resolve\/?$/],
    '/api/v1/auth/login': [['POST'], /^\/api\/v1\/auth\/login\/?$/],
    '/api/v1/oauth2-credential/callback': [['GET'], /^\/api\/v1\/oauth2-credential\/callback\/?$/],
    '/api/v1/mcp/': [['POST', 'DELETE', 'OPTIONS'], /^\/api\/v1\/mcp\/[^\/]+\/?$/],
    '/api/v1/text-to-speech/generate': [['POST'], /^\/api\/v1\/text-to-speech\/generate\/?$/],
    '/api/v1/text-to-speech/abort': [['POST'], /^\/api\/v1\/text-to-speech\/abort\/?$/]
}

export const isPublicApiRequest = (method: string, path: string, denylist: string[] = []): boolean =>
    WHITELIST_URLS.some((url) => {
        const rule = publicRoutes[url]
        const effectiveMethod = method === 'HEAD' ? 'GET' : method
        return !denylist.includes(url) && !!rule && (rule[0].includes('*') || rule[0].includes(effectiveMethod)) && rule[1].test(path)
    })

const authenticateKey =
    (fromPath: boolean): RequestHandler =>
    async (req, res, next) => {
        try {
            const { isValid, apiKey } = await validateAPIKey(req, fromPath ? req.params.apikey : undefined)
            if (!isValid || !apiKey) {
                res.status(401).json({ error: 'Unauthorized Access' })
                return
            }
            const user = createCommunityUser()
            user.authType = 'apiKey'
            user.isOrganizationAdmin = false
            user.role = 'apiKey'
            user.permissions = normalizeApiKeyPermissions(apiKey.permissions)
            req.user = user
            next()
        } catch (error) {
            next(error)
        }
    }

export const authenticateApiKey: RequestHandler = authenticateKey(false)
export const authenticateApiKeyFromPath: RequestHandler = authenticateKey(true)

export const createApiAuthentication =
    (denylist: string[] = []): RequestHandler =>
    (req, res, next) => {
        if (!/\/api\/v1\//i.test(req.path)) return next()
        if (!/\/api\/v1\//.test(req.path)) {
            res.status(401).json({ error: 'Unauthorized Access' })
            return
        }
        if (isPublicApiRequest(req.method, req.path, denylist)) return next()
        if (req.headers['x-request-from'] === 'internal') return requireCommunityAuth(req, res, next)
        if (API_KEY_BLACKLIST_URLS.some((url) => req.path.toLowerCase() === url || req.path.toLowerCase().startsWith(url + '/'))) {
            res.status(401).json({ error: 'Unauthorized Access' })
            return
        }
        return authenticateApiKey(req, res, next)
    }
