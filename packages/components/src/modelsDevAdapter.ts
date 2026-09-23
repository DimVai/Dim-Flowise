import type { INodeOptionsValue } from './Interface'
import type { ModelsDevModel } from './modelsDevFilters'

export interface ModelsDevChatOption extends INodeOptionsValue {
    input_cost: number
    output_cost: number
}

const getReleaseTimestamp = (value: unknown): number | undefined => {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}(?:-\d{2})?$/.test(value)) return undefined

    // Month-only dates sort as the first day of that month.
    const date = value.length === 7 ? `${value}-01` : value
    const timestamp = Date.parse(`${date}T00:00:00.000Z`)
    // Reject impossible dates that Date.parse may normalize, such as February 30.
    if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString().slice(0, 10) !== date) return undefined
    return timestamp
}

const sortByReleaseDateDescending = (models: ModelsDevModel[]): ModelsDevModel[] => {
    return models
        .map((model) => ({ model, timestamp: getReleaseTimestamp(model.release_date) }))
        .sort((left, right) => {
            if (left.timestamp === right.timestamp) return 0
            if (left.timestamp === undefined) return 1
            if (right.timestamp === undefined) return -1
            return right.timestamp - left.timestamp
        })
        .map(({ model }) => model)
}

const convertCostPerMillionToPerToken = (value: unknown): number => {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return 0
    return Number((value / 1_000_000).toFixed(8))
}

const convertToFlowiseChatOption = (model: ModelsDevModel): ModelsDevChatOption => {
    const option: ModelsDevChatOption = {
        name: model.id,
        label: typeof model.name === 'string' && model.name.trim() ? model.name : model.id,
        // Match the existing Flowise cost consumers: missing or invalid prices become zero.
        input_cost: 0,
        output_cost: 0
    }

    if (typeof model.description === 'string' && model.description.trim()) {
        option.description = model.description
    }

    if (model.cost && typeof model.cost === 'object' && !Array.isArray(model.cost)) {
        const cost = model.cost as Record<string, unknown>
        option.input_cost = convertCostPerMillionToPerToken(cost.input)
        option.output_cost = convertCostPerMillionToPerToken(cost.output)
    }

    return option
}

/** Convert already filtered candidates without changing source records or array order. */
export const buildModelsDevChatOptions = (models: ModelsDevModel[]): ModelsDevChatOption[] => {
    const sortedModels = sortByReleaseDateDescending(models)
    return sortedModels.map(convertToFlowiseChatOption)
}
