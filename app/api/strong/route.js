import handler from '../../../api/strong.js'

export const runtime = 'nodejs'

function nodeRes() {
  const headers = new Headers()
  let status = 200
  let payload = null
  return {
    setHeader(name, value) { headers.set(name, String(value)); return this },
    status(code) { status = code; return this },
    json(value) { payload = value; return this },
    toResponse() { return Response.json(payload ?? {}, { status, headers }) },
  }
}

export async function GET(request) {
  const url = new URL(request.url)
  const req = {
    method: 'GET',
    query: Object.fromEntries(url.searchParams.entries()),
    body: {},
    headers: Object.fromEntries(request.headers.entries()),
  }
  const response = nodeRes()
  await handler(req, response)
  return response.toResponse()
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
