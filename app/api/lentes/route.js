import legacyHandler from '../../../api/lentes-oficios.js'

export const runtime = 'nodejs'

function bridge() {
  const headers = new Headers()
  let status = 200
  let payload = {}
  return {
    setHeader(name, value) { headers.set(name, String(value)) },
    status(code) { status = code; return this },
    json(value) { payload = value; return this },
    response() { return Response.json(payload, { status, headers }) },
  }
}

export async function POST(request) {
  const response = bridge()
  const body = await request.json().catch(() => ({}))
  await legacyHandler({ method: 'POST', body, headers: Object.fromEntries(request.headers.entries()), url: '/api/lentes' }, response)
  return response.response()
}

export async function GET(request) {
  const response = bridge()
  const url = new URL(request.url)
  await legacyHandler({ method: 'GET', query: Object.fromEntries(url.searchParams), body: {}, headers: {}, url: '/api/lentes' }, response)
  return response.response()
}

export async function OPTIONS() { return new Response(null, { status: 204 }) }
