import { nodeHandlers } from '../../../lib/node-api-bridge.js'
import legacyHandler from '../../../api/lente-elite.js'

export const runtime = 'nodejs'

const handlers = nodeHandlers(legacyHandler, '/api/lente-elite')
export const GET = handlers.GET
export const POST = handlers.POST
export const OPTIONS = handlers.OPTIONS
