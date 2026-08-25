/**
 * Catch-all /api/* — mismas rutas que Express (server.js).
 * Las carpetas específicas (chat, tsk, …) tienen prioridad; esto cubre alias y POST huérfanos.
 */
import { dispatchApiRequest } from '../../../lib/api-route-map.js'

export const runtime = 'nodejs'

async function run(request, context) {
  const params = await context.params
  const slug = Array.isArray(params?.slug) ? params.slug.join('/') : ''
  return dispatchApiRequest(request, `/api/${slug}`)
}

export async function GET(request, context) {
  return run(request, context)
}

export async function POST(request, context) {
  return run(request, context)
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
    },
  })
}
