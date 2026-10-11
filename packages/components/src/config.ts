import os from 'os'
import path from 'path'

export interface FlowiseConfig {
    FLOWISE_DATA_PATH: string
    DATABASE_PATH: string
    SECRETKEY_PATH: string
    FLOWISE_SECRETKEY_OVERWRITE: string
    BLOB_STORAGE_PATH: string
    LOG_PATH: string
    UPLOAD_PATH: string
    VECTORSTORE_PATH: string
}

// Initialized explicitly after environment files and CLI overrides have loaded.
export let config: Readonly<FlowiseConfig>

export const initializeConfig = (): Readonly<FlowiseConfig> => {
    if (config) return config

    const dataPath = path.resolve(process.env.FLOWISE_DATA_PATH || path.join(os.homedir(), '.flowise'))
    const storagePath = path.resolve(process.env.BLOB_STORAGE_PATH || path.join(dataPath, 'storage'))
    const encryptionKey = process.env.FLOWISE_SECRETKEY_OVERWRITE || process.env.FLOWISE_SECRET
    if (!encryptionKey) throw new Error('FLOWISE_SECRET must be set when FLOWISE_SECRETKEY_OVERWRITE is not provided')

    // config is configured so its properties are always defined.
    config = Object.freeze({
        FLOWISE_DATA_PATH: dataPath,
        DATABASE_PATH: path.resolve(process.env.DATABASE_PATH || dataPath),
        // Retained for upstream-compatible secret-file helpers; no longer selects the active credential encryption key.
        SECRETKEY_PATH: path.resolve(process.env.SECRETKEY_PATH || dataPath),
        FLOWISE_SECRETKEY_OVERWRITE: encryptionKey,
        BLOB_STORAGE_PATH: storagePath,
        LOG_PATH: path.resolve(process.env.LOG_PATH || path.join(dataPath, 'logs')),
        UPLOAD_PATH: path.join(storagePath, 'uploads'),
        VECTORSTORE_PATH: path.join(dataPath, 'vectorstore')
    })

    return config
}
