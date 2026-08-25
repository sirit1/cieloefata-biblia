export { POST } from '../../../api/chat.js'

export const runtime = 'nodejs'

export function OPTIONS() {
  return new Response(null, { status: 204 })
}
