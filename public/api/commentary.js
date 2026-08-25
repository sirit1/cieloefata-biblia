import { obtenerComentarioCorpus, jsonComentarioCorpus } from '../lib/comentario-corpus.js';

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ success: false, error: 'Método no permitido.' });
  }

  const q = req.method === 'GET' ? req.query || {} : req.body || {};
  const passage = String(q.passage || q.referencia || q.ref || q.consulta || 'Mateo 16:2').trim();
  const author = String(q.author || q.autor || 'jamieson-fausset-brown').trim();

  try {
    const result = await obtenerComentarioCorpus({ passage, author });
    return res.status(200).json(jsonComentarioCorpus(result));
  } catch (err) {
    console.error('Error al consultar corpus de comentario:', err?.message || err);
    const result = await obtenerComentarioCorpus({ passage, author });
    return res.status(200).json(jsonComentarioCorpus(result));
  }
}
