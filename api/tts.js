/**
 * Éfata RevelatiO — /api/tts
 * Capa de audio aislada. Narra SOLO el texto bíblico que ya está en pantalla.
 * Nunca resume, nunca inventa, nunca llama a Gemini.
 *
 * POST JSON: { text }  ó  { passage, verseText }
 * Si verseText/text está vacío → 400.
 * Si falta ELEVENLABS_API_KEY → 503 { error: "ELEVENLABS_API_KEY no presente" }
 *
 * Voz por defecto: Daniel (onwK4e9ZLuTAKqWW03F9)
 *   Voz masculina multilingual de ElevenLabs, clara y pausada.
 *   Apta para narración en español con eleven_multilingual_v2.
 *   Override: ELEVENLABS_VOICE_ID
 */
import { loadProjectEnv } from '../lib/load-env.js';

export const TTS_VOICE_ID = 'onwK4e9ZLuTAKqWW03F9';
export const TTS_VOICE_NAME = 'Daniel';
export const TTS_MODEL = 'eleven_multilingual_v2';
export const TTS_TIMEOUT_MS = 20000;
export const TTS_MAX_CHARS = 5000;
export const TTS_MISSING_KEY = 'ELEVENLABS_API_KEY no presente';

const ELEVEN_URL = 'https://api.elevenlabs.io/v1/text-to-speech';

function envTrim(name) {
  loadProjectEnv();
  const v = process.env[name];
  if (typeof v !== 'string') return '';
  return v.trim().replace(/^['"]|['"]$/g, '');
}

export function getElevenApiKey() {
  return envTrim('ELEVENLABS_API_KEY');
}

export function getVoiceId() {
  return envTrim('ELEVENLABS_VOICE_ID') || TTS_VOICE_ID;
}

/**
 * Texto a narrar: verseText (preferido) o text.
 * `passage` es metadato; nunca se sintetiza solo ni se usa para inventar el versículo.
 */
export function resolveSpeakText(body = {}) {
  const verseText = String(body?.verseText ?? '').replace(/\s+/g, ' ').trim();
  const text = String(body?.text ?? '').replace(/\s+/g, ' ').trim();
  return verseText || text;
}

function readJsonBody(req) {
  const raw = req?.body;
  if (raw && typeof raw === 'object' && !Buffer.isBuffer(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw || '{}');
    } catch {
      return {};
    }
  }
  return {};
}

export async function synthesizeTts(plainText, opts = {}) {
  const apiKey = getElevenApiKey();
  if (!apiKey) {
    const err = new Error(TTS_MISSING_KEY);
    err.status = 503;
    throw err;
  }

  const text = String(plainText || '').replace(/\s+/g, ' ').trim();
  if (!text) {
    const err = new Error('verseText vacío');
    err.status = 400;
    throw err;
  }
  if (text.length > TTS_MAX_CHARS) {
    const err = new Error('El pasaje es demasiado largo para un solo tramo.');
    err.status = 400;
    throw err;
  }

  const voiceId = opts.voiceId || getVoiceId();
  const timeoutMs = Number(opts.timeoutMs) > 0 ? Number(opts.timeoutMs) : TTS_TIMEOUT_MS;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);

  let eleven;
  try {
    eleven = await fetch(`${ELEVEN_URL}/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: TTS_MODEL,
        voice_settings: {
          stability: 0.45,
          similarity_boost: 0.8,
          style: 0.2,
          use_speaker_boost: true,
        },
      }),
      signal: ctrl.signal,
    });
  } catch (err) {
    const timedOut = err?.name === 'AbortError';
    const wrapped = new Error(timedOut ? 'Tiempo de espera agotado al generar la voz.' : 'No se pudo contactar ElevenLabs.');
    wrapped.status = 502;
    throw wrapped;
  } finally {
    clearTimeout(timer);
  }

  if (!eleven?.ok) {
    const detalle = await eleven.text().catch(() => '');
    console.warn('[tts] elevenlabs', eleven?.status, String(detalle).slice(0, 180), 'voice=', voiceId);
    const wrapped = new Error('No se pudo generar la narración.');
    wrapped.status = eleven?.status === 401 || eleven?.status === 403 ? 502 : 502;
    throw wrapped;
  }

  const buffer = Buffer.from(await eleven.arrayBuffer());
  if (!buffer.length) {
    const err = new Error('No se pudo generar la narración.');
    err.status = 502;
    throw err;
  }
  return { buffer, voiceId, model: TTS_MODEL, contentType: 'audio/mpeg' };
}

function json(res, status, obj) {
  res.statusCode = status;
  if (typeof res.setHeader === 'function') {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
  }
  if (typeof res.status === 'function') res.status(status);
  if (typeof res.json === 'function') return res.json(obj);
  return res.end(JSON.stringify(obj));
}

export async function handleTts(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader?.('Allow', 'POST, OPTIONS');
    res.statusCode = 204;
    return typeof res.end === 'function' ? res.end() : res;
  }

  if (req.method !== 'POST') {
    res.setHeader?.('Allow', 'POST, OPTIONS');
    return json(res, 405, { error: 'Método no permitido.' });
  }

  const body = readJsonBody(req);
  const text = resolveSpeakText(body);
  if (!text) {
    return json(res, 400, { error: 'verseText vacío' });
  }

  if (!getElevenApiKey()) {
    return json(res, 503, { error: TTS_MISSING_KEY });
  }

  try {
    const result = await synthesizeTts(text);
    res.setHeader?.('Content-Type', result.contentType);
    res.setHeader?.('Cache-Control', 'private, max-age=120');
    res.setHeader?.('X-Revelatio-Voice-Id', result.voiceId);
    res.setHeader?.('X-Revelatio-Voice-Name', TTS_VOICE_NAME);
    res.setHeader?.('X-Revelatio-Tts-Model', result.model);
    res.setHeader?.('Content-Length', String(result.buffer.length));
    res.statusCode = 200;
    if (typeof res.status === 'function') res.status(200);
    if (typeof res.send === 'function') return res.send(result.buffer);
    return res.end(result.buffer);
  } catch (err) {
    const status = Number(err?.status) || 502;
    const message = err?.message || 'No se pudo generar la narración.';
    if (status === 503) return json(res, 503, { error: TTS_MISSING_KEY });
    return json(res, status, { error: message });
  }
}

export default handleTts;
