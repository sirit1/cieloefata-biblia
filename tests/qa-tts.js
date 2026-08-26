/**
 * Pruebas aisladas de /api/tts: texto estricto, sin Gemini, sin clave → 503.
 */
import { handleTts, resolveSpeakText, TTS_MISSING_KEY, TTS_VOICE_ID } from '../api/tts.js';

const results = [];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function mockRes() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    ended: false,
    setHeader(k, v) {
      this.headers[k] = v;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(obj) {
      this.body = obj;
      this.ended = true;
      return this;
    },
    send(buf) {
      this.body = buf;
      this.ended = true;
      return this;
    },
    end(buf) {
      if (buf !== undefined) this.body = buf;
      this.ended = true;
      return this;
    },
  };
}

async function run(name, fn) {
  const t0 = Date.now();
  try {
    await fn();
    results.push({ name, status: 'PASS' });
    console.log(`✔ PASS [${Date.now() - t0}ms] - ${name}`);
  } catch (err) {
    results.push({ name, status: 'FAIL', error: err.message });
    console.log(`✖ FAIL [${Date.now() - t0}ms] - ${name}`);
    console.log(`  └─> ${err.message}`);
  }
}

const savedKey = process.env.ELEVENLABS_API_KEY;
process.env.ELEVENLABS_API_KEY = '';

await run('resolveSpeakText usa solo verseText', () => {
  assert(resolveSpeakText({ verseText: '  En el principio  ' }) === 'En el principio', 'verseText no se normalizó');
  assert(resolveSpeakText({ text: 'Y la tierra estaba desordenada' }) === '', 'text no debe narrarse');
  assert(resolveSpeakText({ passage: 'Génesis 1:1' }) === '', 'passage no debe inventar texto');
  assert(resolveSpeakText({ passage: 'Génesis 1:1', verseText: '' }) === '', 'verseText vacío debe quedar vacío');
  assert(resolveSpeakText({}) === '', 'cuerpo vacío');
});

await run('POST sin verseText → 400', async () => {
  const res = mockRes();
  await handleTts({ method: 'POST', body: { passage: 'Romanos 12:2' } }, res);
  assert(res.statusCode === 400, `esperado 400, recibido ${res.statusCode}`);
  assert(res.body?.error === 'verseText vacío', `error inesperado: ${JSON.stringify(res.body)}`);
});

await run('POST { text } sin verseText → 400', async () => {
  const res = mockRes();
  await handleTts({ method: 'POST', body: { text: 'Los sanos no tienen necesidad de médico.' } }, res);
  assert(res.statusCode === 400, `esperado 400, recibido ${res.statusCode}`);
});

await run('POST con verseText y sin clave → 503 exacto', async () => {
  const res = mockRes();
  await handleTts({ method: 'POST', body: { verseText: 'Los sanos no tienen necesidad de médico, sino los enfermos.' } }, res);
  assert(res.statusCode === 503, `esperado 503, recibido ${res.statusCode}`);
  assert(res.body?.error === TTS_MISSING_KEY, `error inesperado: ${JSON.stringify(res.body)}`);
  assert(typeof res.body?.error === 'string', 'debe ser JSON, no audio falso');
});

await run('GET no está permitido', async () => {
  const res = mockRes();
  await handleTts({ method: 'GET' }, res);
  assert(res.statusCode === 405, `esperado 405, recibido ${res.statusCode}`);
});

await run('voz documentada es Daniel multilingual', () => {
  assert(TTS_VOICE_ID === 'onwK4e9ZLuTAKqWW03F9', 'voice id cambió sin documentar');
});

if (savedKey != null) process.env.ELEVENLABS_API_KEY = savedKey;

const failed = results.filter((r) => r.status === 'FAIL');
console.log(`\n${results.length - failed.length}/${results.length} tests ok`);
if (failed.length) process.exit(1);
