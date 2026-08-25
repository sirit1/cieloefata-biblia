/**
 * Traducción al español del griego de la Septuaginta (Rahlfs / Bolls LXX).
 * No usa Reina-Valera ni el texto masorético: traduce el griego del capítulo.
 */
import { resolveGeminiApiKey } from './load-env.js';

const cache = new Map();
const inflight = new Map();
const MODELS = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash'];
const TIMEOUT_MS = 45000;

function cacheKey(libro, capitulo, count) {
  return `lxx-es:${String(libro || '').trim()}:${Number(capitulo)}:${Number(count)}`;
}

function parseJsonObject(raw) {
  const text = String(raw || '').trim();
  if (!text) return null;
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fence ? fence[1].trim() : text;
  const start = body.indexOf('{');
  const end = body.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(body.slice(start, end + 1));
  } catch {
    return null;
  }
}

function mapaDesdePayload(payload) {
  const out = {};
  const list = Array.isArray(payload?.versos)
    ? payload.versos
    : Array.isArray(payload)
      ? payload
      : [];
  for (const item of list) {
    const n = Number(item?.n || item?.verse || item?.number || 0);
    const es = String(item?.es || item?.textoEs || item?.text || item?.texto || '').replace(/\s+/g, ' ').trim();
    if (n > 0 && es) out[n] = es;
  }
  return out;
}

async function generateOnce(apiKey, model, prompt, signal) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.15,
          maxOutputTokens: 8192,
          thinkingConfig: { thinkingLevel: 'minimal' },
          responseMimeType: 'application/json',
        },
      }),
    }
  );
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const msg = data?.error?.message || `Gemini ${model} HTTP ${response.status}`;
    if (/thinking|mime|responseMimeType/i.test(msg)) {
      const retry = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal,
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.15,
              maxOutputTokens: 8192,
            },
          }),
        }
      );
      const retryData = await retry.json().catch(() => ({}));
      if (!retry.ok) throw new Error(retryData?.error?.message || msg);
      const parts = retryData?.candidates?.[0]?.content?.parts || [];
      return parts.map((p) => p.text || '').join('\n');
    }
    throw new Error(msg);
  }
  const parts = data?.candidates?.[0]?.content?.parts || [];
  return parts.map((p) => p.text || '').join('\n');
}

function promptLote(libro, capitulo, lote) {
  const lineas = lote.map((v) => `${v.n}. ${String(v.texto || '').replace(/\s+/g, ' ').trim()}`).join('\n');
  return `Traduce al español (castellano bíblico claro) el griego de la Septuaginta (LXX, ed. Rahlfs) de ${libro} ${capitulo}.
NO uses la Reina-Valera ni el texto masorético hebreo. Traduce el griego que te doy, aunque esté lematizado.
Devuelve SOLO JSON con esta forma exacta:
{"versos":[{"n":1,"es":"..."},{"n":2,"es":"..."}]}
Incluye TODOS los versículos del lote, sin omitir ni fusionar. Un objeto por número.

GRIEGO:
${lineas}`;
}

async function traducirLote(apiKey, libro, capitulo, lote) {
  const prompt = promptLote(libro, capitulo, lote);
  let lastError = null;
  for (const model of MODELS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const raw = await generateOnce(apiKey, model, prompt, controller.signal);
      const mapa = mapaDesdePayload(parseJsonObject(raw));
      if (Object.keys(mapa).length) return mapa;
      lastError = new Error('JSON de traducción vacío');
    } catch (err) {
      lastError = err?.name === 'AbortError' ? new Error('Traducción LXX agotó el tiempo') : err;
    } finally {
      clearTimeout(timer);
    }
  }
  if (lastError) console.warn('[lxx-es]', lastError.message || lastError);
  return {};
}

export async function traducirLxxAlEspanol(libro, capitulo, versos) {
  const lista = (versos || []).filter((v) => Number(v.n || v.verse) > 0 && String(v.texto || v.text || '').trim());
  if (!lista.length) return {};
  const key = cacheKey(libro, capitulo, lista.length);
  if (cache.has(key)) return cache.get(key);
  if (inflight.has(key)) return inflight.get(key);

  const job = (async () => {
    const apiKey = resolveGeminiApiKey();
    if (!apiKey) return {};
    const normalizados = lista.map((v) => ({
      n: Number(v.n || v.verse),
      texto: String(v.texto || v.text || '').trim(),
    }));
    const mapa = {};
    const TAM = 12;
    for (let i = 0; i < normalizados.length; i += TAM) {
      const lote = normalizados.slice(i, i + TAM);
      Object.assign(mapa, await traducirLote(apiKey, libro, capitulo, lote));
    }
    if (Object.keys(mapa).length) cache.set(key, mapa);
    return mapa;
  })();

  inflight.set(key, job);
  try {
    return await job;
  } finally {
    inflight.delete(key);
  }
}

export function anexarTextoEs(versos, mapa) {
  return (versos || []).map((v) => {
    const n = Number(v.n || v.verse || 0);
    const es = mapa?.[n] || v.textoEs || v.textEs || '';
    return es ? { ...v, textoEs: es } : { ...v };
  });
}
