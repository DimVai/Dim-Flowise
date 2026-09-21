import express, { Request, Response, NextFunction } from 'express'
import cookieParser from 'cookie-parser'
import request from 'supertest'
import { ApiKey } from '../database/entities/ApiKey'
import { UpsertHistory } from '../database/entities/UpsertHistory'
import { ChatFlow } from '../database/entities/ChatFlow'
import { generateSecretHash } from '../utils/apiKey'
import { createCommunityAuthToken } from './service'
import { COMMUNITY_AUTH_COOKIE } from './constants'
import { API_KEY_PERMISSIONS, checkAnyPermission, checkPermission } from './permissions'
import { createApiAuthentication, isPublicApiRequest } from './api-auth'
import { validateFlowAPIKey } from '../utils/validateKey'
import apikeyService from '../services/apikey'

const mockKeys: ApiKey[] = []
const mockFlows = [{ id: 'chat', type: 'CHATFLOW', workspaceId: '0' }, { id: 'agent', type: 'AGENTFLOW', workspaceId: '0' }]
const mockKeyRepository: any = {
    findOneBy: jest.fn(async (where: any) => mockKeys.find((key: any) => Object.entries(where).every(([k,v]) => key[k] === v))),
    create: (key: ApiKey) => key,
    save: jest.fn(async (key: ApiKey) => { if (!mockKeys.includes(key)) mockKeys.push(key); return key }),
    delete: jest.fn(async ({ id }: { id: string }) => { const i = mockKeys.findIndex((key) => key.id === id); if (i >= 0) mockKeys.splice(i, 1); return { affected: 1 } }),
    createQueryBuilder: () => {
        const q: any = { getMany: async () => mockKeys }
        for (const m of ['orderBy','andWhere','skip','take']) q[m] = () => q
        return q
    }
}
let mockHistory: { id: string; chatflowid: string }[] = []
const mockFlowRepository = {
    findOneBy: jest.fn(async (where: any) => mockFlows.find((flow: any) => Object.entries(where).every(([k,v]) => flow[k] === v)))
}
const mockUpload = jest.fn((_req: Request, _res: Response, next: NextFunction) => next())
const mockControllers: Record<string, jest.Mock> = {}

jest.mock('../utils/getRunningExpressApp', () => ({ getRunningExpressApp: () => ({ AppDataSource: {
    getRepository: (entity: any) => entity === ApiKey ? mockKeyRepository : entity === UpsertHistory ? { find: async () => mockHistory } : mockFlowRepository
} }) }))
jest.mock('../utils/addChatflowsCount', () => ({ addChatflowsCount: async (keys: ApiKey[]) => keys }))
jest.mock('../utils', () => ({ getMulterStorage: () => ({ array: () => mockUpload }) }))

const routerNames = ['variables','tools','credentials','documentstore','chatflows','chat-messages','internal-chat-messages',
    'internal-predictions','vectors','assistants','openai-assistants-files','openai-assistants-vector-store','openai-realtime',
    'upsert-history','export-import','settings','nodes','feedback','leads','mcp-server','webhook-listener','stats','flow-config','validation']
const controllerNames = [...new Set([...routerNames.filter((name) => !['vectors','openai-assistants-files','openai-assistants-vector-store','internal-chat-messages','internal-predictions','flow-config'].includes(name)),
    'vectors','openai-assistants','openai-assistants-vector-store','internal-predictions','flow-configs'])]
for (const name of controllerNames) {
    jest.doMock('../controllers/' + name, () => ({ __esModule: true, default: new Proxy({}, { get: (_target, property) => {
        const key = name + '.' + String(property)
        return mockControllers[key] ??= jest.fn((_req: Request, res: Response) => res.status(204).end())
    } }) }))
}

const mounts: Record<string,string> = { 'documentstore':'document-store','chat-messages':'chatmessage','internal-chat-messages':'internal-chatmessage',
    'internal-predictions':'internal-prediction','vectors':'vector','openai-assistants-files':'openai-assistants-file' }
const app = express()
app.use(express.json())
app.use(cookieParser())
app.use(createApiAuthentication())
for (const name of routerNames) app.use('/api/v1/' + (mounts[name] || name), require('../routes/' + name).default)
app.use('/api/v1/apikey', require('../routes/apikey').default)
app.use('/api/v1/auth', require('./routes').default)
app.get('/api/v1/test-any', checkAnyPermission(['tools:view', 'variables:view']), (_req,res) => res.sendStatus(204))
app.get('/api/v1/test-single', checkPermission('tools:view'), (_req,res) => res.sendStatus(204))
app.use((error: any, _req: Request, res: Response, _next: NextFunction) => res.status(error.statusCode || 500).json({ message: error.message }))

const envNames = ['FLOWISE_USERNAME','FLOWISE_PASSWORD','FLOWISE_SECRET','FLOWISE_JTW_DURATION'] as const
const originalEnv = Object.fromEntries(envNames.map((name) => [name, process.env[name]]))
const token = 'test-only-api-key'
const hash = generateSecretHash(token)
const key = (permissions: any = ['variables:view']): ApiKey => Object.assign(new ApiKey(), {
    id: 'key', keyName: 'Test', apiKey: token, apiSecret: hash, workspaceId: '0', permissions
})
const ownerCookie = () => COMMUNITY_AUTH_COOKIE + '=' + createCommunityAuthToken()
const send = (method: string, path: string, body: object = {}) =>
    (request(app) as any)[method]('/api/v1/' + path).set('Authorization', 'Bearer ' + token).send(body)

beforeEach(() => {
    process.env.FLOWISE_USERNAME = 'test-owner'; process.env.FLOWISE_PASSWORD = 'test-password'
    process.env.FLOWISE_SECRET = 'test-only-secret-with-at-least-32-characters'; process.env.FLOWISE_JTW_DURATION = '24h'
    mockKeys.splice(0, mockKeys.length, key())
    mockHistory = [{ id: 'h1', chatflowid: 'chat' }]
    jest.clearAllMocks()
})
afterAll(() => { for (const name of envNames) { if (originalEnv[name] === undefined) delete process.env[name]; else process.env[name] = originalEnv[name] } })

describe('API-key authorization through production middleware and routers', () => {
    it('allows a matching read and any-of permission, denies unrelated access', async () => {
        await send('get','variables').expect(204)
        await send('get','test-any').expect(204)
        await send('get','test-single').expect(403)
    })
    it.each([
        ['post','variables'],['put','variables/id'],['delete','variables/id'],
        ['post','tools'],['delete','credentials/id'],['post','document-store/upsert/store'],['post','document-store/refresh/store'],
        ['post','document-store/vectorstore/insert'],['post','document-store/generate-tool-desc/store'],
        ['delete','chatmessage/chat'],['put','chatflows/chat'],['delete','chatflows/chat'],['post','chatflows'],
        ['post','openai-assistants-file/upload'],['post','openai-assistants-vector-store/store'],
        ['post','vector/upsert/chat'],['post','vector/internal-upsert/chat'],['post','internal-prediction/chat'],
        ['post','openai-realtime/chat'],['post','export-import/import'],['post','export-import/export'],
        ['post','mcp-server/chat'],['post','webhook-listener/chat/register']
    ])('rejects read-only %s %s before its handler or upload parser', async (method,path) => {
        mockKeys[0].permissions = ['variables:view','tools:view','credentials:view','documentStores:view','chatflows:view','assistants:view']
        await send(method,path).expect(403)
        expect(mockUpload).not.toHaveBeenCalled()
        for (const handler of Object.values(mockControllers)) expect(handler).not.toHaveBeenCalled()
    })
    it.each([
        ['variables:create','post','variables'],['variables:update','put','variables/id'],['variables:delete','delete','variables/id'],
        ['documentStores:upsert-config','post','document-store/upsert/store'],['documentStores:upsert-config','post','document-store/refresh/store'],
        ['chatflows:update','put','chatflows/chat'],['chatflows:delete','delete','chatflows/chat'],
        ['agentflows:update','put','chatflows/agent'],['assistants:update','put','assistants/id']
    ])('allows %s on %s %s', async (permission,method,path) => {
        mockKeys[0].permissions = [permission]
        await send(method,path).expect(204)
    })
    it.each([[], null, undefined, 'variables:view', ['*'], ['admin:all','workspace:export']])('gives no management access to empty/malformed/legacy permissions %j', async (permissions) => {
        mockKeys[0].permissions = permissions as any
        await send('get','variables').expect(403)
        await send('get','nodes').expect(403)
    })
    it('checks flow category and rejects changing to an unauthorized type', async () => {
        mockKeys[0].permissions = ['chatflows:view','chatflows:update','chatflows:create']
        await send('get','chatflows/agent').expect(403)
        await send('put','chatflows/agent').expect(403)
        await send('put','chatflows/chat',{ type: 'AGENTFLOW' }).expect(403)
        await send('post','chatflows',{ type: 'AGENTFLOW' }).expect(403)
        await send('get','chatflows?type=AGENTFLOW').expect(403)
        await send('get','chatflows?type=CHATFLOW').expect(204)
    })
    it('checks every flow in bulk history deletion before executing the controller', async () => {
        await send('patch','upsert-history',{ids:['h1']}).expect(403)
        mockKeys[0].permissions = ['chatflows:delete']
        await send('patch','upsert-history',{ids:['h1']}).expect(204)
        mockHistory.push({id:'h2',chatflowid:'agent'})
        await send('patch','upsert-history',{ids:['h1','h2']}).expect(403)
        mockKeys[0].permissions.push('agentflows:delete')
        await send('patch','upsert-history',{ids:['h1','h2']}).expect(204)
        await send('patch','upsert-history',{ids:[]}).expect(400)
        await send('patch','upsert-history',{ids:['missing']}).expect(404)
    })
    it('create-only permission cannot update an existing object', async () => {
        mockKeys[0].permissions = ['variables:create']
        await send('put','variables/id').expect(403)
    })
    it('requires a real owner session for the internal header, even with a valid API key', async () => {
        await send('get','variables').set('x-request-from','internal').expect(401)
        await send('get','variables').set('x-request-from','internal').set('Cookie', COMMUNITY_AUTH_COOKIE + '=tampered').expect(401)
        await send('delete','variables/id').set('x-request-from','internal').set('Cookie',ownerCookie()).expect(204)
        await send('post','internal-prediction/chat').set('x-request-from','internal').set('Cookie',ownerCookie()).expect(204)
    })
    it('does not promote a key request just because an owner cookie is present', async () => {
        await send('delete','variables/id').set('Cookie',ownerCookie()).expect(403)
    })
    it('protects feedback and lead listing while preserving public submission', async () => {
        await request(app).get('/api/v1/feedback/chat').expect(401)
        await request(app).get('/api/v1/leads/chat').expect(401)
        await request(app).post('/api/v1/leads').send({}).expect(204)
        await request(app).post('/api/v1/feedback').send({}).expect(204)
        mockKeys[0].permissions = ['chatflows:view']
        await send('get','feedback/chat').expect(204)
        await send('get','leads/chat').expect(204)
        await send('get','leads/agent').expect(403)
    })
    it('keeps permissions current across update, replacement and deletion', async () => {
        const cookie = ownerCookie()
        await send('put','apikey/key',{keyName:'Updated', permissions:['variables:update']}).set('x-request-from','internal').set('Cookie',cookie).expect(200)
        await send('get','variables').expect(403)
        await send('put','variables/id').expect(204)
        // Replacement simulates retiring the old secret; authentication reads storage on every request.
        mockKeys[0].apiKey = 'replacement'; mockKeys[0].apiSecret = generateSecretHash('replacement')
        await send('put','variables/id').expect(401)
        await request(app).put('/api/v1/variables/id').set('Authorization','Bearer replacement').send({}).expect(204)
        await request(app).delete('/api/v1/apikey/key').set('x-request-from','internal').set('Cookie',cookie).expect(200)
        await request(app).put('/api/v1/variables/id').set('Authorization','Bearer replacement').send({}).expect(401)
    })
    it('rejects invalid keys, hashes and workspaces', async () => {
        await request(app).get('/api/v1/variables').expect(401)
        await request(app).get('/api/v1/variables').set('Authorization','Bearer wrong').expect(401)
        mockKeys[0].workspaceId = 'other'; await send('get','variables').expect(401)
        mockKeys[0].workspaceId = '0'; mockKeys[0].apiSecret = generateSecretHash('wrong'); await send('get','variables').expect(401)
    })
    it('serves the permission catalog to the owner and permits creating a flow-only key', async () => {
        const catalog = await request(app).get('/api/v1/auth/permissions/API_KEY').set('x-request-from','internal').set('Cookie',ownerCookie()).expect(200)
        expect(catalog.body.variables.some((p: any) => p.key === 'variables:update')).toBe(true)
        expect(catalog.body.workspace).toBeUndefined()
        await send('get','auth/permissions/API_KEY').expect(403)
        await send('post','apikey',{ keyName: 'Flow only', permissions: [] }).set('x-request-from','internal').set('Cookie',ownerCookie()).expect(200)
        expect(mockKeys.some((key) => key.keyName === 'Flow only' && key.permissions.length === 0)).toBe(true)
    })
    it('prevents delegated keys from granting permissions or editing/deleting more powerful keys', async () => {
        mockKeys[0].permissions = ['apikeys:create','apikeys:update','apikeys:delete']
        mockKeys.push(Object.assign(key(['variables:delete']), { id: 'powerful', apiKey: 'powerful' }))
        await send('post','apikey',{ keyName:'Escalation', permissions:['variables:delete'] }).expect(403)
        await send('put','apikey/powerful',{ keyName:'Takeover', permissions:[] }).expect(403)
        await send('delete','apikey/powerful').expect(403)
        expect(mockKeyRepository.save).not.toHaveBeenCalled()
        expect(mockKeyRepository.delete).not.toHaveBeenCalled()
    })
    it.each(['workspace:import','admin:all','unknown:write','*'])('rejects assigning unsupported permission %s even for owner', async (permission) => {
        await send('post','apikey',{keyName:'Bad', permissions:[permission]}).set('x-request-from','internal').set('Cookie',ownerCookie()).expect(400)
    })
    it('flow execution keys remain independent of management permissions', async () => {
        mockKeys[0].permissions = []
        const req = { headers: { authorization: 'Bearer ' + token } } as Request
        const flow = { apikeyid: 'key', workspaceId: '0' } as ChatFlow
        expect(await validateFlowAPIKey(req, flow)).toBe(true)
        expect(await validateFlowAPIKey({headers:{authorization:'Bearer wrong'}} as Request, flow)).toBe(false)
        expect(await validateFlowAPIKey({headers:{}} as Request, flow)).toBe(false)
        expect(await validateFlowAPIKey({headers:{}} as Request, {workspaceId:'0'} as ChatFlow)).toBe(true)
        await send('get','chatflows/apikey/' + token).expect(403)
        mockKeys[0].permissions = ['chatflows:view']
        await request(app).get('/api/v1/chatflows/apikey/' + token).expect(204)
        await apikeyService.deleteApiKey('key', { authType:'owner', activeWorkspaceId:'0' } as any)
        expect(await validateFlowAPIKey(req, flow)).toBe(false)
    })
})

describe('public route boundaries', () => {
    it.each([
        ['GET','/api/v1/feedback/chat'], ['GET','/api/v1/leads/chat'], ['POST','/api/v1/oauth2-credential/refresh/id'],
        ['DELETE','/api/v1/chatflows-streaming/chat'], ['GET','/api/v1/ping-extra'], ['GET','/api/v1/ping/nested'],
        ['POST','/api/v1/internal-prediction/chat'], ['DELETE','/api/v1/chatflows/apikey/token'], ['GET','/api/v1/PING']
    ])('does not whitelist %s %s', (method,path) => expect(isPublicApiRequest(method,path)).toBe(false))
    it('preserves prediction/webhook exceptions and honors DENYLIST_URLS', () => {
        expect(isPublicApiRequest('POST','/api/v1/prediction/chat')).toBe(true)
        expect(isPublicApiRequest('POST','/api/v1/prediction/chat',['/api/v1/prediction/'])).toBe(false)
        expect(isPublicApiRequest('GET','/api/v1/webhook/chat')).toBe(true)
        expect(isPublicApiRequest('HEAD','/api/v1/ping')).toBe(true)
    })
    it('keeps workspace and unavailable features out of API-key grants', () => {
        expect(API_KEY_PERMISSIONS).not.toContain('workspace:export')
        expect(API_KEY_PERMISSIONS).not.toContain('evaluations:create')
    })
})
