type DynamicChatModelProvider = 'openai' | 'anthropic' | 'google'

const defaultChatModels: Record<DynamicChatModelProvider, string> = {
    openai: 'gpt-4o-mini',
    anthropic: 'claude-haiku-4-5',
    google: 'gemini-1.5-flash-latest'
}

/** Placeholder until the selection criteria for dynamic chat model defaults are defined. */
export const getDefaultModelFor = (provider: DynamicChatModelProvider): string => defaultChatModels[provider]
