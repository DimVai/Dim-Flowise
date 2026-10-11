import logger from '../utils/logger'
import { BaseCommand } from './base'

export default class Start extends BaseCommand {
    private server: typeof import('../index') | undefined

    async run(): Promise<void> {
        const DataSource = await import('../DataSource')
        this.server = await import('../index')
        logger.info('Starting Flowise...')
        await DataSource.init()
        await this.server.start()
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
            logger.info(`Shutting down Flowise...`)
            const serverApp = this.server?.getInstance()
            if (serverApp) await serverApp.stopApp()
        } catch (error) {
            logger.error('There was an error shutting down Flowise...', error)
            await this.failExit()
        }

        await this.gracefullyExit()
    }
}
