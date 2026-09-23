import axios from 'axios'
import * as fs from 'fs'
import * as path from 'path'
import { INodeOptionsValue } from './Interface'
import { MODEL_CATALOG_TIMEOUT_MS } from './modelCatalogConstants'
import { fetchModelsDevChatLists } from './modelsDevCatalog'

export enum MODEL_TYPE {
    CHAT = 'chat',
    LLM = 'llm',
    EMBEDDING = 'embedding'
}

const getModelsJSONPath = (): string => {
    const checkModelsPaths = [path.join(__dirname, '..', 'models.json'), path.join(__dirname, '..', '..', 'models.json')]
    for (const checkPath of checkModelsPaths) {
        if (fs.existsSync(checkPath)) {
            return checkPath
        }
    }
    return ''
}

const isValidUrl = (urlString: string) => {
    let url
    try {
        url = new URL(urlString)
    } catch (e) {
        return false
    }
    return url.protocol === 'http:' || url.protocol === 'https:'
}

type ModelCatalog = Record<MODEL_TYPE, any[]>

const isModelCatalog = (value: unknown): value is ModelCatalog => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false
    const catalog = value as Record<string, unknown>
    return Object.values(MODEL_TYPE).every((category) => {
        const groups = catalog[category]
        return (
            Array.isArray(groups) &&
            groups.every((group) => group && typeof group === 'object' && typeof group.name === 'string' && Array.isArray(group.models))
        )
    })
}

let modelCatalog: ModelCatalog
let baseCatalogInitialization: Promise<void> | undefined
let modelCatalogInitialization: Promise<void> | undefined
let catalogRefresh: Promise<void> | undefined

/** A configured source replaces the base only after a complete, usable catalog is loaded. */
const loadConfiguredBase = async (modelFile: string): Promise<void> => {
    try {
        let models: unknown
        if (isValidUrl(modelFile)) {
            const resp = await axios.get(modelFile, { timeout: MODEL_CATALOG_TIMEOUT_MS })
            if (resp.status !== 200) throw new Error('Error fetching model list')
            models = resp.data
        } else {
            models = JSON.parse(await fs.promises.readFile(modelFile, 'utf8'))
        }
        if (!isModelCatalog(models)) throw new Error('Invalid model catalog')
        modelCatalog = models
        console.info('[model-catalog] Configured base loaded.')
    } catch {
        // Do not log source URLs or errors that may contain credentials.
        console.warn('[model-catalog] Configured base could not be loaded; keeping bundled catalog.')
    }
}

const ensureBaseCatalog = (): Promise<void> => {
    if (baseCatalogInitialization) return baseCatalogInitialization

    const bundled: unknown = JSON.parse(fs.readFileSync(getModelsJSONPath(), 'utf8'))
    if (!isModelCatalog(bundled)) throw new Error('Invalid bundled model catalog')
    modelCatalog = bundled
    const configuredSource = process.env.MODEL_LIST_CONFIG_JSON
    baseCatalogInitialization = configuredSource !== undefined ? loadConfiguredBase(configuredSource) : Promise.resolve()
    return baseCatalogInitialization
}

/** Initialize once at startup without blocking readers on either remote source. */
export const initializeModelCatalog = (): Promise<void> => {
    if (modelCatalogInitialization) return modelCatalogInitialization

    modelCatalogInitialization = ensureBaseCatalog().then(() => {
        if (String(process.env.DISABLE_DYNAMIC_MODELS).toLowerCase() === 'true') {
            console.info('[model-catalog] Models.dev startup refresh disabled.')
            return
        }
        return refreshModelCatalog()
    })
    return modelCatalogInitialization
}

/** Refresh only the catalog; reusable by a future explicit refresh action. */
export const refreshModelCatalog = (): Promise<void> => {
    if (catalogRefresh) return catalogRefresh
    catalogRefresh = (async () => {
        try {
            await ensureBaseCatalog()
            const lists = await fetchModelsDevChatLists()
            const replacements = new Map(Object.entries(lists))
            const chat = modelCatalog.chat.map((group) => {
                const models = replacements.get(group.name)
                if (!models) return group
                replacements.delete(group.name)
                return { ...group, models }
            })
            for (const [name, models] of replacements) chat.push({ name, models })
            modelCatalog = { ...modelCatalog, chat }

            for (const name of ['chatOpenAI', 'chatAnthropic', 'chatGoogleGenerativeAI'] as const) {
                const models = lists[name]
                if (models) console.info(`[model-catalog] ${name}: loaded ${models.length} models from Models.dev.`)
                else console.warn(`[model-catalog] ${name}: no usable Models.dev list; keeping existing list.`)
            }
        } catch {
            console.warn('[model-catalog] Models.dev refresh failed; keeping existing catalog.')
        }
    })().finally(() => {
        catalogRefresh = undefined
    })
    return catalogRefresh
}

/** Reads never wait for the configured remote source; all consumers share the current catalog. */
const getRawModelFile = () => {
    void ensureBaseCatalog()
    return modelCatalog
}

const getModelConfig = async (category: MODEL_TYPE, name: string) => {
    const models = await getRawModelFile()

    const categoryModels = models[category]
    return categoryModels.find((model: INodeOptionsValue) => model.name === name)
}

export const getModelConfigByModelName = async (category: MODEL_TYPE, provider: string | undefined, name: string | undefined) => {
    const models = await getRawModelFile()

    const categoryModels = models[category]
    return getSpecificModelFromCategory(categoryModels, provider, name)
}

const getSpecificModelFromCategory = (categoryModels: any, provider: string | undefined, name: string | undefined) => {
    for (const cm of categoryModels) {
        if (cm.models && cm.name.toLowerCase() === provider?.toLowerCase()) {
            for (const m of cm.models) {
                if (m.name === name) {
                    return m
                }
            }
        }
    }
    return undefined
}

export const getModels = async (category: MODEL_TYPE, name: string) => {
    const returnData: INodeOptionsValue[] = []
    try {
        const modelConfig = await getModelConfig(category, name)
        returnData.push(...modelConfig.models)
        return returnData
    } catch (e) {
        throw new Error(`Error: getModels - ${e}`)
    }
}

export const getRegions = async (category: MODEL_TYPE, name: string) => {
    const returnData: INodeOptionsValue[] = []
    try {
        const modelConfig = await getModelConfig(category, name)
        returnData.push(...modelConfig.regions)
        return returnData
    } catch (e) {
        throw new Error(`Error: getRegions - ${e}`)
    }
}
