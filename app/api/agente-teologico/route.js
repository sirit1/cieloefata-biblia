/**
 * Next.js App Router wrapper → /api/agente-teologico
 */
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local', override: true, quiet: true })
dotenv.config({ path: '.env', quiet: true })

import { loadProjectEnv } from '../../../lib/load-env.js'
loadProjectEnv()

import handler from '../../../api/agente-teologico.js'

export const runtime = 'nodejs'

function nodeRes() {
  const headers = new Headers()
  let status = 200
  let payload = null
  return {
    setHeader(name, value) {
      headers.set(name, String(value))
      return this
    },
    status(code) {
      status = code
      return this
    },
    json(value) {
      payload = value
      return this
    },
    end() {
      return this
    },
    toResponse() {
      return Response.json(payload ?? {}, { status, headers })
    },
  }
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}))
  const req = {
    method: 'POST',
    query: {},
    body,
    headers: Object.fromEntries(request.headers.entries()),
  }
  const response = nodeRes()
  await handler(req, response)
  return response.toResponse()
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: { Allow: 'POST, OPTIONS' },
  })
}
