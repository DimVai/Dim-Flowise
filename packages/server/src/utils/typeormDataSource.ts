import { initializeConfig } from 'flowise-components'
import { DataSource } from 'typeorm'
import { initializeLogger } from './logger'

initializeConfig()
initializeLogger()

// Load database dependencies only after the shared config is ready.
const { getDataSource } = require('../DataSource') as typeof import('../DataSource')

export const dataSource: DataSource = getDataSource()
