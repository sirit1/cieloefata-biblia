import legacyHandler from '../../../api/lexico.js'

export const runtime = 'nodejs'

function createResponse() {
  const headers = new Headers()
  let status = 200
  let payload = null
  return {
    setHeader(name, value) { headers.set(name, String(value)) },
    status(code) { status = code; return this },
    json(value) { payload = value; return this },
    toResponse() { return Response.json(payload ?? {}, { status, headers }) },
  }
}

export async function POST(request) {
  const response = createResponse()
  const body = await request.json().catch(() => ({}))
  const req = {
    method: 'POST',
    body,
    query: body,
    headers: Object.fromEntries(request.headers.entries()),
  }
  await legacyHandler(req, response)
  return response.toResponse()
}

export async function GET(request) {
  const response = createResponse()
  const query = Object.fromEntries(new URL(request.url).searchParams.entries())
  const req = {
    method: 'GET',
    query,
    body: query,
    headers: Object.fromEntries(request.headers.entries()),
  }
  await legacyHandler(req, response)
  return response.toResponse()
}

export async function OPTIONS() {
  return new Response(null, { status: 204 })
}
