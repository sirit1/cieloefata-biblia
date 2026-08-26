import { catalogoPublicoComentarios } from '../../../lib/comentarios.js'
import { obtenerComentarioCorpus, jsonComentarioCorpus } from '../../../lib/comentario-corpus.js'

export const runtime = 'nodejs'
export const maxDuration = 60

async function responder(passage, author) {
  const result = await obtenerComentarioCorpus({ passage, author })
  return Response.json(jsonComentarioCorpus(result))
}

export async function GET(request) {
  const url = new URL(request.url)
  if (url.searchParams.get('catalogo') === '1' || url.searchParams.get('lista') === '1') {
    return Response.json({ success: true, data: catalogoPublicoComentarios() })
  }
  const autor = url.searchParams.get('autor') || url.searchParams.get('author') || 'jamieson-fausset-brown'
  const referencia =
    url.searchParams.get('referencia') ||
    url.searchParams.get('passage') ||
    url.searchParams.get('ref') ||
    'Mateo 16:2'
  return responder(referencia, autor)
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}))
  if (body.catalogo === '1' || body.catalogo === true) {
    return Response.json({ success: true, data: catalogoPublicoComentarios() })
  }
  const autor = body.autor || body.author || 'jamieson-fausset-brown'
  const referencia = body.referencia || body.passage || body.ref || 'Mateo 16:2'
  return responder(referencia, autor)
}
