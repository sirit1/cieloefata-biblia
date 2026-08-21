import { armarRespuestaComentario, catalogoPublicoComentarios, autoresActivos } from '../../../lib/comentarios.js'

export const runtime = 'nodejs'

export async function GET(request) {
  const url = new URL(request.url)
  if (url.searchParams.get('catalogo') === '1' || url.searchParams.get('lista') === '1') {
    return Response.json({ success: true, data: catalogoPublicoComentarios() })
  }
  const autor = url.searchParams.get('autor') || autoresActivos()[0]?.key || ''
  const referencia = url.searchParams.get('referencia') || url.searchParams.get('ref') || ''
  if (!referencia) {
    return Response.json({ error: 'Indica una referencia bíblica.' }, { status: 400 })
  }
  return Response.json({ success: true, data: armarRespuestaComentario(autor, referencia) })
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}))
  if (body.catalogo === '1' || body.catalogo === true) {
    return Response.json({ success: true, data: catalogoPublicoComentarios() })
  }
  const autor = body.autor || autoresActivos()[0]?.key || ''
  const referencia = body.referencia || body.ref || ''
  if (!referencia) {
    return Response.json({ error: 'Indica una referencia bíblica.' }, { status: 400 })
  }
  return Response.json({ success: true, data: armarRespuestaComentario(autor, referencia) })
}
