import { obtenerComentarioCorpus, jsonComentarioCorpus } from '../../../lib/comentario-corpus.js'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request) {
  const body = await request.json().catch(() => ({}))
  const passage = body.passage || body.referencia || body.ref || 'Mateo 16:2'
  const author = body.author || body.autor || 'jamieson-fausset-brown'
  const result = await obtenerComentarioCorpus({ passage, author })
  return Response.json(jsonComentarioCorpus(result))
}

export async function GET(request) {
  const url = new URL(request.url)
  const passage =
    url.searchParams.get('referencia') ||
    url.searchParams.get('passage') ||
    url.searchParams.get('ref') ||
    'Mateo 16:2'
  const author = url.searchParams.get('author') || url.searchParams.get('autor') || 'jamieson-fausset-brown'
  const result = await obtenerComentarioCorpus({ passage, author })
  return Response.json(jsonComentarioCorpus(result))
}
