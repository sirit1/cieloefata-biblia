import { estadoVoz, sintetizarVoz } from '../../../api/voz.js'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET() {
  return Response.json(estadoVoz())
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}))
  const req = {
    method: 'POST',
    body,
    headers: Object.fromEntries(request.headers.entries()),
  }

  try {
    const result = await sintetizarVoz({
      texto: body.texto || body.text,
      voz: body.voz,
      previous: body.previous,
      estilo: body.estilo,
      req,
    })

    if (result.skipped || result.status === 204) {
      return new Response(null, { status: 204 })
    }
    if (result.error) {
      return Response.json({ error: result.error }, { status: result.status || 502 })
    }

    const headers = {
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'private, max-age=120',
      'X-Revelatio-Voz': result.voz,
    }
    if (result.buffer?.length) headers['Content-Length'] = String(result.buffer.length)
    return new Response(result.buffer, { status: 200, headers })
  } catch (err) {
    console.warn('[voz]', err?.message || err)
    return Response.json({ error: 'El motor de voz no respondió.' }, { status: 502 })
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204 })
}
