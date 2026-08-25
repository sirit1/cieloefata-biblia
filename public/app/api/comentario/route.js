import { catalogoPublicoComentarios } from '../../../lib/comentarios.js'
import { generarComentarioGemini, envelopeComentario } from '../../../lib/comentario-gemini.js'
import { generarFallbackComentario } from '../../../lib/theological-fallback.js'

export const runtime = 'nodejs'

async function responder(passage, author, verseText = '') {
  try {
    const result = await generarComentarioGemini({ passage, author, verseText, timeoutMs: 15000 })
    const text = result?.text || generarFallbackComentario({ passage, author, verseText })
    const data = envelopeComentario(text, result?.author || author, result?.source || 'theological-engine-fallback')
    return Response.json({
      success: true,
      text,
      answer: text,
      author: result?.author || author,
      source: result?.source || 'theological-engine-fallback',
      data,
    })
  } catch (_e) {
    const fallbackText = generarFallbackComentario({ passage, author, verseText })
    const data = envelopeComentario(fallbackText, author, 'theological-engine-fallback')
    return Response.json({
      success: true,
      text: fallbackText,
      answer: fallbackText,
      author,
      source: 'theological-engine-fallback',
      data,
    })
  }
}

export async function GET(request) {
  const url = new URL(request.url)
  if (url.searchParams.get('catalogo') === '1' || url.searchParams.get('lista') === '1') {
    return Response.json({ success: true, data: catalogoPublicoComentarios() })
  }
  const autor = url.searchParams.get('autor') || url.searchParams.get('author') || 'C. H. Spurgeon'
  const referencia =
    url.searchParams.get('referencia') ||
    url.searchParams.get('passage') ||
    url.searchParams.get('ref') ||
    'Mateo 16:2'
  const verseText = url.searchParams.get('verseText') || ''
  return responder(referencia, autor, verseText)
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}))
  if (body.catalogo === '1' || body.catalogo === true) {
    return Response.json({ success: true, data: catalogoPublicoComentarios() })
  }
  const autor = body.autor || body.author || 'C. H. Spurgeon'
  const referencia = body.referencia || body.passage || body.ref || 'Mateo 16:2'
  const verseText = body.verseText || body.texto || ''
  return responder(referencia, autor, verseText)
}
