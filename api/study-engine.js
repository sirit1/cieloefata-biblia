/**
 * POST /api/study-engine — wrapper del generador universal (mismo contrato que Express en server.js).
 * Runtime Node: no Edge. No reescribe prompts ni el motor teológico.
 */
import { generateUniversalAnswer } from './ai.js';
import {
  generarFallbackLente,
  generarFallbackLenteElite,
  generarFallbackConcordancia,
} from '../lib/theological-fallback.js';

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

function normalizeBody(body, pathHint) {
  const next = body && typeof body === 'object' ? { ...body } : {};
  if (!next.passage && next.ref) next.passage = next.ref;
  if (!next.passage && next.referencia) next.passage = next.referencia;
  if (!next.passage && next.consulta) next.passage = next.consulta;
  if (!next.passage && next.contextPassage) next.passage = next.contextPassage;
  if (!next.prompt && next.message) next.prompt = next.message;
  if (!next.mode && !next.type) {
    const p = String(pathHint || '');
    if (p.includes('lente-elite')) next.type = 'elite_lens';
    else if (p.includes('tsk')) next.type = 'tsk';
    else if (p.includes('lexic')) next.type = 'lexicon';
    else if (p.includes('concordanc')) next.type = 'concordance';
    else if (p.includes('exegesis') || p.includes('comentario')) next.type = 'commentary';
    else if (p.includes('lente')) next.type = 'lens';
  }
  return next;
}

export default async function handler(req, res) {
  res.setHeader?.('Content-Type', 'application/json; charset=utf-8');
  res.setHeader?.('Access-Control-Allow-Origin', '*');

  if (req.method === 'OPTIONS') {
    res.setHeader?.('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader?.('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
    return res.status(204).end();
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    res.setHeader?.('Allow', 'GET, POST, OPTIONS');
    return res.status(405).json({ success: false, error: 'Método no permitido.' });
  }

  const raw = req.method === 'GET' ? req.query || {} : req.body || {};
  const body = normalizeBody(raw, req.path || req.url || '/api/study-engine');

  try {
    const payload = await generateUniversalAnswer(body, req.path || req.url || '/api/study-engine');
    return res.status(200).json(envelope(payload));
  } catch (error) {
    console.error('[api/study-engine]', error?.message || error);
    const mode = String(body.mode || body.type || '').toLowerCase();
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
      fallbackAnswer = generarFallbackLenteElite({
        passage: body.passage || body.referencia || 'Pasaje Bíblico',
        subLensId: body.subLensId,
        lensId: body.lensId,
        lensTitle: body.lensTitle || body.lente || 'Análisis Bíblico',
        prompt: body.prompt,
        verseText: body.verseText,
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
      })
    );
  }
}
