import { nodeHandlers } from '../../../lib/node-api-bridge.js'
import legacyHandler from '../../../api/tsk.js'

export const runtime = 'nodejs'

const handlers = nodeHandlers(legacyHandler, '/api/tsk')
export const GET = handlers.GET
export const POST = handlers.POST
export const OPTIONS = handlers.OPTIONS
