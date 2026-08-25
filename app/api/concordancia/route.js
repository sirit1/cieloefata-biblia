import { nodeHandlers } from '../../../lib/node-api-bridge.js'
import legacyHandler from '../../../api/concordancia.js'

export const runtime = 'nodejs'

const handlers = nodeHandlers(legacyHandler, '/api/concordancia')
export const GET = handlers.GET
export const POST = handlers.POST
export const OPTIONS = handlers.OPTIONS
