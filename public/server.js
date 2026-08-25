import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadProjectEnv } from './lib/load-env.js';
import { generateUniversalAnswer, generateEliteLensAnswer } from './api/ai.js';
import agenteTeologicoHandler from './api/agente-teologico.js';
import bibleHandler from './api/bible.js';
import pasajeHandler from './api/pasaje.js';
import comentarioHandler from './api/comentario.js';
import commentaryHandler from './api/commentary.js';
import lenteEliteHandler from './api/lente-elite.js';
import { generarComentarioGemini, envelopeComentario } from './lib/comentario-gemini.js';
import {
  generarFallbackComentario,
  generarFallbackLente,
  generarFallbackLenteElite,
  generarFallbackConcordancia
} from './lib/theological-fallback.js';
import referenciasHandler from './api/referencias.js';
import concordanciaHandler from './api/concordancia.js';
import strongHandler from './api/strong.js';
import lexicoHandler from './api/lexico.js';

loadProjectEnv();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  if (req.method === 'OPTIONS') return res.status(204).end();
  next();
});
app.use(express.static(path.join(__dirname, 'public')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/styles', express.static(path.join(__dirname, 'styles')));
app.use('/data', express.static(path.join(__dirname, 'data')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/views', express.static(path.join(__dirname, 'views')));
app.use('/audio', express.static(path.join(__dirname, 'audio')));
app.use('/audio', express.static(path.join(__dirname, 'public', 'audio')));
app.use('/audio', express.static(path.join(__dirname, '..', 'audio')));

function mount(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res);
    } catch (err) {
      console.error(`[api ${req.path}]`, err?.message || err);
      if (!res.headersSent) next(err);
    }
  };
}

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

async function studyEngineHandler(req, res) {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    if (!body.passage && body.ref) body.passage = body.ref;
    if (!body.passage && body.referencia) body.passage = body.referencia;
    if (!body.passage && body.consulta) body.passage = body.consulta;
    if (!body.passage && body.contextPassage) body.passage = body.contextPassage;
    if (!body.prompt && body.message) body.prompt = body.message;
    if (!body.mode && !body.type) {
      const p = String(req.path || req.url || '');
      if (p.includes('lente-elite')) body.type = 'elite_lens';
      else if (p.includes('tsk')) body.type = 'tsk';
      else if (p.includes('lexic')) body.type = 'lexicon';
      else if (p.includes('concordanc')) body.type = 'concordance';
      else if (p.includes('exegesis') || p.includes('comentario')) body.type = 'commentary';
      else if (p.includes('lente')) body.type = 'lens';
    }
    const payload = await generateUniversalAnswer(body, req.path || req.url || '');
    return res.status(200).json(envelope(payload));
  } catch (error) {
    console.error(`[study-engine] Error en ${req.path}:`, error.message);
    const body = req.body || {};
    const mode = String(body.mode || body.type || (req.path?.includes('concordanc') ? 'concordance' : '')).toLowerCase();
    let fallbackAnswer = '';
    if (mode === 'concordance' || mode === 'concordancia') {
      fallbackAnswer = generarFallbackConcordancia({
        keyword: body.keyword || body.searchTerm || body.termino,
        passage: body.passage || body.referencia || 'Pasaje Bíblico',
        verseText: body.verseText,
      });
    } else if (mode === 'elite_lens' || body.subLensId || (body.lensId && (body.lensId.startsWith('biblica_') || body.lensId.startsWith('mental_') || body.lensId === 'dictamen_maestro')) || req.path?.includes('lente-elite')) {
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
    return res.status(200).json(envelope({
      success: true,
      ok: true,
      answer: fallbackAnswer,
      text: fallbackAnswer,
      source: 'theological-engine-fallback',
    }));
  }
}

async function tskHandler(req, res) {
  if (!req.body || typeof req.body !== 'object') req.body = {};
  if (!req.body.consulta) {
    req.body.consulta = req.body.passage || req.body.referencia || req.body.ref || req.query?.q || '';
  }
  return referenciasHandler(req, res);
}

async function iaAssistantHandler(req, res) {
  try {
    await agenteTeologicoHandler(req, res);
    if (!res.headersSent) return studyEngineHandler(req, res);
  } catch (error) {
    console.warn('[ia-assistant]', error?.message || error);
    if (!res.headersSent) return studyEngineHandler(req, res);
  }
}

// —— Texto bíblico (cualquier libro / capítulo / versión) ——
app.get('/api/bible', mount(bibleHandler));
app.post('/api/bible', mount(bibleHandler));
app.get('/api/capitulo', mount(bibleHandler));
app.get('/api/pasaje', mount(pasajeHandler));
app.post('/api/pasaje', mount(pasajeHandler));

// —— Lentes Hermenéuticas & Cognitivas Élite ——
app.get('/api/lente-elite', mount(lenteEliteHandler));
app.post('/api/lente-elite', mount(lenteEliteHandler));

// —— Estudio canónico: comentarios, TSK, Strong, concordancia de palabras ——
app.get('/api/comentario', mount(comentarioHandler));
app.post('/api/comentario', mount(comentarioHandler));
app.get('/api/commentary', mount(commentaryHandler));
app.post('/api/commentary', async (req, res) => {
  const { passage, author, verseText } = req.body || {};
  const passageRef = passage || 'Mateo 16:2';
  const authorName = author || 'C. H. Spurgeon';
  try {
    console.log(`[api/commentary] ${authorName} · ${passageRef}`);
    const result = await generarComentarioGemini({
      passage: passageRef,
      author: authorName,
      verseText: verseText || '',
      timeoutMs: 15000,
    });
    const text = result?.text || generarFallbackComentario({ passage: passageRef, author: authorName, verseText });
    const auth = result?.author || authorName;
    const src = result?.source || 'theological-engine-fallback';
    const data = envelopeComentario(text, auth, src);
    return res.status(200).json({
      success: true,
      ok: true,
      text,
      answer: text,
      author: auth,
      source: src,
      data,
    });
  } catch (error) {
    console.error('Error al generar comentario en backend:', error?.message || error);
    const fallbackText = generarFallbackComentario({ passage: passageRef, author: authorName, verseText });
    const data = envelopeComentario(fallbackText, authorName, 'theological-engine-fallback');
    return res.status(200).json({
      success: true,
      ok: true,
      text,
      answer: fallbackText,
      author: authorName,
      source: 'theological-engine-fallback',
      data,
    });
  }
});
app.get('/api/referencias', mount(referenciasHandler));
app.post('/api/referencias', mount(referenciasHandler));
app.get('/api/tsk', mount(tskHandler));
app.post('/api/tsk', mount(tskHandler));
app.get('/api/concordancia', mount(concordanciaHandler));
app.post('/api/concordancia', studyEngineHandler);
app.get('/api/concordance', studyEngineHandler);
app.post('/api/concordance', studyEngineHandler);
app.get('/api/strong', mount(strongHandler));
app.post('/api/strong', mount(strongHandler));
app.get('/api/lexico', mount(lexicoHandler));
app.post('/api/lexico', mount(lexicoHandler));
app.get('/api/lexicon', mount(lexicoHandler));
app.post('/api/lexicon', mount(lexicoHandler));

const STUDY_PATHS = ['/api/study-engine', '/api/lente-elite', '/api/ai', '/api/exegesis', '/api/lente', '/api/recursos', '/api/concordance', '/api/concordancia'];
for (const route of STUDY_PATHS) {
  app.post(route, studyEngineHandler);
  app.get(route, studyEngineHandler);
}

const IA_PATHS = ['/api/agente-teologico', '/api/chat-global', '/api/chat', '/api/ai-synthesis'];
for (const route of IA_PATHS) {
  app.post(route, iaAssistantHandler);
  app.get(route, iaAssistantHandler);
}

app.use(express.static(__dirname, { index: false, dotfiles: 'ignore' }));

app.post(/^\/api\//, studyEngineHandler);

app.use((req, res, next) => {
  if (req.method !== 'GET') return next();
  if (req.path.startsWith('/api/')) {
    return res.status(200).json({
      success: true,
      ok: true,
      ready: true,
      path: req.path,
      answer: 'Endpoint activo. Usa POST con { passage, mode, prompt }.',
    });
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`[Éfata RevelatiO] Servidor activo en http://localhost:${PORT}`);
});
