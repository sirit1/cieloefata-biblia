/**
 * Faithful PD English → Spanish for stored commentary blobs.
 * Never summarizes, never adds verses, never impersonates the author.
 * Google first, then Gateway (translate-only), then MyMemory.
 */
export const TRANSLATE_PROMPT =
  'Traduce al español, de forma fiel, el texto inglés de dominio público que sigue. No resumas, no acortes, no omitas, no añadas, y no insertes citas bíblicas que no estén en la fuente. Conserva griego, hebreo y la estructura. Devuelve solo la traducción en español.\n\n';

const inflight = new Map();

export function looksSpanish(s) {
  const sample = String(s || '').slice(0, 700);
  if (/[áéíóúñü¿¡]/i.test(sample)) return true;
  const esHits = (sample.match(/\b(que|los|las|del|una|por|como|para|este|esta|sus)\b/gi) || []).length;
  const enHits = (sample.match(/\b(the|and|that|which|this|from|with|have|been)\b/gi) || []).length;
  return esHits >= 5 && esHits > enHits;
}

export function looksEnglish(s) {
  const sample = String(s || '').slice(0, 700);
  if (/[áéíóúñü¿¡]/i.test(sample)) return false;
  const enHits = (sample.match(/\b(the|and|that|which|this|from|with|have|been|they|them)\b/gi) || []).length;
  return enHits >= 5;
}

function flattenTranslateJson(json) {
  if (typeof json === 'string') return json;
  if (!Array.isArray(json)) return '';
  if (json.every((x) => typeof x === 'string')) return json[0] || '';
  const parts = [];
  const walk = (node) => {
    if (typeof node === 'string') {
      parts.push(node);
      return;
    }
    if (Array.isArray(node)) {
      if (typeof node[0] === 'string' && node.length >= 1) {
        parts.push(node[0]);
        return;
      }
      node.forEach(walk);
    }
  };
  walk(json);
  return parts.join('');
}

function chunkEnglish(text, max = 2400) {
  const src = String(text || '');
  if (src.length <= max) return [src];
  const paras = src.split(/\n{2,}/);
  const chunks = [];
  let buf = '';
  const push = () => {
    if (buf) chunks.push(buf);
    buf = '';
  };
  for (const para of paras) {
    if ((buf + '\n\n' + para).length > max && buf) push();
    if (para.length > max) {
      const sentences = para.split(/(?<=[.!?])\s+/);
      for (const s of sentences) {
        if ((buf + ' ' + s).length > max && buf) push();
        if (s.length > max) {
          for (let i = 0; i < s.length; i += max) chunks.push(s.slice(i, i + max));
        } else {
          buf = buf ? `${buf} ${s}` : s;
        }
      }
    } else {
      buf = buf ? `${buf}\n\n${para}` : para;
    }
  }
  push();
  return chunks.filter(Boolean);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function translateChunkGoogle(text, attempt = 0) {
  const url =
    'https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=en&tl=es&q=' +
    encodeURIComponent(text);
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36',
      Accept: 'application/json,*/*',
    },
  });
  if ((res.status === 429 || res.status >= 500) && attempt < 5) {
    await sleep(400 * 2 ** attempt);
    return translateChunkGoogle(text, attempt + 1);
  }
  if (!res.ok) throw new Error(`translate http ${res.status}`);
  const json = await res.json();
  return flattenTranslateJson(json).trim();
}

async function translateChunkMyMemory(text) {
  const url =
    'https://api.mymemory.translated.net/get?langpair=en|es&q=' + encodeURIComponent(text.slice(0, 450));
  const res = await fetch(url, { headers: { 'User-Agent': 'RevelatioCorpus/1.0' } });
  if (!res.ok) throw new Error(`mymemory http ${res.status}`);
  const json = await res.json();
  const out = String(json?.responseData?.translatedText || '').trim();
  if (!out || /INVALID QUERY|MYMEMORY WARNING/i.test(out)) throw new Error('mymemory empty');
  return out;
}

async function translateChunkGateway(text) {
  const { generarTexto, hayMotorIA } = await import('./ai.js');
  if (!hayMotorIA()) throw new Error('no gateway');
  const es = await generarTexto(TRANSLATE_PROMPT + text, { maxOutputTokens: 8000 });
  if (!es || es.length < 20) throw new Error('Traducción vacía');
  return es.trim();
}

async function translateOnce(english) {
  const chunks = chunkEnglish(english);
  const out = [];
  for (const chunk of chunks) {
    let es = '';
    try {
      es = await translateChunkGoogle(chunk);
    } catch {
      try {
        es = await translateChunkGateway(chunk);
      } catch {
        es = await translateChunkMyMemory(chunk);
      }
    }
    if (!es) throw new Error('chunk vacío');
    out.push(es);
  }
  const joined = out.join('\n\n').trim();
  if (looksEnglish(joined) && !looksSpanish(joined)) {
    throw new Error('la salida sigue en inglés');
  }
  return joined;
}

/** Deduped by caller hash. Same English blob in-flight = one translate. */
export async function translateFaithfulPd(english, digest = '') {
  const src = String(english || '').trim();
  if (!src) return '';
  if (looksSpanish(src) && !looksEnglish(src)) return src;
  const key = digest || src.slice(0, 80);
  if (inflight.has(key)) return inflight.get(key);
  const pending = translateOnce(src).finally(() => inflight.delete(key));
  inflight.set(key, pending);
  return pending;
}
