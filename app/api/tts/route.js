import {
  TTS_MISSING_KEY,
  TTS_MODEL,
  TTS_VOICE_NAME,
  getElevenApiKey,
  getVoiceId,
  resolveSpeakText,
  synthesizeTts,
} from '../../../api/tts.js'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request) {
  const body = await request.json().catch(() => ({}))
  const text = resolveSpeakText(body)
  if (!text) {
    return Response.json({ error: 'verseText vacío' }, { status: 400 })
  }
  if (!getElevenApiKey()) {
    return Response.json({ error: TTS_MISSING_KEY }, { status: 503 })
  }
  try {
    const result = await synthesizeTts(text)
    return new Response(result.buffer, {
      status: 200,
      headers: {
        'Content-Type': result.contentType || 'audio/mpeg',
        'Cache-Control': 'private, max-age=120',
        'X-Revelatio-Voice-Id': result.voiceId || getVoiceId(),
        'X-Revelatio-Voice-Name': TTS_VOICE_NAME,
        'X-Revelatio-Tts-Model': result.model || TTS_MODEL,
        'Content-Length': String(result.buffer.length),
      },
    })
  } catch (err) {
    const status = Number(err?.status) || 502
    const message = err?.message || 'No se pudo generar la narración.'
    return Response.json({ error: message }, { status })
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      Allow: 'POST, OPTIONS',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept',
    },
  })
}
