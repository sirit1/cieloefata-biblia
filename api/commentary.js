import { generarComentarioGemini, envelopeComentario } from '../lib/comentario-gemini.js';
import { generarFallbackComentario } from '../lib/theological-fallback.js';

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ success: false, error: 'Método no permitido.' });
  }

  const q = req.method === 'GET' ? req.query || {} : req.body || {};
  const passage = String(q.passage || q.referencia || q.ref || q.consulta || 'Mateo 16:2').trim();
  const author = String(q.author || q.autor || 'C. H. Spurgeon').trim() || 'C. H. Spurgeon';
  const verseText = String(q.verseText || q.texto || q.text || '').trim();

  try {
    const result = await generarComentarioGemini({
      passage,
      author,
      verseText,
      timeoutMs: 15000,
    });
    const text = result?.text || generarFallbackComentario({ passage, author, verseText });
    const authorName = result?.author || author;
    const source = result?.source || 'theological-engine-fallback';
    const data = envelopeComentario(text, authorName, source);
    return res.status(200).json({
      success: true,
      ok: true,
      text,
      answer: text,
      author: authorName,
      source,
      data,
    });
  } catch (err) {
    console.error('Error al generar comentario en backend:', err?.message || err);
    const fallbackText = generarFallbackComentario({ passage, author: 'Respaldo teológico', verseText });
    const data = envelopeComentario(fallbackText, 'Respaldo teológico', 'theological-engine-fallback');
    return res.status(200).json({
      success: true,
      ok: true,
      text: fallbackText,
      answer: fallbackText,
      author: 'Respaldo teológico',
      source: 'theological-engine-fallback',
      data,
    });
  }
}
