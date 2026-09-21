import fs from 'fs'
import path from 'path'
import ts from 'typescript'
import { isPublicApiRequest } from './api-auth'

jest.mock('../utils/validateKey', () => ({ validateAPIKey: jest.fn() }))

const parse = (file: string) => ts.createSourceFile(file, fs.readFileSync(file,'utf8'), ts.ScriptTarget.Latest, true)
const strings = (node: ts.Node): string[] => ts.isStringLiteral(node) ? [node.text] :
    ts.isArrayLiteralExpression(node) ? node.elements.flatMap(strings) : []
const guards = new Set(['checkPermission','checkAnyPermission','checkFlowPermission','checkUpsertHistoryDelete','requireOwner','requireFlowEdit'])
const isGuard = (node: ts.Node) => guards.has(ts.isCallExpression(node) ? node.expression.getText() : node.getText())

it('declares authorization for every mounted management route', () => {
    const directory = path.resolve(__dirname,'../routes')
    const index = parse(path.join(directory,'index.ts'))
    const imports: Record<string,string> = {}
    for (const statement of index.statements) {
        if (ts.isImportDeclaration(statement) && statement.importClause?.name && ts.isStringLiteral(statement.moduleSpecifier)) {
            imports[statement.importClause.name.text] = statement.moduleSpecifier.text
        }
    }
    const missing: string[] = []
    for (const statement of index.statements) {
        if (!ts.isExpressionStatement(statement) || !ts.isCallExpression(statement.expression)) continue
        const mount = statement.expression
        if (mount.expression.getText() !== 'router.use' || mount.arguments.length !== 2) continue
        const prefix = strings(mount.arguments[0])[0]
        const module = imports[mount.arguments[1].getText()]
        if (!module) throw new Error('Unknown mounted router ' + mount.arguments[1].getText())
        const base = path.resolve(directory,module)
        const file = fs.existsSync(base + '.ts') ? base + '.ts' : path.join(base,'index.ts')
        const source = parse(file)
        const calls = source.statements.filter(ts.isExpressionStatement).map((node) => node.expression).filter(ts.isCallExpression)
        const routerGuarded = calls.some((call) => call.expression.getText() === 'router.use' && call.arguments.some(isGuard))
        for (const call of calls) {
            const method = call.expression.getText().replace('router.','').toUpperCase()
            if (!['GET','POST','PUT','PATCH','DELETE','ALL','OPTIONS'].includes(method)) continue
            if (routerGuarded || call.arguments.slice(1).some(isGuard)) continue
            for (const route of strings(call.arguments[0])) {
                const url = ('/api/v1' + prefix + route).replace(/:[A-Za-z]+/g,'sample')
                if (isPublicApiRequest(method === 'ALL' ? 'POST' : method,url)) continue
                // Legacy parameterless aliases reach a controller that rejects the missing ID.
                const invalidAliases = ['POST /api/v1/prediction/', 'GET /api/v1/node-icon/',
                    'GET /api/v1/components-credentials-icon/', 'GET /api/v1/verify/apikey/', 'PUT /api/v1/chatmessage/abort/']
                if (invalidAliases.includes(method + ' ' + url)) continue
                missing.push(method + ' ' + url)
            }
        }
    }
    expect(missing).toEqual([])
})
