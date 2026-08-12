import legacyHandler from '../../../api/pasaje.js'

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
    headers: Object.fromEntries(request.headers.entries()),
  }
  await legacyHandler(req, response)
  return response.toResponse()
}

export async function OPTIONS() {
  return new Response(null, { status: 204 })
}
