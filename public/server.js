import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadProjectEnv } from './lib/load-env.js';
import agenteTeologicoHandler from './api/agente-teologico.js';
import bibleHandler from './api/bible.js';
import pasajeHandler from './api/pasaje.js';
import comentarioHandler from './api/comentario.js';
import commentaryHandler from './api/commentary.js';
import lenteEliteHandler from './api/lente-elite.js';
import studyEngineHandler from './api/study-engine.js';
import referenciasHandler from './api/referencias.js';
import tskHandler from './api/tsk.js';
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

async function iaAssistantHandler(req, res) {
  try {
    await agenteTeologicoHandler(req, res);
  } catch (error) {
    console.warn('[ia-assistant]', error?.message || error);
    if (!res.headersSent) {
      return res.status(502).json({
        success: false,
        ok: false,
        error: 'RevelatiO IA no pudo responder. Reintenta. No se inventará un comentario clásico.',
        source: 'ai-unavailable',
      });
    }
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
app.post('/api/commentary', mount(commentaryHandler));
app.get('/api/referencias', mount(referenciasHandler));
app.post('/api/referencias', mount(referenciasHandler));
app.get('/api/tsk', mount(tskHandler));
app.post('/api/tsk', mount(tskHandler));
app.get('/api/concordancia', mount(concordanciaHandler));
app.post('/api/concordancia', mount(concordanciaHandler));
app.get('/api/concordance', mount(concordanciaHandler));
app.post('/api/concordance', mount(concordanciaHandler));
app.get('/api/strong', mount(strongHandler));
app.post('/api/strong', mount(strongHandler));
app.get('/api/lexico', mount(lexicoHandler));
app.post('/api/lexico', mount(lexicoHandler));
app.get('/api/lexicon', mount(lexicoHandler));
app.post('/api/lexicon', mount(lexicoHandler));

const STUDY_PATHS = ['/api/study-engine', '/api/ai', '/api/exegesis', '/api/lente', '/api/recursos'];
for (const route of STUDY_PATHS) {
  app.post(route, mount(studyEngineHandler));
  app.get(route, mount(studyEngineHandler));
}

const IA_PATHS = ['/api/agente-teologico', '/api/chat-global', '/api/chat', '/api/ai-synthesis'];
for (const route of IA_PATHS) {
  app.post(route, iaAssistantHandler);
  app.get(route, iaAssistantHandler);
}

app.use(express.static(__dirname, { index: false, dotfiles: 'ignore' }));

app.post(/^\/api\//, (req, res) => {
  return res.status(404).json({
    success: false,
    ok: false,
    error: 'Ruta no encontrada.',
    source: 'not-found',
  });
});

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
