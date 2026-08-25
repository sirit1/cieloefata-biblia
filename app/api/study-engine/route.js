import legacyHandler from '../../../api/study-engine.js'

export const runtime = 'nodejs'

function bridge() {
  const headers = new Headers({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
  })
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
      return Response.json(payload ?? {}, { status, headers })
    },
  }
}

export async function POST(request) {
  const response = bridge()
  const body = await request.json().catch(() => ({}))
  await legacyHandler(
    {
      method: 'POST',
      body,
      path: '/api/study-engine',
      url: '/api/study-engine',
      headers: Object.fromEntries(request.headers.entries()),
    },
    response
  )
  return response.response()
}

export async function GET(request) {
  const response = bridge()
  const query = Object.fromEntries(new URL(request.url).searchParams.entries())
  await legacyHandler(
    {
      method: 'GET',
      query,
      body: query,
      path: '/api/study-engine',
      url: '/api/study-engine',
      headers: Object.fromEntries(request.headers.entries()),
    },
    response
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
