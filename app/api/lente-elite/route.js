import legacyHandler from '../../../api/lente-elite.js'

export const runtime = 'nodejs'
export const maxDuration = 60

function bridge() {
  const headers = new Headers()
  let status = 200
  let payload = {}
  return {
    setHeader(name, value) {
      headers.set(name, String(value))
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
    response() {
      return Response.json(payload, { status, headers })
    },
  }
}

function queryAsBody(request) {
  const url = new URL(request.url)
  const body = {}
  url.searchParams.forEach((value, key) => {
    body[key] = value
  })
  return body
}

export async function POST(request) {
  const response = bridge()
  const body = await request.json().catch(() => ({}))
  await legacyHandler(
    {
      method: 'POST',
      body,
      url: '/api/lente-elite',
      path: '/api/lente-elite',
      headers: Object.fromEntries(request.headers.entries()),
    },
    response,
  )
  return response.response()
}

export async function GET(request) {
  const response = bridge()
  await legacyHandler(
    {
      method: 'GET',
      body: queryAsBody(request),
      query: queryAsBody(request),
      url: '/api/lente-elite',
      path: '/api/lente-elite',
      headers: Object.fromEntries(request.headers.entries()),
    },
    response,
  )
  return response.response()
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
