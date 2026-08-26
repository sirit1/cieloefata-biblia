/**
 * TSK tab: verse-keyed OpenBible / helloao cross-references.
 * Never aliases /api/referencias. Never Gemini. Never Bolls keyword search.
 */
import { obtenerTsk } from '../lib/tsk.js';

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Método no permitido.' });
  }

  const q = { ...(req.query || {}), ...((req.body && typeof req.body === 'object') ? req.body : {}) };
  const consulta = String(q.consulta || q.passage || q.referencia || q.ref || q.q || '').trim();
  if (!consulta && !(q.book || q.libro)) {
    return res.status(400).json({ error: 'Consulta inválida.' });
  }

  try {
    const result = await obtenerTsk({
      passage: consulta,
      consulta,
      referencia: consulta,
      version: q.version || q.traduccion || 'RV1960',
      book: q.book || q.libro,
      chapter: q.chapter || q.capitulo,
      verse: q.verse || q.verso,
    });
    return res.status(200).json(result);
  } catch (err) {
    console.error('[api/tsk]', err?.message || err);
    return res.status(200).json({
      success: true,
      found: false,
      fuente: 'tsk-open-cross-ref',
      data: { referencia: consulta, fuente: 'tsk-open-cross-ref', referencias: [] },
    });
  }
}
