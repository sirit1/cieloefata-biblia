import legacyHandler from '../../../api/referencias.js'

export const runtime = 'nodejs'

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
      return Response.json(payload ?? {}, { status, headers })
    },
  }
}

function toReq(request, body) {
  const url = new URL(request.url)
  return {
    method: request.method,
    body,
    query: Object.fromEntries(url.searchParams.entries()),
    headers: Object.fromEntries(request.headers.entries()),
  }
}

export async function POST(request) {
  const response = bridge()
  const body = await request.json().catch(() => ({}))
  if (!body.consulta && (body.passage || body.referencia || body.ref)) {
    body.consulta = body.passage || body.referencia || body.ref
  }
  await legacyHandler(toReq(request, body), response)
  return response.response()
}

export async function GET(request) {
  const response = bridge()
  const url = new URL(request.url)
  const query = Object.fromEntries(url.searchParams.entries())
  const body = {
    consulta: query.consulta || query.passage || query.referencia || query.ref || query.q || '',
  }
  await legacyHandler({ ...toReq(request, body), query, method: 'GET' }, response)
  return response.response()
}

export async function OPTIONS() {
  return new Response(null, { status: 204 })
}
