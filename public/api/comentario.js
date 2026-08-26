import { catalogoPublicoComentarios } from '../lib/comentarios.js';
import { obtenerComentarioCorpus, jsonComentarioCorpus } from '../lib/comentario-corpus.js';

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ success: false, error: 'Método no permitido.' });
  }

  const q = req.method === 'GET' ? req.query || {} : req.body || {};
  if (q.catalogo === '1' || q.lista === '1' || q.catalogo === true) {
    return res.status(200).json({ success: true, data: catalogoPublicoComentarios() });
  }

  const autor = String(q.autor || q.author || 'jamieson-fausset-brown').trim();
  const referencia = String(q.referencia || q.ref || q.passage || q.consulta || 'Mateo 16:2').trim();

  try {
    const result = await obtenerComentarioCorpus({ passage: referencia, author: autor });
    return res.status(200).json(jsonComentarioCorpus(result));
  } catch (err) {
    console.error('[api/comentario] Error al consultar corpus:', err?.message || err);
    const result = await obtenerComentarioCorpus({ passage: referencia, author: autor });
    return res.status(200).json(jsonComentarioCorpus(result));
  }
}
