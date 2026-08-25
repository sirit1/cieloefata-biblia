/**
 * Chat UI unificado: un contrato message|prompt → respuesta al verso.
 * No usa el fallback Spurgeon de commentary. TSK y study-engine siguen 200.
 */
import { readFileSync } from 'node:fs';
import chatHandler from '../api/chat.js';
import agenteHandler from '../api/agente-teologico.js';
import tskHandler from '../api/tsk.js';
import studyEngineHandler from '../api/study-engine.js';
import commentaryHandler from '../api/commentary.js';
import { extractUserText } from '../lib/chat-contract.js';
import { passageFromQuestion } from '../lib/answer-user-question.js';

const SPURGEON_CANNED = 'Tabernáculo Metropolitano';

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

function chatText(body) {
  const raw = body?.answer || body?.text || body?.data;
  if (typeof raw === 'string') return raw;
  if (raw && typeof raw === 'object') return String(raw.text || raw.answer || '');
  return '';
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

await run('extractUserText acepta message y prompt', async () => {
  assert(extractUserText({ message: 'Qué dice Romanos 12:2' }) === 'Qué dice Romanos 12:2', 'message');
  assert(extractUserText({ prompt: 'Qué dice Romanos 12:2' }) === 'Qué dice Romanos 12:2', 'prompt');
});

await run('passageFromQuestion extrae el verso del enunciado', async () => {
  const ref = passageFromQuestion({ message: 'Qué dice Romanos 12:2' }, 'Qué dice Romanos 12:2');
  assert(ref === 'Romanos 12:2', `obtuvo "${ref}"`);
});

await run('FAB pega a /api/chat, no a agente-teologico', async () => {
  const src = readFileSync('js/ai-engine.js', 'utf8');
  assert(src.includes('fetch("/api/chat"'), 'revelatioChat debe POST /api/chat');
  assert(src.includes('async function revelatioChat'), 'falta revelatioChat');
  const submitChunk = src.slice(src.indexOf('const result = await revelatioChat'));
  assert(submitChunk.includes('revelatioChat'), 'submit del panel debe usar revelatioChat');
  const panelSubmit = src.slice(src.indexOf('form.addEventListener("submit"'));
  assert(
    /await revelatioChat\(/.test(panelSubmit),
    'el submit del FAB no debe llamar agenteTeologico',
  );
  assert(!/await agenteTeologico\(/.test(panelSubmit.slice(0, 2500)), 'submit aún llama agenteTeologico');
});

await run('POST /api/chat Romanos 12:2 no es Spurgeon enlatado', async () => {
  const res = await call(chatHandler, {
    method: 'POST',
    body: { message: 'Qué dice Romanos 12:2' },
    headers: {},
  });
  assert(res.statusCode === 200, `status ${res.statusCode} ${JSON.stringify(res.body)}`);
  const text = chatText(res.body);
  assert(text.length > 40, `chat vacío: ${JSON.stringify(res.body)}`);
  assert(res.body?.success === true && res.body?.ok === true, 'contrato success/ok');
  assert(typeof res.body?.answer === 'string' && typeof res.body?.text === 'string', 'faltan answer/text');
  assert(typeof res.body?.data === 'string', 'data debe ser el texto, no un objeto commentary');
  assert(!text.includes(SPURGEON_CANNED), 'chat devolvió fallback Spurgeon de commentary');
  assert(/romanos\s*12\s*:\s*2/i.test(text) || /conform/i.test(text) || /entendimiento/i.test(text), 'no ancla al verso');
});

await run('POST /api/chat acepta prompt igual que message', async () => {
  const res = await call(chatHandler, {
    method: 'POST',
    body: { prompt: 'Qué dice Romanos 12:2' },
    headers: {},
  });
  assert(res.statusCode === 200, `status ${res.statusCode}`);
  const text = chatText(res.body);
  assert(text.length > 40, 'prompt vacío');
  assert(!text.includes(SPURGEON_CANNED), 'prompt → Spurgeon');
});

await run('POST /api/agente-teologico tampoco cae a commentary', async () => {
  const res = await call(agenteHandler, {
    method: 'POST',
    body: { prompt: 'Qué dice Romanos 12:2', mode: 'exegesis' },
    headers: {},
  });
  assert(res.statusCode === 200, `status ${res.statusCode}`);
  const text = chatText(res.body);
  assert(text.length > 40, 'agente vacío');
  assert(!text.includes(SPURGEON_CANNED), 'agente-teologico aún pinta Spurgeon');
  assert(res.body?.commentary == null, 'no reenviar contrato commentary');
});

await run('POST /api/commentary sigue siendo commentary (otro endpoint)', async () => {
  const res = await call(commentaryHandler, {
    method: 'POST',
    body: { passage: 'Romanos 12:2', author: 'C. H. Spurgeon' },
    headers: {},
  });
  assert(res.statusCode === 200, `commentary status ${res.statusCode}`);
});

await run('POST /api/tsk Juan 14:1 sigue 200', async () => {
  const res = await call(tskHandler, {
    method: 'POST',
    body: { passage: 'Juan 14:1' },
    query: {},
    headers: {},
  });
  assert(res.statusCode === 200, `tsk status ${res.statusCode}`);
  const refs = res.body?.data?.referencias || res.body?.referencias || [];
  assert(refs.length > 0, 'TSK sin refs');
});

await run('POST /api/study-engine lexicon Juan 14:1 sigue 200', async () => {
  const res = await call(studyEngineHandler, {
    method: 'POST',
    body: { passage: 'Juan 14:1', mode: 'lexicon', verseText: 'No se turbe vuestro corazón.' },
    path: '/api/study-engine',
    url: '/api/study-engine',
    headers: {},
  });
  assert(res.statusCode === 200, `study-engine status ${res.statusCode}`);
  const answer = res.body?.answer || res.body?.text || '';
  assert(String(answer).trim().length > 20, 'study-engine lexicon vacío');
});

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} OK`);
if (failed.length) process.exit(1);
