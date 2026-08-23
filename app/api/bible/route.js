import legacyHandler from '../../../api/bible.js'

export const runtime = 'nodejs'

function createResponse() {
  const headers = new Headers({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
  })
  let status = 200
  let payload = null
  let ended = false
  return {
    setHeader(name, value) { headers.set(name, String(value)) },
    status(code) { status = code; return this },
    json(value) { payload = value; return this },
    end() { ended = true; return this },
    toResponse() {
      if (ended && payload == null) {
        return new Response(null, { status, headers })
      }
      return Response.json(payload ?? {}, { status, headers })
    },
  }
}

export async function GET(request) {
  const url = new URL(request.url)
  const query = Object.fromEntries(url.searchParams.entries())
  const response = createResponse()
  const req = {
    method: 'GET',
    query,
    headers: Object.fromEntries(request.headers.entries()),
  }
  await legacyHandler(req, response)
  return response.toResponse()
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept',
    },
  })
}
