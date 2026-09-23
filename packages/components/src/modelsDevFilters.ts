export type ModelsDevModel = Record<string, unknown> & { id: string }

const hasValidModelId = (value: unknown): value is ModelsDevModel => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false
    const id = (value as Record<string, unknown>).id
    return typeof id === 'string' && id.trim().length > 0
}

const isNotDeprecatedModel = (model: ModelsDevModel): boolean => model.status !== 'deprecated'

const hasUndatedModelId = (model: ModelsDevModel): boolean => {
    // Match complete date segments, not version numbers or arbitrary digit substrings.
    const dashedDate = /(?:^|-)(?:19|20)\d{2}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])(?:-|$)/
    const compactDate = /(?:^|-)(?:19|20)\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])(?:-|$)/
    const monthYear = /(?:^|-)(?:0[1-9]|1[0-2])-(?:19|20)\d{2}(?:-|$)/
    return !dashedDate.test(model.id) && !compactDate.test(model.id) && !monthYear.test(model.id)
}

// Use narrow ID segments: e.g. "-image" matches "gpt-image-1", not "gpt-imagery".
const isNotImageModel = (model: ModelsDevModel): boolean => !/-image(?:-|$)/i.test(model.id)

const isNotEmbeddingModel = (model: ModelsDevModel): boolean => !/-embedding(?:-|$)/i.test(model.id)

const isNotLyriaModel = (model: ModelsDevModel): boolean => !/^lyria-/i.test(model.id)

const isNotVeoModel = (model: ModelsDevModel): boolean => !/^veo-/i.test(model.id)

const isNotComputerUseModel = (model: ModelsDevModel): boolean => !/-computer-use(?:-|$)/i.test(model.id)

const isNotLiveTranslateModel = (model: ModelsDevModel): boolean => !/-live-translate(?:-|$)/i.test(model.id)

const isNotRealtimeModel = (model: ModelsDevModel): boolean => !/(?:^|-)realtime(?:-|$)/i.test(model.id)

const isNotLiveModel = (model: ModelsDevModel): boolean => !/(?:^|-)live(?:-|$)/i.test(model.id)

const isNotTtsModel = (model: ModelsDevModel): boolean => !/(?:^|-)tts(?:-|$)/i.test(model.id)

const isNotAudioModel = (model: ModelsDevModel): boolean => !/(?:^|-)audio(?:-|$)/i.test(model.id)

const isNotTranscriptionModel = (model: ModelsDevModel): boolean => !/(?:^|-)transcribe(?:-|$)/i.test(model.id)

const isNotWhisperModel = (model: ModelsDevModel): boolean => !/(?:^|-)whisper(?:-|$)/i.test(model.id)

const hasTextOutputOrUnknownModalities = (model: ModelsDevModel): boolean => {
    const modalities = model.modalities
    if (!modalities || typeof modalities !== 'object' || Array.isArray(modalities)) return true

    const output = (modalities as Record<string, unknown>).output
    // Incomplete metadata is not evidence that a model cannot generate text.
    if (!Array.isArray(output) || output.length === 0 || !output.every((value) => typeof value === 'string' && value.length > 0)) {
        return true
    }
    return output.includes('text')
}

/** Filter only dynamic chat candidates; preserve source records and their order. */
export const filterModelsDevChatModels = (models: unknown[]): ModelsDevModel[] => {
    return models
        .filter(hasValidModelId)
        .filter(isNotDeprecatedModel)
        .filter(hasUndatedModelId)
        .filter(isNotImageModel)
        .filter(isNotEmbeddingModel)
        .filter(isNotLyriaModel)
        .filter(isNotVeoModel)
        .filter(isNotComputerUseModel)
        .filter(isNotLiveTranslateModel)
        .filter(isNotRealtimeModel)
        .filter(isNotLiveModel)
        .filter(isNotTtsModel)
        .filter(isNotAudioModel)
        .filter(isNotTranscriptionModel)
        .filter(isNotWhisperModel)
        .filter(hasTextOutputOrUnknownModalities)
}
