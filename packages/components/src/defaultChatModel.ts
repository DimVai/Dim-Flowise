type DynamicChatModelProvider = 'openai' | 'anthropic' | 'google'

const flowiseDefaultChatModels: Record<DynamicChatModelProvider, string> = {
    openai: 'gpt-4o-mini',
    anthropic: 'claude-haiku-4-5',
    google: 'gemini-1.5-flash-latest'
}

const dynamicDefaultChatModels: Record<DynamicChatModelProvider, string> = {
    openai: 'gpt-5.6-luna',
    anthropic: 'claude-haiku-4-5',
    google: 'gemini-3.5-flash-lite'
}

export const getDefaultModelFor = (provider: DynamicChatModelProvider): string => {
    if (String(process.env.DISABLE_DYNAMIC_MODELS).toLowerCase() === 'true') {
        return flowiseDefaultChatModels[provider]
    }
    return dynamicDefaultChatModels[provider]
}
