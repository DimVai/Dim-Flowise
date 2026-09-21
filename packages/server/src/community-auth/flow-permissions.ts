import { Request, RequestHandler } from 'express'
import { In } from 'typeorm'
import { ChatFlow, EnumChatflowType } from '../database/entities/ChatFlow'
import { UpsertHistory } from '../database/entities/UpsertHistory'
import { getRunningExpressApp } from '../utils/getRunningExpressApp'
import { hasPermission, isOwnerRequest } from './permissions'

const categories: Record<string, string> = {
    CHATFLOW: 'chatflows', MULTIAGENT: 'agentflows', AGENTFLOW: 'agentflows', ASSISTANT: 'assistants'
}

export const getPermittedFlowTypes = (req: Request, action: string): EnumChatflowType[] =>
    Object.values(EnumChatflowType).filter((type) => hasPermission(req, categories[type] + ':' + action))

export const canAccessFlow = (req: Request, type: string | undefined, action: string): boolean => {
    const category = categories[type || 'CHATFLOW']
    return !!category && hasPermission(req, category + ':' + action)
}

// Flow routes are shared by chatflows, agentflows and assistants. A permission
// for one category must not authorize an ID (or a type change) in another.
export const checkFlowPermission = (action: string, source: 'resource' | 'create' | 'list' = 'resource'): RequestHandler =>
    async (req, res, next) => {
        if (isOwnerRequest(req)) return next()
        if (!req.user) { res.status(401).json({ error: 'Unauthorized Access' }); return }
        try {
            if (source === 'list') {
                const type = req.query.type
                if (getPermittedFlowTypes(req, action).length &&
                    (type === undefined || (typeof type === 'string' && canAccessFlow(req, type, action)))) return next()
            } else if (source === 'create') {
                if (canAccessFlow(req, req.body?.type, action)) return next()
            } else if (req.params.id) {
                const flow = await getRunningExpressApp().AppDataSource.getRepository(ChatFlow).findOneBy({
                    id: req.params.id, workspaceId: req.user.activeWorkspaceId
                })
                if (!flow) { res.status(404).json({ error: 'Flow not found' }); return }
                if (canAccessFlow(req, flow.type, action) &&
                    (req.body?.type === undefined || canAccessFlow(req, req.body.type, action))) return next()
            }
            res.status(403).json({ error: 'Forbidden: missing flow permission' })
        } catch (error) { next(error) }
    }

export const checkUpsertHistoryDelete: RequestHandler = async (req, res, next) => {
    if (isOwnerRequest(req)) return next()
    if (!req.user) { res.status(401).json({ error: 'Unauthorized Access' }); return }
    const ids = req.body?.ids
    if (!Array.isArray(ids) || !ids.length || !ids.every((id) => typeof id === 'string' && id.length > 0)) {
        res.status(400).json({ error: 'History ids are required' }); return
    }
    try {
        const source = getRunningExpressApp().AppDataSource
        const rows = await source.getRepository(UpsertHistory).find({ where: { id: In([...new Set(ids)]) } })
        if (rows.length !== new Set(ids).size) { res.status(404).json({ error: 'History not found' }); return }
        for (const id of new Set(rows.map((row) => row.chatflowid))) {
            const flow = await source.getRepository(ChatFlow).findOneBy({ id, workspaceId: req.user.activeWorkspaceId })
            if (!flow || !canAccessFlow(req, flow.type, 'delete')) {
                res.status(403).json({ error: 'Forbidden: missing flow delete permission' }); return
            }
        }
        next()
    } catch (error) { next(error) }
}
