import { getLoadedModels, MODEL_TYPE } from './modelLoader'

type DynamicChatModelProvider = 'openai' | 'anthropic' | 'google'

const flowiseDefaultChatModels: Record<DynamicChatModelProvider, string> = {
    openai: 'gpt-4o-mini',
    anthropic: 'claude-haiku-4-5',
    google: 'gemini-1.5-flash-latest'
}

const dynamicChatProviders: Record<DynamicChatModelProvider, { node: string; keyword: string; fallback: string }> = {
    openai: { node: 'chatOpenAI', keyword: 'luna', fallback: 'gpt-5.6-luna' },
    anthropic: { node: 'chatAnthropic', keyword: 'haiku', fallback: 'claude-haiku-4-5' },
    google: { node: 'chatGoogleGenerativeAI', keyword: 'flash', fallback: 'gemini-3.5-flash-lite' }
}

export const getDefaultModelFor = (provider: DynamicChatModelProvider): string => {
    // Disabling dynamic models keeps the original Flowise defaults.
    if (String(process.env.DISABLE_DYNAMIC_MODELS).toLowerCase() === 'true') {
        return flowiseDefaultChatModels[provider]
    }

    const { node, keyword, fallback } = dynamicChatProviders[provider]
    // RULE: The default model is determined by the latest (by release_date) model that matches the keyword.
    // Models.dev chat options are already ordered by release date, newest first.
    // Select the first matching model ID, or use the manual fallback if none matches.
    const match = getLoadedModels(MODEL_TYPE.CHAT, node).find(
        (model) => typeof model.name === 'string' && model.name.toLowerCase().includes(keyword)
    )
    return match?.name ?? fallback
}
