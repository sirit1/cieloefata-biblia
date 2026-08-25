/**
 * Paridad Vercel = Express: alias de server.js existen como api/*.js
 * y concordancia acepta POST.
 */
import tskHandler from '../api/tsk.js';
import referenciasHandler from '../api/referencias.js';
import lexiconHandler from '../api/lexicon.js';
import lexicoHandler from '../api/lexico.js';
import capituloHandler from '../api/capitulo.js';
import bibleHandler from '../api/bible.js';
import concordanceHandler from '../api/concordance.js';
import studyEngineHandler from '../api/study-engine.js';
import concordanciaHandler from '../api/concordancia.js';
import { extractUserText } from '../lib/chat-contract.js';
import { handlerForApiPath, routeKeyFromPath } from '../lib/api-route-map.js';
import { existsSync } from 'node:fs';

function mockRes() {
  return {
    headers: {},
    statusCode: 200,
    body: null,
    setHeader(k, v) {
      this.headers[k] = v;
    },
    status(c) {
      this.statusCode = c;
      return this;
    },
    json(v) {
      this.body = v;
      return this;
    },
    end() {
      return this;
    },
  };
}

async function call(handler, req) {
  const res = mockRes();
  await handler(req, res);
  return res;
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const results = [];
async function run(name, fn) {
  const t0 = Date.now();
  try {
    await fn();
    results.push({ name, ok: true, ms: Date.now() - t0 });
    console.log(`✔ ${name}`);
  } catch (err) {
    results.push({ name, ok: false, error: err.message });
    console.error(`✖ ${name}: ${err.message}`);
  }
}

await run('alias api/*.js = handlers Express', async () => {
  assert(lexiconHandler === lexicoHandler, 'lexicon debe ser lexico');
  assert(capituloHandler === bibleHandler, 'capitulo debe ser bible');
  assert(concordanceHandler === studyEngineHandler, 'concordance debe ser study-engine');
  assert(typeof tskHandler === 'function', 'tsk handler');
  assert(typeof referenciasHandler === 'function', 'referencias handler');
});

await run('archivos App Router de alias existen', async () => {
  for (const p of [
    'app/api/tsk/route.js',
    'app/api/study-engine/route.js',
    'app/api/lexicon/route.js',
    'app/api/lexico/route.js',
    'app/api/capitulo/route.js',
    'app/api/concordance/route.js',
    'app/api/lente-elite/route.js',
    'app/api/[...slug]/route.js',
  ]) {
    assert(existsSync(p), `falta ${p}`);
  }
});

await run('mapa de rutas cubre server.js', async () => {
  assert(routeKeyFromPath('/api/tsk') === 'tsk');
  const tsk = await handlerForApiPath('/api/tsk');
  const refs = await handlerForApiPath('/api/referencias');
  assert(typeof tsk === 'function' && typeof refs === 'function');
  const lex = await handlerForApiPath('/api/lexicon');
  assert(lex === lexicoHandler);
  const chat = await handlerForApiPath('/api/chat');
  assert(typeof chat === 'function', 'chat debe estar en el mapa');
});

await run('chat acepta message y prompt', async () => {
  assert(extractUserText({ message: 'hola' }) === 'hola');
  assert(extractUserText({ prompt: 'hola' }) === 'hola');
});

await run('POST /api/concordancia no es 405', async () => {
  const res = await call(concordanciaHandler, {
    method: 'POST',
    body: { q: 'moradas', passage: 'Juan 14:1' },
    query: {},
    headers: {},
  });
  assert(res.statusCode !== 405, `405 POST concordancia: ${JSON.stringify(res.body)}`);
  assert(res.statusCode === 200, `status ${res.statusCode}`);
  const resultados = res.body?.data?.resultados || [];
  assert(resultados.length > 0 || String(res.body?.answer || '').length > 20, 'POST concordancia vacío');
});

await run('POST /api/tsk normaliza passage → consulta', async () => {
  const res = await call(tskHandler, {
    method: 'POST',
    body: { passage: 'Juan 14:1' },
    query: {},
    headers: {},
  });
  assert(res.statusCode === 200, `status ${res.statusCode}`);
  const refs = res.body?.data?.referencias || res.body?.referencias || [];
  assert(refs.length > 0, 'TSK sin refs con body.passage');
});

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} OK`);
if (failed.length) process.exit(1);
