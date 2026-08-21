import { armarRespuestaComentario, catalogoPublicoComentarios, autoresActivos } from '../lib/comentarios.js';

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Método no permitido.' });
  }

  const q = req.method === 'GET' ? req.query || {} : req.body || {};
  if (q.catalogo === '1' || q.lista === '1' || q.catalogo === true) {
    return res.status(200).json({ success: true, data: catalogoPublicoComentarios() });
  }

  const autor = String(q.autor || q.author || autoresActivos()[0]?.key || '').trim();
  const referencia = String(q.referencia || q.ref || '').trim();
  if (!referencia) {
    return res.status(400).json({ error: 'Indica una referencia bíblica.' });
  }

  const data = armarRespuestaComentario(autor, referencia);
  return res.status(200).json({ success: true, data });
}
