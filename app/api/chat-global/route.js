/**
 * Next.js App Router → /api/chat-global (mismo contrato que /api/chat).
 */
import handler from '../../../api/chat-global.js'
import { nodeHandlers } from '../../../lib/node-api-bridge.js'

export const runtime = 'nodejs'

export const { GET, POST, OPTIONS } = nodeHandlers(handler, '/api/chat-global')
