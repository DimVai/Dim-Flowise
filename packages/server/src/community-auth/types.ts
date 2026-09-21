export interface CommunityAssignedWorkspace {
    id: string
    name: string
    role: string
    organizationId: string
}

export interface CommunityAuthUser {
    authType?: 'owner' | 'apiKey'
    id: string
    email: string
    name: string
    roleId: string
    role?: string
    status?: string
    isSSO?: boolean
    activeOrganizationId: string
    activeOrganizationSubscriptionId: string
    activeOrganizationCustomerId: string
    activeOrganizationProductId: string
    isOrganizationAdmin: boolean
    activeWorkspaceId: string
    activeWorkspace: string
    assignedWorkspaces: CommunityAssignedWorkspace[]
    permissions: string[]
    features?: Record<string, string>
    ssoRefreshToken?: string
    ssoToken?: string
    ssoProvider?: string
}

export interface CommunityAuthTokenPayload {
    sub: string
    username: string
    activeWorkspaceId: string
    activeOrganizationId: string
}
