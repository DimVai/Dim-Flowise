import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'
import { COMMUNITY_WORKSPACE_ID } from '../../community-auth/constants'

const WORKSPACE_SCOPED_TABLES = [
    'chat_flow',
    'credential',
    'tool',
    'assistant',
    'variable',
    'document_store',
    'dataset',
    'evaluation',
    'evaluator',
    'apikey',
    'custom_template',
    'execution',
    'custom_mcp_server',
    'schedule_record',
    'schedule_trigger_log'
]

const addWorkspaceColumnIfMissing = async (queryRunner: QueryRunner, tableName: string): Promise<void> => {
    if (!(await queryRunner.hasTable(tableName)) || (await queryRunner.hasColumn(tableName, 'workspaceId'))) return

    await queryRunner.addColumn(
        tableName,
        new TableColumn({
            name: 'workspaceId',
            type: 'varchar',
            isNullable: false,
            default: `'${COMMUNITY_WORKSPACE_ID}'`
        })
    )
}

/**
 * Adds the community workspace column before later upstream migrations rebuild
 * chat_flow and expect that column to exist. Tables created afterwards are
 * covered by the final normalization migration below.
 */
export class CommunityWorkspaceFoundation1755000000000 implements MigrationInterface {
    name = 'CommunityWorkspaceFoundation1755000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        for (const tableName of WORKSPACE_SCOPED_TABLES) {
            await addWorkspaceColumnIfMissing(queryRunner, tableName)
        }
    }

    public async down(): Promise<void> {
        // The workspace column is part of the community data-scoping model.
    }
}

export class CommunitySingleWorkspace1777000000000 implements MigrationInterface {
    name = 'CommunitySingleWorkspace1777000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        for (const tableName of WORKSPACE_SCOPED_TABLES) {
            if (!(await queryRunner.hasTable(tableName))) continue

            await addWorkspaceColumnIfMissing(queryRunner, tableName)

            const table = await queryRunner.getTable(tableName)
            const workspaceForeignKeys = table?.foreignKeys.filter((foreignKey) => foreignKey.columnNames.includes('workspaceId')) ?? []
            for (const foreignKey of workspaceForeignKeys) {
                await queryRunner.dropForeignKey(tableName, foreignKey)
            }

            await queryRunner.query(
                `UPDATE ${queryRunner.connection.driver.escape(tableName)} SET ${queryRunner.connection.driver.escape(
                    'workspaceId'
                )} = '${COMMUNITY_WORKSPACE_ID}'`
            )
        }
    }

    public async down(): Promise<void> {
        // Single-workspace normalization cannot be reversed without restoring
        // the removed organization/workspace model and its data.
    }
}
