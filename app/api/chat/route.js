/**
 * Next.js App Router → /api/chat (mismo handler Node que Express).
 */
import handler from '../../../api/chat.js'
import { nodeHandlers } from '../../../lib/node-api-bridge.js'

export const runtime = 'nodejs'

export const { GET, POST, OPTIONS } = nodeHandlers(handler, '/api/chat')
