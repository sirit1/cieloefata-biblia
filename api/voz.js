import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sintetizarJorge, VOZ_JORGE } from '../lib/tts-jorge.js';

async function consumirCuotaSegura(req, user, endpoint) {
  try {
    const { consumirCuota } = await import('../lib/quota.js');
    return await consumirCuota(req, user, endpoint);
  } catch {
    // Sin node_modules / Supabase en preview local: la bienvenida no debe romperse.
    return { allowed: true, bypass: true };
  }
}

async function respuestaCuotaAgotadaSegura(res, cuota) {
  try {
    const { respuestaCuotaAgotada } = await import('../lib/quota.js');
    return respuestaCuotaAgotada(res, cuota);
  } catch {
    return res.status(429).json({ error: cuota?.error || 'Cuota agotada.' });
  }
}

const ELEVEN_URL = 'https://api.elevenlabs.io/v1';
const MAX_CHARS = 3500;
const MODELO = 'eleven_multilingual_v2';
const BLOQUEO_ES = /spain|castilian|castellano|es-es|madrid|catalan|peninsular|españa/;
const LATAM = /mexico|mexican|latam|latin american|latino|colombia|argentin|chile|peru|venezuela|es-mx|es-419|caribbean/;

let vocesCache = { at: 0, varon: null, hembra: null };
let cacheBienvenida = null;

function parseEnvFile(raw) {
  const out = {};
  const text = String(raw || '').replace(/^\uFEFF/, '');
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const cleaned = t.replace(/^export\s+/, '');
    const i = cleaned.indexOf('=');
    if (i < 1) continue;
    const k = cleaned.slice(0, i).trim();
    let v = cleaned.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (k) out[k] = v;
  }
  return out;
}

function cargarEnvLocal() {
  try {
    const here = dirname(fileURLToPath(import.meta.url));
    const dirs = [join(here, '..'), process.cwd(), here];
    const files = ['.env.local', '.env', '.env.development.local', '.env.development'];
    const seen = new Set();
    for (const dir of dirs) {
      for (const file of files) {
        const path = join(dir, file);
        if (seen.has(path)) continue;
        seen.add(path);
        try {
          const parsed = parseEnvFile(readFileSync(path, 'utf8'));
          for (const [k, v] of Object.entries(parsed)) {
            if (process.env[k] == null || process.env[k] === '') process.env[k] = v;
          }
        } catch { /* siguiente archivo */ }
      }
    }
  } catch { /* sin archivos de entorno en este runtime */ }
}

cargarEnvLocal();

const getSupabaseConfig = () => ({
  url: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  anonKey: process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

async function authenticate(req) {
  const token = req?.headers?.authorization?.replace(/^Bearer\s+/i, '');
  const { url, anonKey } = getSupabaseConfig();
  if (!token || !url || !anonKey) return null;
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await supabase.auth.getUser(token);
    return error ? null : data.user;
  } catch {
    return null;
  }
}

function blobVoz(voice) {
  const labels = voice.labels || {};
  return `${voice.name || ''} ${JSON.stringify(labels)} ${(voice.description || '')}`.toLowerCase();
}

function esLatam(voice) {
  const blob = blobVoz(voice);
  if (BLOQUEO_ES.test(blob)) return false;
  if (LATAM.test(blob)) return true;
  return /spanish|español/.test(blob) && !BLOQUEO_ES.test(blob);
}

function generoDe(voice) {
  const g = String(voice.labels?.gender || '').toLowerCase();
  if (g === 'male' || g === 'female') return g;
  const blob = blobVoz(voice);
  if (/female|mujer|femenin|woman|girl/.test(blob)) return 'female';
  if (/male|varón|varon|hombre|man\b/.test(blob)) return 'male';
  return '';
}

async function catalogoVoces(apiKey) {
  const res = await fetch(`${ELEVEN_URL}/voices`, {
    headers: { 'xi-api-key': apiKey, Accept: 'application/json' },
  });
  if (!res.ok) return [];
  const json = await res.json();
  return Array.isArray(json.voices) ? json.voices : [];
}

function elegir(voces, gender) {
  const pool = voces.filter(esLatam).filter(v => {
    const g = generoDe(v);
    return !g || g === gender;
  });
  const ranked = (pool.length ? pool : voces.filter(v => generoDe(v) === gender && !BLOQUEO_ES.test(blobVoz(v))));
  const score = (v) => {
    const blob = blobVoz(v);
    let n = 0;
    if (/mexico|mexican|es-mx/.test(blob)) n += 8;
    if (LATAM.test(blob)) n += 6;
    // Preferencia: joven latinoamericano México — claro, no ultra-grave.
    if (/mexic|mexican|es-mx/.test(blob)) n += 10;
    if (/young|youth|teen|conversational|friendly|casual|warm|clear/.test(blob)) n += 7;
    if (/latam|latin american|latino|colombia|argentin|chile|peru/.test(blob)) n += 5;
    if (/calm|soft|gentle|soothing|narrat|story|audiobook|pastoral/.test(blob)) n += 3;
    // Evitar voces muy graves/oscuras o teatrales (pierden claridad).
    if (/deep|baritone|bass|grave|dark|raspy|harsh|rough/.test(blob)) n -= 5;
    if (/bright|energetic|excited|child|cartoon/.test(blob)) n -= 3;
    if (/spanish|español/.test(blob)) n += 2;
    if (/english|british|american|australian|gringo/.test(blob) && !/spanish|español|mexic/.test(blob)) n -= 10;
    return n;
  };
  return [...ranked].sort((a, b) => score(b) - score(a))[0] || null;
}

function envTrim(name) {
  const v = process.env[name];
  if (typeof v !== 'string') return '';
  return v.trim().replace(/^['"]|['"]$/g, '');
}

async function resolverVoces(apiKey) {
  const envVaron = envTrim('ELEVENLABS_VOICE_VARON')
    || envTrim('ELEVENLABS_VOICE_ID')
    || envTrim('ELEVEN_VOICE_ID')
    || envTrim('ELEVENLABS_VOICE_MALE');
  const envHembra = envTrim('ELEVENLABS_VOICE_HEMBRA')
    || envTrim('ELEVENLABS_VOICE_FEMALE');
  if (envVaron) {
    return { varon: envVaron, hembra: envHembra || vocesCache.hembra || envVaron };
  }
  if (vocesCache.at && Date.now() - vocesCache.at < 60 * 60 * 1000 && vocesCache.varon && vocesCache.hembra) {
    return { varon: vocesCache.varon, hembra: vocesCache.hembra };
  }
  const voces = await catalogoVoces(apiKey);
  const varon = envVaron || elegir(voces, 'male')?.voice_id;
  const hembra = envHembra || elegir(voces, 'female')?.voice_id;
  if (varon && hembra) vocesCache = { at: Date.now(), varon, hembra };
  return { varon, hembra };
}

function prepararBienvenida(texto) {
  let t = String(texto || '').replace(/\s+/g, ' ').trim();
  if (!t) return t;
  // Coma → pausa real.
  t = t.replace(/,\s*/g, '. ');
  t = t.replace(/\.\s*\./g, '.');
  // Evitar que el TTS deletree el branding (RevelatiO / Éfata).
  t = t.replace(/RevelatiO/gi, 'Revelatio');
  t = t.replace(/Éfata/gi, 'Efata');
  t = t.replace(/\bBy\b/g, 'by');
  if (!/[.!?…]$/.test(t)) t += '.';
  return t;
}

function settingsBienvenida() {
  // Joven latinoamericano (México): clara, cálida, no ultra-grave.
  return {
    stability: 0.48,
    similarity_boost: 0.82,
    style: 0.28,
    use_speaker_boost: true,
    speed: 0.88,
  };
}

function settingsNarracion() {
  return {
    stability: 0.38,
    similarity_boost: 0.82,
    style: 0.44,
    use_speaker_boost: true,
    speed: 0.92,
  };
}

function prepararNarracion(texto, model) {
  let t = String(texto || '').replace(/\s+/g, ' ').trim();
  if (!t) return t;
  t = t.replace(/^[«"“]+|[»"”]+$/g, '');
  // Jorge (Edge TTS): texto limpio, sin marcas de ElevenLabs.
  if (model === 'edge' || /edge|jorge/i.test(String(model || ''))) {
    t = t.replace(/RevelatiO/gi, 'Revelatio');
    t = t.replace(/Éfata/gi, 'Efata');
    t = t.replace(/^(\d+)[.\)]\s*/, 'Versículo $1. ');
    return t;
  }
  const v3 = /eleven_v3|eleven_turbo_v2_5/.test(model);
  if (v3) {
    t = t.replace(/^(\d+)[.\)]\s*/, '[pause] Versículo $1. [breath] ');
    t = t.replace(/;\s*/g, '. [pause] ');
    t = t.replace(/\b(Jehová|Yahweh|Jesucristo|Señor Jesucristo)\b/g, '[emphasis] $1 [pause]');
    return t;
  }
  t = t.replace(/^(\d+)[.\)]\s*/, '$1. … ');
  t = t.replace(/;\s*/g, '; … ');
  t = t.replace(/:\s+/g, ': ');
  t = t.replace(/([.!?])\s+/g, '$1 … ');
  t = t.replace(/\b(Jehová|Yahweh|Jesucristo)\b/g, '… $1 …');
  return t;
}

async function llamarEleven(apiKey, voiceId, payload) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 22000);
  try {
    return await fetch(`${ELEVEN_URL}/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

/** Opcional: ID de voz Latam en ELEVENLABS_VOICE_VARON_ES (prioridad sobre VOICE_VARON). */
function payloadBienvenida(texto, model) {
  // flash_v2_5 acepta language_code para forzar fonética española.
  const usaFlash = /flash|turbo/i.test(model) || model === 'eleven_flash_v2_5';
  const base = {
    text: prepararBienvenida(texto),
    model_id: usaFlash ? model : 'eleven_flash_v2_5',
    voice_settings: settingsBienvenida(),
  };
  // ISO 639-1: fuerza normalización/pronunciación en español (no inglés).
  base.language_code = 'es';
  return base;
}

export function estadoVoz() {
  cargarEnvLocal();
  return {
    ready: true,
    voces: ['varon', 'hembra'],
    modelo: envTrim('ELEVENLABS_MODEL') || MODELO,
    voz_oficial: VOZ_JORGE,
  };
}

export async function sintetizarVoz({ texto, voz, previous, req, estilo } = {}) {
  try {
    cargarEnvLocal();
    const apiKey = envTrim('ELEVENLABS_API_KEY') || envTrim('ELEVEN_API_KEY') || envTrim('ELEVENLABS_KEY');

    const plano = String(texto || '').trim();
    const genero = voz === 'hembra' ? 'hembra' : 'varon';
    const bienvenida = estilo === 'bienvenida';
    const prev = typeof previous === 'string' ? previous.slice(0, 400) : '';
    if (!plano || plano.length < 2) return { status: 400, error: 'No hay texto para narrar.' };
    if (plano.length > MAX_CHARS) return { status: 400, error: 'El pasaje es demasiado largo para un solo tramo.' };

    if (req) {
      const user = await authenticate(req);
      if (user) {
        const cuota = await consumirCuotaSegura(req, user, 'voz');
        if (!cuota.allowed) {
          return {
            status: cuota.status || 429,
            error: cuota.error || 'Has alcanzado la cuota diaria de narración.',
            cuota,
          };
        }
      }
    }

    const leerBienvenidaLocal = () => {
      try {
        const here = dirname(fileURLToPath(import.meta.url));
        const audioDir = join(here, '..', 'audio');
        for (const name of ['bienvenida-varon.wav', 'bienvenida-varon.m4a', 'bienvenida-varon.mp3']) {
          try {
            const local = readFileSync(join(audioDir, name));
            if (!local?.length) continue;
            const contentType = name.endsWith('.wav')
              ? 'audio/wav'
              : name.endsWith('.mp3')
                ? 'audio/mpeg'
                : 'audio/mp4';
            return { status: 200, voz: 'varon', buffer: local, contentType, localFallback: true, motor: VOZ_JORGE.id };
          } catch { /* siguiente */ }
        }
      } catch { /* sin archivo */ }
      return null;
    };

    // Intro: archivo master (Jorge) ya masterizado con silencio.
    if (bienvenida) {
      if (cacheBienvenida) {
        return { status: 200, voz: 'varon', buffer: cacheBienvenida, contentType: 'audio/mpeg', motor: VOZ_JORGE.id };
      }
      const local = leerBienvenidaLocal();
      if (local) return local;
    }

    // Voz oficial de la app (lecturas / narración): Jorge México.
    if (genero === 'varon') {
      const textoJorge = bienvenida ? prepararBienvenida(plano) : prepararNarracion(plano, 'edge');
      const buf = await sintetizarJorge(textoJorge, { rate: VOZ_JORGE.rate });
      if (buf?.length) {
        if (bienvenida) cacheBienvenida = buf;
        return {
          status: 200,
          voz: 'varon',
          buffer: buf,
          contentType: 'audio/mpeg',
          motor: VOZ_JORGE.id,
        };
      }
      if (bienvenida) {
        const local = leerBienvenidaLocal();
        if (local) return local;
      }
    }

    // Hembra u fallback: ElevenLabs si hay clave.
    if (!apiKey) {
      if (bienvenida) {
        const local = leerBienvenidaLocal();
        if (local) return local;
      }
      return { status: 204, skipped: true };
    }

    const ids = await resolverVoces(apiKey);
    const voiceId = genero === 'hembra' ? ids.hembra : ids.varon;
    if (!voiceId) {
      if (bienvenida) {
        const local = leerBienvenidaLocal();
        if (local) return local;
      }
      return { status: 204, skipped: true };
    }

  const model = envTrim('ELEVENLABS_MODEL') || MODELO;
  const modelBienvenida = envTrim('ELEVENLABS_MODEL_BIENVENIDA') || 'eleven_flash_v2_5';
  const payload = bienvenida
    ? payloadBienvenida(plano, modelBienvenida)
    : {
        text: prepararNarracion(plano, model),
        model_id: model,
        voice_settings: settingsNarracion(),
      };
  if (prev) payload.previous_text = prev;

  const vocesIntento = [
    envTrim('ELEVENLABS_VOICE_VARON_ES'),
    voiceId,
  ].filter((id, i, arr) => id && arr.indexOf(id) === i);

  let eleven = null;
  let usada = voiceId;
  for (const id of vocesIntento) {
    try {
      eleven = await llamarEleven(apiKey, id, payload);
      usada = id;
      if (eleven?.ok) break;
      const detalle = await eleven.text().catch(() => '');
      console.warn('[voz] elevenlabs', eleven?.status, String(detalle).slice(0, 180), 'voice=', id);
      if (eleven?.status === 401 || eleven?.status === 403) break;
    } catch (err) {
      console.warn('[voz] elevenlabs red', err?.message || err);
      eleven = null;
    }
  }

  if (!eleven?.ok) {
    try {
      const voces = await catalogoVoces(apiKey);
      const propias = voces.filter((v) => {
        const cat = String(v.category || '').toLowerCase();
        return cat === 'cloned' || cat === 'generated' || cat === 'professional';
      });
      const latam = propias.find((v) => /spanish|español|mexic|latam|latino|colombia|argentin/.test(blobVoz(v))
        && generoDe(v) !== 'female');
      const male = propias.find((v) => generoDe(v) === 'male') || propias[0];
      const pick = latam || male;
      if (pick?.voice_id && pick.voice_id !== usada) {
        eleven = await llamarEleven(apiKey, pick.voice_id, payload);
        usada = pick.voice_id;
      }
    } catch (err) {
      console.warn('[voz] reintento catálogo', err?.message || err);
    }
  }
  if (!eleven?.ok) {
    if (bienvenida) {
      const local = leerBienvenidaLocal();
      if (local) return local;
    }
    return { status: 502, error: 'No se pudo generar la narración humana.' };
  }

  const buffer = Buffer.from(await eleven.arrayBuffer());
  if (!buffer.length) {
    console.warn('[voz] elevenlabs audio vacío');
    return { status: 502, error: 'No se pudo generar la narración humana.' };
  }
  if (bienvenida) cacheBienvenida = buffer;
  return { status: 200, voz: genero, buffer, contentType: 'audio/mpeg' };
  } catch {
    return { status: 204, skipped: true };
  }
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json(estadoVoz());
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Método no permitido.' });
  }

  const texto = typeof req.body?.texto === 'string'
    ? req.body.texto
    : (typeof req.body?.text === 'string' ? req.body.text : '');

  try {
    const result = await sintetizarVoz({
      texto,
      voz: req.body?.voz,
      previous: req.body?.previous,
      estilo: req.body?.estilo,
      req,
    });

    if (result.skipped || result.status === 204) {
      res.statusCode = 204;
      return res.end();
    }
    if (result.error) {
      if (result.cuota?.reason) return respuestaCuotaAgotadaSegura(res, result.cuota);
      return res.status(result.status || 502).json({ error: result.error });
    }

    res.setHeader('Content-Type', result.contentType || 'audio/mpeg');
    res.setHeader('Cache-Control', 'private, max-age=120');
    res.setHeader('X-Revelatio-Voz', result.voz);
    if (result.localFallback) res.setHeader('X-Revelatio-Voz-Fallback', 'local');
    if (result.buffer) res.setHeader('Content-Length', String(result.buffer.length));
    res.statusCode = 200;
    if (typeof res.send === 'function') return res.send(result.buffer);
    return res.end(result.buffer);
  } catch (err) {
    console.warn('[voz]', err?.message || err);
    if (!res.headersSent) return res.status(502).json({ error: 'El motor de voz no respondió.' });
  }
}
