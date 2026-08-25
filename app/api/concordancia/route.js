import { createClient } from '@supabase/supabase-js'
import { fetchConTimeout, resaltarCoincidencia, VERSIONES, LIBROS } from '../../../lib/biblia.js'

const MAX_RESULTADOS = 40

function getSupabaseConfig() {
  return {
    url: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  }
}

async function authenticate(request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  const { url, anonKey } = getSupabaseConfig()
  if (!token || !url || !anonKey) return null

  const supabase = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data, error } = await supabase.auth.getUser(token)
  return error ? null : data.user
}

async function buscar(request, params) {
  await authenticate(request)

  const termino = String(params.q || params.keyword || params.searchTerm || params.termino || params.term || '').trim()
  if (termino.length < 3) return Response.json({ error: 'Escribe al menos 3 letras para buscar en la Biblia.' }, { status: 400 })
  if (termino.length > 60) return Response.json({ error: 'La búsqueda es demasiado larga.' }, { status: 400 })

  const versionKey = params.version || 'rv1960'
  const version = VERSIONES.find((item) => item.key === versionKey) || VERSIONES[0]

  try {
    const url = `https://bolls.life/find/${version.bolls}/?search=${encodeURIComponent(termino)}&match_case=false&match_whole=false`
    const data = await fetchConTimeout(url, {}, 9000)
    if (!Array.isArray(data)) return Response.json({ error: 'No fue posible buscar en la Biblia en este momento. Intenta de nuevo.' }, { status: 502 })

    const resultados = data.slice(0, MAX_RESULTADOS).map((item) => {
      const libro = LIBROS[item.book - 1] || null
      return {
        libro,
        capitulo: item.chapter,
        verso: item.verse,
        ref: libro ? `${libro} ${item.chapter}:${item.verse}` : null,
        html: resaltarCoincidencia(item.text, termino),
      }
    }).filter((item) => item.libro)

    return Response.json({
      success: true,
      data: { termino, version: version.key, etiqueta: version.etiqueta, total: data.length, resultados },
    })
  } catch (error) {
    console.error('[v0] Error en concordancia:', error?.message)
    return Response.json({ error: 'No fue posible buscar en la Biblia en este momento. Intenta de nuevo.' }, { status: 502 })
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  return buscar(request, {
    q: searchParams.get('q') || '',
    version: searchParams.get('version') || 'rv1960',
  })
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}))
  const { searchParams } = new URL(request.url)
  return buscar(request, {
    q: body.q || body.keyword || body.searchTerm || body.termino || body.term || searchParams.get('q') || '',
    version: body.version || searchParams.get('version') || 'rv1960',
  })
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
    },
  })
}
