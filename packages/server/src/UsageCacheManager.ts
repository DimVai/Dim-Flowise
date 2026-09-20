/**
 * Compatibility object for community execution interfaces inherited from
 * upstream. Commercial subscription quotas are intentionally absent.
 */
export class UsageCacheManager {
    private static instance = new UsageCacheManager()

    public static async getInstance(): Promise<UsageCacheManager> {
        return UsageCacheManager.instance
    }
}
