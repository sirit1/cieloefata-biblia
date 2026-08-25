import { nodeHandlers } from '../../../lib/node-api-bridge.js'
import legacyHandler from '../../../api/study-engine.js'

export const runtime = 'nodejs'

const handlers = nodeHandlers(legacyHandler, '/api/concordance')
export const GET = handlers.GET
export const POST = handlers.POST
export const OPTIONS = handlers.OPTIONS
