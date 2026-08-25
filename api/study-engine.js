/**
 * POST/GET /api/study-engine — wrapper Node (no Edge) de generateUniversalAnswer.
 * Misma forma que studyEngineHandler en server.js.
 */
import { generateUniversalAnswer } from './ai.js';
import {
  generarFallbackLente,
  generarFallbackConcordancia,
} from '../lib/theological-fallback.js';

export const config = { runtime: 'nodejs' };

function envelope(payload = {}) {
  const answer =
    payload.answer || payload.respuesta || payload.result || payload.data || payload.text || '';
  return {
    ...payload,
    success: true,
    ok: true,
    answer,
    respuesta: answer,
    result: answer,
    text: answer,
    commentary: payload.commentary?.text ? payload.commentary : { text: answer },
  };
}

function collectBody(req) {
  const query = req.query && typeof req.query === 'object' ? req.query : {};
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  return { ...query, ...body };
}

export default async function handler(req, res) {
  res.setHeader?.('Content-Type', 'application/json; charset=utf-8');
  res.setHeader?.('Access-Control-Allow-Origin', '*');
  res.setHeader?.('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader?.('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    res.setHeader?.('Allow', 'GET, POST, OPTIONS');
    return res.status(405).json({ success: false, error: 'Método no permitido.' });
  }

  const body = collectBody(req);
  if (!body.passage && body.ref) body.passage = body.ref;
  if (!body.passage && body.referencia) body.passage = body.referencia;
  if (!body.passage && body.consulta) body.passage = body.consulta;
  if (!body.passage && body.contextPassage) body.passage = body.contextPassage;
  if (!body.prompt && body.message) body.prompt = body.message;
  if (!body.mode && !body.type) {
    const p = String(req.url || req.path || '');
    if (p.includes('lente-elite')) body.type = 'elite_lens';
    else if (p.includes('tsk')) body.type = 'tsk';
    else if (p.includes('lexic')) body.type = 'lexicon';
    else if (p.includes('concordanc')) body.type = 'concordance';
    else if (p.includes('exegesis') || p.includes('comentario')) body.type = 'commentary';
    else if (p.includes('lente')) body.type = 'lens';
  }

  try {
    const payload = await generateUniversalAnswer(body, req.url || req.path || '/api/study-engine');
    return res.status(200).json(envelope(payload));
  } catch (error) {
    console.error('[study-engine] Error:', error?.message || error);
    const mode = String(
      body.mode || body.type || (String(req.url || '').includes('concordanc') ? 'concordance' : ''),
    ).toLowerCase();
    let fallbackAnswer = '';
    if (mode === 'concordance' || mode === 'concordancia') {
      fallbackAnswer = generarFallbackConcordancia({
        keyword: body.keyword || body.searchTerm || body.termino,
        passage: body.passage || body.referencia || 'Pasaje Bíblico',
        verseText: body.verseText,
      });
    } else if (
      mode === 'elite_lens' ||
      body.subLensId ||
      (body.lensId &&
        (String(body.lensId).startsWith('biblica_') ||
          String(body.lensId).startsWith('mental_') ||
          body.lensId === 'dictamen_maestro'))
    ) {
      fallbackAnswer = 'No se pudo generar el dictamen de la lente. Reintenta. No se inventará un comentario clásico ni el texto del versículo.';
      return res.status(200).json({
        success: false,
        ok: false,
        error: fallbackAnswer,
        answer: fallbackAnswer,
        text: fallbackAnswer,
        source: 'ai-unavailable',
        meta: { error: error?.message },
      });
    } else {
      fallbackAnswer = generarFallbackLente({
        passage: body.passage || body.referencia || 'Pasaje Bíblico',
        lensTitle: body.lensTitle || body.lente || 'Análisis Bíblico',
        prompt: body.prompt,
        verseText: body.verseText,
      });
    }
    return res.status(200).json(
      envelope({
        success: true,
        ok: true,
        answer: fallbackAnswer,
        text: fallbackAnswer,
        source: 'theological-engine-fallback',
        author: 'Respaldo teológico',
      }),
    );
  }
}
