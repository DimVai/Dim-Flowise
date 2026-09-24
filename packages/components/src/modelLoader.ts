import axios from 'axios'
import * as fs from 'fs'
import * as path from 'path'
import { INodeOptionsValue } from './Interface'
import { MODEL_CATALOG_TIMEOUT_MS } from './modelCatalogConstants'
import { fetchModelsDevChatLists } from './modelsDevCatalog'
import { getUserHome } from './utils'

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

type ModelCatalog = Record<MODEL_TYPE, any[]>

export interface ModelCatalogLogger {
    info(message: string): void
    warn(message: string): void
}

// The server/worker supplies its shared logger; standalone component consumers can use console.
let catalogLogger: ModelCatalogLogger = console

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

const getSavedCatalogPath = (): string => {
    const directory = process.env.DATABASE_PATH || path.join(getUserHome(), '.flowise')
    return path.join(directory, 'model-catalog.json')
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

/** A missing or unusable saved catalog leaves the bundled base in place. */
const loadSavedCatalog = async (): Promise<boolean> => {
    try {
        const saved: unknown = JSON.parse(await fs.promises.readFile(getSavedCatalogPath(), 'utf8'))
        if (!isModelCatalog(saved)) throw new Error('Invalid saved model catalog')
        modelCatalog = saved
        catalogLogger.info('[model-catalog] Saved catalog loaded.')
        return true
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
            catalogLogger.warn('[model-catalog] Saved catalog could not be loaded; keeping bundled catalog.')
        }
        return false
    }
}

/** The explicit Flowise catalog source replaces the active base only when usable. */
const loadConfiguredBase = async (modelFile: string): Promise<void> => {
    try {
        let models: unknown
        if (isValidUrl(modelFile)) {
            const response = await axios.get(modelFile, { timeout: MODEL_CATALOG_TIMEOUT_MS })
            if (response.status !== 200) throw new Error('Error fetching model list')
            models = response.data
        } else {
            models = JSON.parse(await fs.promises.readFile(modelFile, 'utf8'))
        }
        if (!isModelCatalog(models)) throw new Error('Invalid model catalog')
        modelCatalog = models
        catalogLogger.info('[model-catalog] Configured base loaded.')
    } catch {
        // Do not log source URLs or errors that may contain credentials.
        catalogLogger.warn('[model-catalog] Configured base could not be loaded; keeping existing catalog.')
    }
}

/** Replace a completed snapshot atomically so an interrupted write cannot corrupt the previous one. */
const saveCatalog = async (catalog: ModelCatalog): Promise<void> => {
    const destination = getSavedCatalogPath()
    const temporary = `${destination}.${process.pid}.${Date.now()}.tmp`
    try {
        await fs.promises.mkdir(path.dirname(destination), { recursive: true })
        await fs.promises.writeFile(temporary, JSON.stringify(catalog, null, 2), 'utf8')
        await fs.promises.rename(temporary, destination)
        catalogLogger.info('[model-catalog] Updated catalog saved.')
    } catch {
        catalogLogger.warn('[model-catalog] Updated catalog could not be saved; keeping in-memory catalog.')
        try {
            await fs.promises.unlink(temporary)
        } catch {
            // The temporary file may not exist or may be inaccessible for the same reason.
        }
    }
}

const ensureBaseCatalog = (): Promise<void> => {
    if (baseCatalogInitialization) return baseCatalogInitialization

    const bundled: unknown = JSON.parse(fs.readFileSync(getModelsJSONPath(), 'utf8'))
    if (!isModelCatalog(bundled)) throw new Error('Invalid bundled model catalog')
    modelCatalog = bundled
    baseCatalogInitialization = loadSavedCatalog().then(async () => {
        const configuredSource = process.env.MODEL_LIST_CONFIG_JSON
        if (configuredSource !== undefined) await loadConfiguredBase(configuredSource)
    })
    return baseCatalogInitialization
}

/** Initialize the saved and configured bases, then refresh once during startup. */
export const initializeModelCatalog = (logger?: ModelCatalogLogger): Promise<void> => {
    if (logger) catalogLogger = logger
    if (modelCatalogInitialization) return modelCatalogInitialization

    modelCatalogInitialization = ensureBaseCatalog().then(() => {
        if (String(process.env.DISABLE_DYNAMIC_MODELS).toLowerCase() === 'true') {
            catalogLogger.info('[model-catalog] Models.dev startup refresh disabled.')
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

            const loaded: string[] = []
            const retained: string[] = []
            const providers = [
                ['chatOpenAI', 'OpenAI'],
                ['chatAnthropic', 'Anthropic'],
                ['chatGoogleGenerativeAI', 'Google']
            ] as const
            for (const [name, label] of providers) {
                const models = lists[name]
                if (models) loaded.push(`${label} (${models.length} models)`)
                else retained.push(label)
            }
            if (loaded.length) catalogLogger.info(`[model-catalog] Dynamic Models loaded from models.dev: ${loaded.join(', ')}`)
            if (retained.length)
                catalogLogger.warn(
                    `[model-catalog] Dynamic Models: no usable models.dev list for ${retained.join(', ')}; keeping existing lists.`
                )
            if (loaded.length) await saveCatalog(modelCatalog)
        } catch {
            catalogLogger.warn('[model-catalog] Models.dev refresh failed; keeping existing catalog.')
        }
    })().finally(() => {
        catalogRefresh = undefined
    })
    return catalogRefresh
}

/** Readers use the current catalog while base sources load; all consumers share it. */
const getRawModelFile = () => {
    void ensureBaseCatalog()
    return modelCatalog
}

const getModelConfig = async (category: MODEL_TYPE, name: string) => {
    const models = await getRawModelFile()

    const categoryModels = models[category]
    return categoryModels.find((model: INodeOptionsValue) => model.name === name)
}

/** Synchronous read for node definitions created after catalog initialization. */
export const getLoadedModels = (category: MODEL_TYPE, name: string): INodeOptionsValue[] => {
    return modelCatalog?.[category]?.find((group) => group.name === name)?.models ?? []
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
