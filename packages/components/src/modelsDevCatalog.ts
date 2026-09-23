import axios from 'axios'
import { MODEL_CATALOG_TIMEOUT_MS } from './modelCatalogConstants'
import { buildModelsDevChatOptions } from './modelsDevAdapter'
import type { ModelsDevChatOption } from './modelsDevAdapter'
import { filterModelsDevChatModels } from './modelsDevFilters'

const MODELS_DEV_URL = 'https://models.dev/api.json'

const DYNAMIC_CHAT_PROVIDERS = [
    { provider: 'openai', node: 'chatOpenAI' },
    { provider: 'anthropic', node: 'chatAnthropic' },
    { provider: 'google', node: 'chatGoogleGenerativeAI' }
] as const

type DynamicChatNode = (typeof DYNAMIC_CHAT_PROVIDERS)[number]['node']

// Missing keys mean "keep the existing base list", never "replace it with an empty list".
export type ModelsDevChatLists = Partial<Record<DynamicChatNode, ModelsDevChatOption[]>>

const isRecord = (value: unknown): value is Record<string, unknown> => {
    return value !== null && typeof value === 'object' && !Array.isArray(value)
}

const buildProviderChatList = (provider: unknown): ModelsDevChatOption[] | undefined => {
    if (!isRecord(provider) || !isRecord(provider.models)) return undefined

    const candidates = Object.values(provider.models)
    const filteredModels = filterModelsDevChatModels(candidates)
    const options = buildModelsDevChatOptions(filteredModels)

    return options.length > 0 ? options : undefined
}

/** Fetch once and prepare independent provider replacements without changing the active catalog. */
export const fetchModelsDevChatLists = async (): Promise<ModelsDevChatLists> => {
    const response = await axios.get<unknown>(MODELS_DEV_URL, { timeout: MODEL_CATALOG_TIMEOUT_MS })
    if (response.status !== 200 || !isRecord(response.data)) {
        throw new Error('Invalid Models.dev catalog response')
    }

    const lists: ModelsDevChatLists = {}
    for (const { provider, node } of DYNAMIC_CHAT_PROVIDERS) {
        const options = buildProviderChatList(response.data[provider])
        if (options) lists[node] = options
    }
    return lists
}
