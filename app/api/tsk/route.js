import legacyHandler from '../../../api/tsk.js'

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
      return Response.json(payload, { status, headers })
    },
  }
}

async function run(request, method) {
  const response = bridge()
  const body = method === 'GET'
    ? Object.fromEntries(new URL(request.url).searchParams.entries())
    : await request.json().catch(() => ({}))
  if (!body.consulta) {
    body.consulta = body.passage || body.referencia || body.ref || ''
  }
  await legacyHandler(
    {
      method,
      body,
      query: body,
      url: '/api/tsk',
      headers: Object.fromEntries(request.headers.entries()),
    },
    response
  )
  return response.response()
}

export async function GET(request) {
  return run(request, 'GET')
}

export async function POST(request) {
  return run(request, 'POST')
}

export async function OPTIONS() {
  return new Response(null, { status: 204 })
}
