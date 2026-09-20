import { UsageCacheManager } from '../UsageCacheManager'

type UsageType = 'flows' | 'users'

export const getCurrentUsage = async (_orgId: string, _subscriptionId: string, _usageCacheManager: UsageCacheManager) => undefined

export const checkUsageLimit = async (
    _type: UsageType,
    _subscriptionId: string,
    _usageCacheManager: UsageCacheManager,
    _currentUsage: number
) => undefined

export const updatePredictionsUsage = async (
    _orgId: string,
    _subscriptionId: string,
    _workspaceId: string = '',
    _usageCacheManager?: UsageCacheManager
) => undefined

export const checkPredictions = async (_orgId: string, _subscriptionId: string, _usageCacheManager: UsageCacheManager) => undefined

export const updateStorageUsage = (_orgId: string, _workspaceId: string = '', _totalSize: number, _usageCacheManager?: UsageCacheManager) =>
    undefined

export const checkStorage = async (_orgId: string, _subscriptionId: string, _usageCacheManager: UsageCacheManager) => undefined
