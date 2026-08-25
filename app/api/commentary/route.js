import { generarComentarioGemini, envelopeComentario } from '../../../lib/comentario-gemini.js'
import { generarFallbackComentario } from '../../../lib/theological-fallback.js'

export const runtime = 'nodejs'

export async function POST(request) {
  const body = await request.json().catch(() => ({}))
  const passage = body.passage || body.referencia || body.ref || 'Mateo 16:2'
  const author = body.author || body.autor || 'C. H. Spurgeon'
  const verseText = body.verseText || body.texto || body.text || ''

  try {
    const result = await generarComentarioGemini({
      passage,
      author,
      verseText,
      timeoutMs: 15000,
    })
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
