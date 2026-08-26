/**
 * TSK / OpenBible cross-references (helloao open-cross-ref).
 *
 * PRODUCT LAW (Alejandro): lookup by book+chapter+verse coordinates for EVERY
 * passage. Version (RVR1960/NVI/DHH/TLA) only chooses the Spanish quote of
 * each ref, never whether refs exist. Empty only when TSK has no row for that
 * coordinate. No per-verse special cases.
 *
 * Verse-keyed corpus. Never Gemini. Never Bolls keyword search.
 */
import { LIBROS, resolverVersion } from './biblia.js';
import {
  parseConsultaFlexible,
  etiquetaReferencia,
  obtenerTextoVersion,
} from './consulta-contexto.js';
import { limpiarTextoVerso } from './glosa-es.js';

const HELLOAO = 'https://bible.helloao.org/api/d/open-cross-ref';
const UA = 'RevelatioTSK/1.0 (open-cross-ref)';
const MAX_REFS = 12;

const USFM = [
  'GEN', 'EXO', 'LEV', 'NUM', 'DEU', 'JOS', 'JDG', 'RUT', '1SA', '2SA',
  '1KI', '2KI', '1CH', '2CH', 'EZR', 'NEH', 'EST', 'JOB', 'PSA', 'PRO',
  'ECC', 'SNG', 'ISA', 'JER', 'LAM', 'EZK', 'DAN', 'HOS', 'JOL', 'AMO',
  'OBA', 'JON', 'MIC', 'NAM', 'HAB', 'ZEP', 'HAG', 'ZEC', 'MAL',
  'MAT', 'MRK', 'LUK', 'JHN', 'ACT', 'ROM', '1CO', '2CO', 'GAL', 'EPH',
  'PHP', 'COL', '1TH', '2TH', '1TI', '2TI', 'TIT', 'PHM',
  'HEB', 'JAS', '1PE', '2PE', '1JN', '2JN', '3JN', 'JUD', 'REV',
];

const chapterCache = new Map();

/** Spanish catalog only. KJV / English codes fall back to RV1960. */
export function versionTskEspanol(raw) {
  const v = resolverVersion(raw);
  return { key: v.key, bolls: v.bolls, etiqueta: v.etiqueta };
}

function esCitaInglesa(texto) {
  const t = String(texto || '').trim();
  if (!t) return true;
  if (/[áéíóúñü¿¡]/i.test(t)) return false;
  if (/\b(thee|thou|thy|ye|hath|saith|unto|whosoever|verily)\b/i.test(t)) return true;
  if (/\b(the|and|that|they|who|with|from|this|not|but|for|are|have)\b/i.test(t)
    && !/\b(los|las|que|del|por|para|con|los|una|unos|dios|señor|jesús|jesus)\b/i.test(t)) {
    return true;
  }
  return false;
}

function citaEspanol(libro, capitulo, verso, fin) {
  if (fin && fin !== verso) return `${libro} ${capitulo}:${verso}-${fin}`;
  return `${libro} ${capitulo}:${verso}`;
}

function textoDeVersos(got) {
  const versos = Array.isArray(got?.versos) ? got.versos : [];
  const joined = versos
    .map((v) => limpiarTextoVerso(v.text || v.texto || ''))
    .filter(Boolean)
    .join(' ')
    .replace(/^\d+\.\s*/, '')
    .trim();
  if (joined) return joined.replace(/\b\d+\.\s+/g, '').trim();
  return limpiarTextoVerso(got?.texto || '').replace(/^\d+\.\s*/, '').replace(/\b\d+\.\s+/g, '').trim();
}

async function loadOpenCrossRef(usfm, chapter) {
  const key = `${usfm}:${chapter}`;
  if (chapterCache.has(key)) return chapterCache.get(key);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12000);
  try {
    const res = await fetch(`${HELLOAO}/${encodeURIComponent(usfm)}/${encodeURIComponent(chapter)}.json`, {
      signal: ctrl.signal,
      headers: { Accept: 'application/json', 'User-Agent': UA },
    });
    if (!res.ok) {
      chapterCache.set(key, []);
      return [];
    }
    const json = await res.json();
    const content = json?.chapter?.content || json?.content || [];
    const list = Array.isArray(content) ? content : [];
    chapterCache.set(key, list);
    return list;
  } catch {
    chapterCache.set(key, []);
    return [];
  } finally {
    clearTimeout(timer);
  }
}

function refsForVerse(content, verse) {
  const v = Number(verse) || 1;
  const item = (Array.isArray(content) ? content : []).find((row) => Number(row?.verse) === v);
  const refs = Array.isArray(item?.references) ? item.references.slice() : [];
  refs.sort((a, b) => (Number(b.score) || 0) - (Number(a.score) || 0));
  return refs.slice(0, MAX_REFS);
}

async function citarEnEspanol(refObj, preferredBolls) {
  const order = [preferredBolls, 'RV1960', 'NVI', 'TLA'].filter(
    (v, i, a) => v && a.indexOf(v) === i,
  );
  for (const bolls of order) {
    try {
      const got = await obtenerTextoVersion(refObj, bolls);
      const texto = textoDeVersos(got);
      if (texto && !esCitaInglesa(texto)) return texto;
    } catch {
      /* siguiente versión */
    }
  }
  return '';
}

/**
 * @returns {Promise<{success:boolean, found:boolean, fuente:string, data:{referencia:string, version:string, fuente:string, referencias:Array}}>}
 */
export async function obtenerTsk(input = {}) {
  const passage = String(
    input.passage || input.consulta || input.referencia || input.ref || '',
  ).trim();
  const ref = parseConsultaFlexible({
    ...input,
    referencia: passage || input.referencia,
    passage,
    book: input.book || input.libro,
    chapter: input.chapter || input.capitulo,
    verse: input.verse || input.verso,
  }) || parseConsultaFlexible(passage);

  const versionMeta = versionTskEspanol(input.version || input.traduccion || 'RV1960');
  const etiqueta = ref ? etiquetaReferencia(ref) : passage;

  const vacio = {
    success: true,
    found: false,
    fuente: 'tsk-open-cross-ref',
    data: {
      referencia: etiqueta,
      version: versionMeta.etiqueta,
      fuente: 'tsk-open-cross-ref',
      referencias: [],
    },
  };

  if (!ref?.libroId || !ref.capitulo) return vacio;

  const usfm = USFM[ref.libroId - 1];
  if (!usfm) return vacio;

  const verse = ref.versoInicio || 1;
  const content = await loadOpenCrossRef(usfm, ref.capitulo);
  const cruzadas = refsForVerse(content, verse);
  const pending = [];
  const seen = new Set();

  for (const cruz of cruzadas) {
    const bookId = String(cruz?.book || '').toUpperCase();
    const idx = USFM.indexOf(bookId);
    if (idx < 0) continue;
    const libro = LIBROS[idx];
    const capitulo = Number(cruz.chapter) || 0;
    const verso = Number(cruz.verse) || 0;
    const fin = Number(cruz.endVerse) || verso;
    if (!capitulo || !verso) continue;
    const cita = citaEspanol(libro, capitulo, verso, fin);
    const k = cita.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    pending.push({
      cita,
      refObj: {
        libro,
        libroId: idx + 1,
        capitulo,
        versoInicio: verso,
        versoFin: fin,
      },
    });
  }

  const out = await Promise.all(
    pending.map(async (row) => {
      const texto = await citarEnEspanol(row.refObj, versionMeta.bolls);
      return {
        ref: row.cita,
        texto,
        nota: 'TSK / OpenBible',
      };
    }),
  );

  return {
    success: true,
    found: out.length > 0,
    fuente: 'tsk-open-cross-ref',
    data: {
      referencia: etiquetaReferencia({ ...ref, versoInicio: verse, versoFin: verse }),
      version: versionMeta.etiqueta,
      fuente: 'tsk-open-cross-ref',
      referencias: out,
    },
  };
}
