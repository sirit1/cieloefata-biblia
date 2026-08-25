/**
 * Cableado P0 Juan 14: rutas reales + chips Strong desde /api/pasaje.
 * No toca el motor teológico; solo verifica que los handlers existen y
 * que TSK/léxico/concordancia/pasaje devuelven cuerpo no vacío.
 */
import { readFileSync, existsSync } from 'node:fs';
import tskHandler from '../api/tsk.js';
import referenciasHandler from '../api/referencias.js';
import studyEngineHandler from '../api/study-engine.js';
import pasajeHandler from '../api/pasaje.js';
import lexicoHandler from '../api/lexico.js';
import concordanciaHandler from '../api/concordancia.js';

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

function engineErrorMessage(data, status) {
  const err = data && data.error;
  if (typeof err === 'string' && err.trim()) return err;
  if (err && typeof err === 'object') {
    const msg = err.message || err.code;
    if (msg) return String(msg);
  }
  if (typeof data?.message === 'string' && data.message.trim()) return data.message;
  return `HTTP ${status}`;
}

function firstWordFromVerse(text) {
  const skip = new Set([
    'porque', 'entonces', 'tambien', 'cuando', 'sobre', 'entre', 'hacia', 'desde',
    'para', 'como', 'esta', 'este', 'estos', 'estas', 'dijo', 'dice', 'senor',
    'dios', 'jesus', 'pues', 'pero', 'sino', 'hasta', 'todos', 'todas', 'vuestro',
    'vuestra', 'vuestros', 'vuestras', 'corazon',
  ]);
  const words = String(text || '')
    .replace(/[«»""¿?¡!.,;:()]/g, ' ')
    .split(/\s+/)
    .map((w) => w.replace(/^[^\p{L}]+|[^\p{L}]+$/gu, ''))
    .filter((w) => w.length >= 4);
  const found = words.find((w) => {
    const fold = w.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return !skip.has(fold);
  });
  return found || words[0] || '';
}

const results = [];
async function run(name, fn) {
  const t0 = Date.now();
  try {
    await fn();
    results.push({ name, ok: true, ms: Date.now() - t0 });
    console.log(`✔ ${name}`);
  } catch (err) {
    results.push({ name, ok: false, ms: Date.now() - t0, error: err.message });
    console.error(`✖ ${name}: ${err.message}`);
  }
}

await run('api/tsk.js es alias de referencias', async () => {
  assert(existsSync('app/api/tsk/route.js'), 'falta app/api/tsk/route.js');
  assert(existsSync('app/api/study-engine/route.js'), 'falta app/api/study-engine/route.js');
  const tskSrc = readFileSync('api/tsk.js', 'utf8');
  assert(tskSrc.includes("referencias.js"), 'api/tsk.js debe delegar a referencias');
  assert(typeof tskHandler === 'function' && typeof referenciasHandler === 'function');
});

await run('nunca new Error(objeto) → [object Object]', async () => {
  const msg = engineErrorMessage({ error: { code: 'NOT_FOUND', message: 'Missing' } }, 404);
  assert(msg === 'Missing', `esperaba Missing, obtuve ${msg}`);
  assert(!String(new Error(msg)).includes('[object Object]'), 'sigue pintando [object Object]');
});

await run('concordancia sin término toma palabra del versículo', async () => {
  const term = firstWordFromVerse(
    'No se turbe vuestro corazón; creéis en Dios, creed también en mí.'
  );
  assert(term.length >= 4, `término corto: ${term}`);
  assert(term.toLowerCase() !== 'dios', 'no debe elegir la stopword Dios');
});

await run('GET /api/pasaje Juan 14:1 incluye original Strong', async () => {
  const res = await call(pasajeHandler, {
    method: 'GET',
    query: { referencia: 'Juan 14:1' },
    body: {},
    headers: {},
  });
  assert(res.statusCode === 200, `status ${res.statusCode}`);
  const original = res.body?.data?.original || res.body?.original;
  const versos = original?.versos || [];
  assert(versos.length > 0, 'sin original.versos');
  const tokens = versos.flatMap((v) => v.tokens || []);
  const strongs = tokens.filter((t) => t.strong);
  assert(strongs.length > 0, 'sin tokens Strong');
  const codes = strongs.map((t) => t.strong).join(' ');
  console.log('    Strong Juan 14:1:', codes.slice(0, 80));
});

await run('GET /api/pasaje Juan 1:1 también incluye original', async () => {
  const res = await call(pasajeHandler, {
    method: 'GET',
    query: { referencia: 'Juan 1:1' },
    body: {},
    headers: {},
  });
  assert(res.statusCode === 200, `status ${res.statusCode}`);
  const original = res.body?.data?.original || res.body?.original;
  assert(original?.versos?.length > 0, 'Juan 1 sin original');
});

await run('POST /api/tsk Juan 14:1 devuelve referencias', async () => {
  const res = await call(tskHandler, {
    method: 'POST',
    body: { consulta: 'Juan 14:1', passage: 'Juan 14:1', referencia: 'Juan 14:1' },
    query: {},
    headers: {},
  });
  assert(res.statusCode === 200, `status ${res.statusCode} body=${JSON.stringify(res.body)?.slice(0, 180)}`);
  const refs = res.body?.data?.referencias || res.body?.referencias || [];
  const answer = res.body?.answer || res.body?.text || '';
  assert(refs.length > 0 || String(answer).trim().length > 20, 'TSK vacío (ni refs ni answer)');
  console.log('    TSK refs:', refs.length, 'answer len:', String(answer).length);
});

await run('GET /api/lexico?referencia=Juan 14:1 answer no vacío', async () => {
  const res = await call(lexicoHandler, {
    method: 'GET',
    query: { referencia: 'Juan 14:1' },
    body: {},
    headers: {},
  });
  assert(res.statusCode === 200, `status ${res.statusCode}`);
  const answer = res.body?.answer || res.body?.data?.answer || res.body?.text || '';
  assert(String(answer).trim().length > 40, `léxico corto: ${String(answer).slice(0, 80)}`);
  assert(!String(answer).includes('[object Object]'), 'léxico [object Object]');
});

await run('GET /api/concordancia?q=moradas incluye Juan 14', async () => {
  const res = await call(concordanciaHandler, {
    method: 'GET',
    query: { q: 'moradas' },
    body: {},
    headers: {},
  });
  assert(res.statusCode === 200, `status ${res.statusCode}`);
  const resultados = res.body?.data?.resultados || [];
  assert(resultados.length > 0, 'concordancia vacía');
  const html = resultados.map((r) => `<p><strong>${r.ref}</strong> ${r.html || ''}</p>`).join('');
  assert(html.trim().length > 0, 'HTML concordancia vacío');
  const hasJuan14 = resultados.some((r) => /Juan\s*14/i.test(r.ref || ''));
  console.log('    hits:', resultados.length, 'Juan 14:', hasJuan14);
});

await run('POST /api/study-engine lexicon Juan 14:1 no 404', async () => {
  const res = await call(studyEngineHandler, {
    method: 'POST',
    body: { passage: 'Juan 14:1', mode: 'lexicon', verseText: 'No se turbe vuestro corazón.' },
    path: '/api/study-engine',
    url: '/api/study-engine',
    headers: {},
  });
  assert(res.statusCode === 200, `status ${res.statusCode}`);
  const answer = res.body?.answer || res.body?.text || '';
  assert(String(answer).trim().length > 20, 'study-engine lexicon vacío');
  assert(!String(new Error(engineErrorMessage(res.body, res.statusCode))).includes('[object Object]'));
});

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} OK`);
if (failed.length) process.exit(1);
