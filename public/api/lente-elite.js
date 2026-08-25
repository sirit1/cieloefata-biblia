/**
 * Éfata RevelatiO — api/lente-elite.js
 * Endpoint para Lentes Hermenéuticas y Cognitivas de Nivel Élite.
 */
import { generateEliteLensAnswer } from './ai.js';

export default async function handler(req, res) {
  res.setHeader?.('Content-Type', 'application/json; charset=utf-8');
  res.setHeader?.('Access-Control-Allow-Origin', '*');

  if (req.method === 'OPTIONS') {
    res.setHeader?.('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader?.('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
    return res.status(204).end();
  }

  const isGet = req.method === 'GET';
  const body = (req.body && typeof req.body === 'object') ? req.body : (isGet ? req.query || {} : {});

  const passage = body.passage || body.referencia || body.ref || body.consulta || (isGet ? body.q : '') || 'Romanos 12:2';
  const subLensId = body.subLensId || body.lensId || body.lente || 'dictamen_maestro';
  const lensTitle = body.lensTitle || body.title || 'Dictamen Maestro Integrado';
  const prompt = body.prompt || body.message || '';
  const verseText = body.verseText || body.texto || '';

  try {
    const payload = await generateEliteLensAnswer({
      passage,
      subLensId,
      lensId: subLensId,
      lensTitle,
      prompt,
      verseText,
      mode: 'elite_lens',
      type: 'elite_lens',
    }, req.path || req.url || '/api/lente-elite');

    const answer = payload.answer || payload.text || '';
    return res.status(200).json({
      success: true,
      ok: true,
      answer,
      text: answer,
      result: answer,
      respuesta: answer,
      commentary: { text: answer },
      source: payload.source || 'gemini',
      meta: {
        passage,
        subLensId,
        lensTitle,
        verseText: verseText || undefined,
        ...(payload.meta || {}),
      },
    });
  } catch (error) {
    console.error('[api/lente-elite] Error:', error?.message || error);
    const msg = 'No se pudo generar el dictamen de la lente. Reintenta. No se inventará un comentario clásico ni el texto del versículo.';
    return res.status(200).json({
      success: false,
      ok: false,
      error: msg,
      answer: msg,
      text: msg,
      result: msg,
      respuesta: msg,
      commentary: { text: msg },
      source: 'ai-unavailable',
      meta: {
        passage,
        subLensId,
        lensTitle,
        error: error?.message,
      },
    });
  }
}
