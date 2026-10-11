import logger from '../utils/logger'
import { initializeModelCatalog } from 'flowise-components'
import { BaseCommand } from './base'
import { QueueEvents, QueueEventsListener } from 'bullmq'

interface CustomListener extends QueueEventsListener {
    abort: (args: { id: string }, id: string) => void
}

export default class Worker extends BaseCommand {
    predictionWorkerId: string
    upsertionWorkerId: string
    scheduleWorkerId: string

    async run(): Promise<void> {
        const { QueueManager } = await import('../queue/QueueManager')
        logger.info('Starting Flowise Worker...')
        void initializeModelCatalog(logger)

        const { appDataSource, telemetry, componentNodes, cachePool, abortControllerPool, usageCacheManager } = await this.prepareData()

        const queueManager = QueueManager.getInstance()
        queueManager.setupAllQueues({
            componentNodes,
            telemetry,
            cachePool,
            appDataSource,
            abortControllerPool,
            usageCacheManager
        })

        /** Prediction */
        const predictionQueue = queueManager.getQueue('prediction')
        const predictionWorker = predictionQueue.createWorker()
        this.predictionWorkerId = predictionWorker.id
        logger.info(`Prediction Worker ${this.predictionWorkerId} created`)

        const predictionQueueName = predictionQueue.getQueueName()
        const queueEvents = new QueueEvents(predictionQueueName, { connection: queueManager.getConnection() })

        queueEvents.on<CustomListener>('abort', async ({ id }: { id: string }) => {
            abortControllerPool.abort(id)
        })

        /** Upsertion */
        const upsertionQueue = queueManager.getQueue('upsert')
        const upsertionWorker = upsertionQueue.createWorker()
        this.upsertionWorkerId = upsertionWorker.id
        logger.info(`Upsertion Worker ${this.upsertionWorkerId} created`)

        /** Schedule */
        const scheduleQueue = queueManager.getQueue('schedule')
        const scheduleWorker = scheduleQueue.createWorker()
        this.scheduleWorkerId = scheduleWorker.id
        logger.info(`Schedule Worker ${this.scheduleWorkerId} created`)

        // Keep the process running
        process.stdin.resume()
    }

    async prepareData() {
        const { getDataSource } = await import('../DataSource')
        const { Telemetry } = await import('../utils/telemetry')
        const { NodesPool } = await import('../NodesPool')
        const { CachePool } = await import('../CachePool')
        const { AbortControllerPool } = await import('../AbortControllerPool')
        const { UsageCacheManager } = await import('../UsageCacheManager')
        // Init database
        const appDataSource = getDataSource()
        await appDataSource.initialize()
        await appDataSource.runMigrations({ transaction: 'each' })

        // Initialize abortcontroller pool
        const abortControllerPool = new AbortControllerPool()

        // Init telemetry
        const telemetry = new Telemetry()

        // Initialize nodes pool
        const nodesPool = new NodesPool()
        await nodesPool.initialize()

        // Initialize cache pool
        const cachePool = new CachePool()

        // Initialize usage cache manager
        const usageCacheManager = await UsageCacheManager.getInstance()

        return {
            appDataSource,
            telemetry,
            componentNodes: nodesPool.componentNodes,
            cachePool,
            abortControllerPool,
            usageCacheManager
        }
    }

    async catch(error: Error) {
        if (error.stack) logger.error(error.stack)
        await new Promise((resolve) => {
            setTimeout(resolve, 1000)
        })
        await this.failExit()
    }

    async stopProcess() {
        try {
            const { QueueManager } = await import('../queue/QueueManager')
            const queueManager = QueueManager.getInstance()
            const predictionWorker = queueManager.getQueue('prediction').getWorker()
            logger.info(`Shutting down Flowise Prediction Worker ${this.predictionWorkerId}...`)
            await predictionWorker.close()

            const upsertWorker = queueManager.getQueue('upsert').getWorker()
            logger.info(`Shutting down Flowise Upsertion Worker ${this.upsertionWorkerId}...`)
            await upsertWorker.close()

            const scheduleWorker = queueManager.getQueue('schedule').getWorker()
            logger.info(`Shutting down Flowise Schedule Worker ${this.scheduleWorkerId}...`)
            await scheduleWorker.close()
        } catch (error) {
            logger.error('There was an error shutting down Flowise Worker...', error)
            await this.failExit()
        }

        await this.gracefullyExit()
    }
}
