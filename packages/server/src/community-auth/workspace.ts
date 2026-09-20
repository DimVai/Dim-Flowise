import { Request } from 'express'
import { StatusCodes } from 'http-status-codes'
import { Equal } from 'typeorm'
import { InternalFlowiseError } from '../errors/internalFlowiseError'
import { GeneralErrorMessage } from '../utils/constants'
import { COMMUNITY_WORKSPACE_ID } from './constants'

export const getWorkspaceSearchOptions = (workspaceId: string = COMMUNITY_WORKSPACE_ID) => ({
    workspaceId: Equal(workspaceId)
})

export const getActiveWorkspaceIdForRequest = (req: Request): string => {
    const workspaceId = req.user?.activeWorkspaceId
    if (!workspaceId) {
        throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, GeneralErrorMessage.UNAUTHORIZED)
    }
    return workspaceId
}

export const getWorkspaceSearchOptionsFromReq = (req: Request) => getWorkspaceSearchOptions(getActiveWorkspaceIdForRequest(req))
