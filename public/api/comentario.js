import { catalogoPublicoComentarios } from '../lib/comentarios.js';
import { generarComentarioGemini, envelopeComentario } from '../lib/comentario-gemini.js';
import { generarFallbackComentario } from '../lib/theological-fallback.js';

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ success: false, error: 'Método no permitido.' });
  }

  const q = req.method === 'GET' ? req.query || {} : req.body || {};
  if (q.catalogo === '1' || q.lista === '1' || q.catalogo === true) {
    return res.status(200).json({ success: true, data: catalogoPublicoComentarios() });
  }

  const autor = String(q.autor || q.author || 'C. H. Spurgeon').trim() || 'C. H. Spurgeon';
  const referencia = String(q.referencia || q.ref || q.passage || q.consulta || 'Mateo 16:2').trim();
  const verseText = String(q.verseText || q.texto || q.text || '').trim();

  try {
    const result = await generarComentarioGemini({
      passage: referencia,
      author: autor,
      verseText,
      timeoutMs: 15000,
    });
    const text = result?.text || generarFallbackComentario({ passage: referencia, author: autor, verseText });
    const authorName = result?.author || autor;
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
    console.error('[api/comentario] Error al generar comentario:', err?.message || err);
    const fallbackText = generarFallbackComentario({ passage: referencia, author: autor, verseText });
    const data = envelopeComentario(fallbackText, autor, 'theological-engine-fallback');
    return res.status(200).json({
      success: true,
      ok: true,
      text: fallbackText,
      answer: fallbackText,
      author: autor,
      source: 'theological-engine-fallback',
      data,
    });
  }
}
