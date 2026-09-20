import { Request } from 'express'
import { StatusCodes } from 'http-status-codes'
import { Equal } from 'typeorm'
import { getActiveWorkspaceIdForRequest, getWorkspaceSearchOptions, getWorkspaceSearchOptionsFromReq } from './workspace'

describe('community single-workspace context', () => {
    it('scopes repository searches to workspace 0 and rejects requests without an active workspace', () => {
        expect(getWorkspaceSearchOptions()).toEqual({ workspaceId: Equal('0') })

        const authenticatedRequest = { user: { activeWorkspaceId: '0' } } as unknown as Request
        expect(getActiveWorkspaceIdForRequest(authenticatedRequest)).toBe('0')
        expect(getWorkspaceSearchOptionsFromReq(authenticatedRequest)).toEqual({ workspaceId: Equal('0') })

        try {
            getWorkspaceSearchOptionsFromReq({} as Request)
            throw new Error('Expected a request without an active workspace to be rejected')
        } catch (error) {
            expect(error).toMatchObject({ statusCode: StatusCodes.UNAUTHORIZED, message: 'Unauthorized' })
        }
    })
})
