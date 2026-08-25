/**
 * POST/GET /api/study-engine
 * IA only for lens / elite_lens. TSK, commentary, lexicon, concordance = corpus.
 * Never theological-fallback / «Respaldo teológico».
 */
import { generateUniversalAnswer } from './ai.js';
import tskHandler from './tsk.js';
import commentaryHandler from './commentary.js';
import lexicoHandler from './lexico.js';
import concordanciaHandler from './concordancia.js';

export const config = { runtime: 'nodejs' };

function envelope(payload = {}) {
  const answer =
    payload.answer || payload.respuesta || payload.result || payload.data || payload.text || '';
  return {
    ...payload,
    success: payload.success !== false,
    ok: payload.ok !== false,
    answer,
    respuesta: payload.respuesta || answer,
    result: payload.result || answer,
    text: payload.text || answer,
    commentary: payload.commentary?.text ? payload.commentary : { text: answer },
  };
}

function collectBody(req) {
  const query = req.query && typeof req.query === 'object' ? req.query : {};
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  return { ...query, ...body };
}

export function foldStudyType(body = {}, pathname = '') {
  const t = String(body.type || body.mode || '').toLowerCase().trim();
  const p = String(pathname || '').toLowerCase();
  if (t === 'concordance' || t === 'concordancia' || t === 'thematic' || t === 'tematica') return 'concordance';
  if (t === 'commentary' || t === 'comentario' || t === 'classical') return 'commentary';
  if (t === 'tsk' || t === 'xref' || t === 'cross') return 'tsk';
  if (t === 'lexicon' || t === 'lexico' || t === 'strong' || t === 'strongs') return 'lexicon';
  if (t === 'elite_lens' || t === 'lente_elite' || t === 'lente-elite' || t === 'elite') return 'elite_lens';
  if (t === 'lens' || t === 'lente' || t === 'vida') return 'lens';
  if (p.includes('lente-elite')) return 'elite_lens';
  if (p.includes('concordanc')) return 'concordance';
  if (p.includes('tsk')) return 'tsk';
  if (p.includes('lexicon') || p.includes('lexico') || p.includes('strong')) return 'lexicon';
  if (p.includes('comentario') || p.includes('commentary')) return 'commentary';
  if (p.includes('lente')) return 'lens';
  return 'unspecified';
}

function corpusRefuse() {
  const msg = 'El estudio canónico (TSK, comentarios, léxico, concordancia) usa corpus. La IA solo opera en lentes y el chat.';
  return {
    success: false,
    ok: false,
    error: msg,
    answer: msg,
    text: msg,
    source: 'corpus-required',
  };
}

function aiUnavailable(err) {
  const msg = 'No se pudo generar el dictamen de la lente. Reintenta. No se inventará un comentario clásico ni el texto del versículo.';
  return {
    success: false,
    ok: false,
    error: msg,
    answer: msg,
    text: msg,
    source: 'ai-unavailable',
    meta: { error: err?.message },
  };
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
  if (!body.consulta && body.passage) body.consulta = body.passage;
  if (!body.prompt && body.message) body.prompt = body.message;
  req.body = body;
  req.query = { ...(req.query || {}), ...body };

  const type = foldStudyType(body, req.url || req.path || '');

  try {
    if (type === 'tsk') return tskHandler(req, res);
    if (type === 'commentary') return commentaryHandler(req, res);
    if (type === 'lexicon') return lexicoHandler(req, res);
    if (type === 'concordance') return concordanciaHandler(req, res);
    if (type !== 'lens' && type !== 'elite_lens') {
      return res.status(200).json(corpusRefuse());
    }

    const payload = await generateUniversalAnswer(
      { ...body, type, mode: type },
      req.url || req.path || '/api/study-engine',
    );
    return res.status(200).json(envelope(payload));
  } catch (error) {
    console.error('[study-engine] Error:', error?.message || error);
    if (type === 'tsk' || type === 'commentary' || type === 'lexicon' || type === 'concordance') {
      return res.status(200).json(corpusRefuse());
    }
    return res.status(200).json(aiUnavailable(error));
  }
}
