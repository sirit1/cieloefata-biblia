/**
 * Stored Spanish layer for English PD commentary.
 * Lookup: data/commentaries/es/{book-slug}/{authorId}.json
 *
 * PRODUCT LAW (Alejandro): if English corpus found:true, Spanish body on THIS
 * request. Stored ES first; if missing, faithful PD translate NOW, persist by
 * hash, return Spanish + original. Never impersonate. Never «certificada».
 * Honest miss only when the corpus has no covering English. Range covering
 * (previous verse / pericope) is for range-keyed authors only. No
 * `if (passage === …)` special cases. Any author, OT and NT.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { looksSpanish, translateFaithfulPd } from './comentario-traducir.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const DISCLAIMER_ES =
  'Traducción automática del original inglés (dominio público). No es la edición de CLIE.';

const fileCache = new Map();

/** Authors whose English corpus is keyed by verse ranges / pericopes. */
export const RANGE_KEYED_AUTHORS = new Set([
  'charles-spurgeon',
  'john-wesley',
  'martin-luther',
  'agustin-de-hipona',
  'matthew-henry',
]);

export function authorAllowsRangeCovering(authorId) {
  return RANGE_KEYED_AUTHORS.has(String(authorId || '').trim());
}

function foldBook(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function hashEnglish(text) {
  return createHash('sha256').update(String(text || '').trim(), 'utf8').digest('hex');
}

/** Collapse PD chrome so StudyLight leftovers still match the stored blob. */
export function normalizeCommentaryEnglish(text) {
  return String(text || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\b(?:class|id|style|data-[\w-]+|name)=["'][^"']*["']/gi, ' ')
    .replace(/&mdash;|&#8212;|&#x2014;/gi, '-')
    .replace(/&ndash;|&#8211;|&#x2013;/gi, '-')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ')
    .replace(/[–—]/g, '-')
    .replace(/^[\s>]+/, '')
    .replace(/^Verse\s+\d+\s*/i, '')
    .replace(/return to[\s\S]{0,80}Top of Page/gi, ' ')
    .replace(/<a\s*$/g, '')
    .replace(/\s+([,.;:])/g, '$1')
    .replace(/:\s*-/g, ': -')
    .replace(/\s+/g, ' ')
    .replace(/['"<\s]+$/g, '')
    .trim();
}

function tmpLayerPath(bookSlug, authorId) {
  return join('/tmp', 'commentaries-es', bookSlug, `${authorId}.json`);
}

function bundledLayerPaths(bookSlug, authorId) {
  const file = join('data', 'commentaries', 'es', bookSlug, `${authorId}.json`);
  return [
    join(ROOT, file),
    join(process.cwd(), file),
    join(ROOT, 'public', file),
    join(process.cwd(), 'public', file),
  ];
}

function readJsonIfExists(p) {
  if (!p || !existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

function mergeLayers(base, overlay) {
  if (!base && !overlay) return null;
  return {
    book: overlay?.book || base?.book || '',
    usfm: overlay?.usfm || base?.usfm || '',
    authorId: overlay?.authorId || base?.authorId || '',
    disclaimer: DISCLAIMER_ES,
    blobs: { ...(base?.blobs || {}), ...(overlay?.blobs || {}) },
    verses: { ...(base?.verses || {}), ...(overlay?.verses || {}) },
  };
}

function emptyLayer(book, authorId) {
  return {
    book: book || '',
    usfm: '',
    authorId,
    disclaimer: DISCLAIMER_ES,
    blobs: {},
    verses: {},
  };
}

export function loadAuthorLayer(bookSlug, authorId) {
  const slug = foldBook(bookSlug);
  const id = String(authorId || '').trim();
  if (!slug || !id) return null;
  const key = `${slug}:${id}`;
  if (fileCache.has(key)) return fileCache.get(key);
  let bundled = null;
  for (const p of bundledLayerPaths(slug, id)) {
    bundled = readJsonIfExists(p);
    if (bundled) break;
  }
  const overlay = readJsonIfExists(tmpLayerPath(slug, id));
  const layer = mergeLayers(bundled, overlay);
  fileCache.set(key, layer);
  return layer;
}

function verseKeyFromPassage(passage) {
  const m = String(passage || '').match(/(\d+)\s*:\s*(\d+)/);
  if (!m) return '';
  return `${Number(m[1])}:${Number(m[2])}`;
}

function bookFromPassage(passage) {
  const m = String(passage || '').trim().match(/^((?:[1-3]\s+)?[^\d:]+?)\s+\d+/);
  return m ? m[1].trim() : '';
}

function resolveVerseRow(layer, vKey) {
  const row = layer?.verses?.[vKey];
  if (!row) return null;
  if (typeof row === 'string') return layer.blobs?.[row] || null;
  return row;
}

function coveringStoredRow(layer, vKey) {
  const m = String(vKey || '').match(/^(\d+):(\d+)$/);
  if (!m || !layer) return null;
  return lookupStoredVerseFromLayer(layer, Number(m[1]), Number(m[2]), true);
}

function lookupStoredVerseFromLayer(layer, chapter, verse, covering) {
  const ch = Number(chapter) || 0;
  const v = Number(verse) || 0;
  if (!ch || !v) return null;
  const exact = resolveVerseRow(layer, `${ch}:${v}`);
  if (exact && (String(exact.es || '').trim() || String(exact.en || '').trim())) return exact;
  if (!covering) return null;
  const keys = Object.keys(layer.verses || {})
    .map((k) => k.split(':').map(Number))
    .filter(([c, n]) => c === ch && n > 0);
  const prev = keys.filter(([, n]) => n < v).sort((a, b) => b[1] - a[1])[0];
  if (!prev) return null;
  const row = resolveVerseRow(layer, `${prev[0]}:${prev[1]}`);
  if (row && (String(row.es || '').trim() || String(row.en || '').trim())) return row;
  return null;
}

/**
 * Exact verse, then (range-keyed authors only) covering previous verse
 * in the same chapter. Calvin/Gill/JFB/Clarke stay exact-verse unless the
 * English blob hashes onto stored Spanish.
 */
export function lookupStoredVerse(bookSlug, authorId, chapter, verse, opts = {}) {
  const layer = loadAuthorLayer(bookSlug, authorId);
  if (!layer) return null;
  const covering = opts.covering ?? authorAllowsRangeCovering(authorId);
  return lookupStoredVerseFromLayer(layer, chapter, verse, covering);
}

function blobMatchesEnglish(blob, english, digest) {
  if (!blob) return false;
  const es = String(blob.es || '').trim();
  if (!es) return false;
  const storedEn = String(blob.en || '').trim();
  const liveNorm = normalizeCommentaryEnglish(english);
  const storedNorm = normalizeCommentaryEnglish(storedEn);
  if (blob.enHash && blob.enHash === digest) return true;
  if (storedEn && storedEn === english) return true;
  if (liveNorm && storedNorm && liveNorm === storedNorm) return true;
  if (blob.enHash && liveNorm && blob.enHash === hashEnglish(liveNorm)) return true;
  return false;
}

function resolveBlob(layer, vKey, english) {
  const digest = hashEnglish(english);
  const row = resolveVerseRow(layer, vKey);
  if (blobMatchesEnglish(row, english, digest)) return row;
  const blobs = layer?.blobs && typeof layer.blobs === 'object' ? Object.values(layer.blobs) : [];
  const liveNorm = normalizeCommentaryEnglish(english);
  for (const blob of blobs) {
    if (blobMatchesEnglish(blob, english, digest)) return blob;
  }
  if (liveNorm) {
    for (const blob of blobs) {
      if (normalizeCommentaryEnglish(blob?.en) === liveNorm && String(blob?.es || '').trim()) return blob;
    }
  }
  return null;
}

export function clearCommentaryEsCache() {
  fileCache.clear();
}

function nextBlobId(blobs) {
  let n = Object.keys(blobs || {}).length + 1;
  while (blobs[`b${n}`]) n += 1;
  return `b${n}`;
}

function tryWriteLayer(slug, authorId, layer) {
  const body = JSON.stringify(layer, null, 2) + '\n';
  const targets = [
    tmpLayerPath(slug, authorId),
    join(ROOT, 'data', 'commentaries', 'es', slug, `${authorId}.json`),
    join(ROOT, 'public', 'data', 'commentaries', 'es', slug, `${authorId}.json`),
  ];
  for (const p of targets) {
    try {
      mkdirSync(dirname(p), { recursive: true });
      writeFileSync(p, body);
    } catch (err) {
      console.warn('[comentario-es] persist', p, err?.message || err);
    }
  }
}

/**
 * Persist a faithful Spanish blob keyed by English hash. Warm instances
 * (fileCache + /tmp) see it on the next open; bundled data/ is best-effort.
 */
export function persistSpanishBlob({ book, authorId, vKey, english, es, source } = {}) {
  const slug = foldBook(book);
  const id = String(authorId || '').trim();
  const en = String(english || '').trim();
  const spanish = String(es || '').trim();
  if (!slug || !id || !en || !spanish) return null;
  const digest = hashEnglish(en);
  if (en.length >= 500 && spanish.length < en.length * 0.4) {
    console.warn('[comentario-es] refuse incomplete ES', id, vKey, en.length, spanish.length);
    return null;
  }
  const layer = loadAuthorLayer(book, id) || emptyLayer(book, id);
  layer.book = layer.book || book;
  layer.authorId = id;
  layer.blobs = layer.blobs || {};
  layer.verses = layer.verses || {};
  let blobId = null;
  for (const [bid, blob] of Object.entries(layer.blobs)) {
    if (blob?.enHash === digest) {
      blobId = bid;
      break;
    }
  }
  if (!blobId) blobId = nextBlobId(layer.blobs);
  layer.blobs[blobId] = {
    en,
    es: spanish,
    enHash: digest,
    source: source || layer.blobs[blobId]?.source || '',
  };
  if (vKey) layer.verses[vKey] = blobId;
  const cacheKey = `${slug}:${id}`;
  fileCache.set(cacheKey, layer);
  tryWriteLayer(slug, id, layer);
  return layer;
}

function spanishPayload(result, english, es) {
  const next = {
    ...result,
    text: es,
    textEs: es,
    textEn: english,
    translated: true,
    lang: 'es',
    disclaimer: DISCLAIMER_ES,
    translationSource: result.translationSource || 'stored-es',
  };
  if (next.data && typeof next.data === 'object') {
    next.data = {
      ...next.data,
      cuerpo: es,
      cuerpoEn: english,
      traducido: true,
      disclaimer: DISCLAIMER_ES,
    };
  }
  return next;
}

/**
 * Attach stored Spanish when the English blob matches.
 * If the store has no ES layer, callers use ensureCommentarySpanish.
 */
export function attachStoredSpanish(result) {
  if (!result?.found) {
    return {
      ...result,
      translated: false,
      lang: 'en',
      textEn: String(result?.text || ''),
      textEs: '',
      disclaimer: '',
    };
  }
  const english = String(result.text || '').trim();
  const authorId = result.authorId;
  const book = bookFromPassage(result.passage);
  const vKey = verseKeyFromPassage(result.passage);
  const layer = loadAuthorLayer(book, authorId);
  const row = resolveBlob(layer, vKey, english)
    || (authorAllowsRangeCovering(authorId) ? coveringStoredRow(layer, vKey) : null);
  const es = String(row?.es || '').trim();
  const storedEn = String(row?.en || '').trim();
  if (!es) {
    return {
      ...result,
      translated: false,
      lang: 'en',
      textEn: english,
      textEs: '',
      disclaimer: '',
    };
  }
  const next = {
    ...result,
    text: es,
    textEs: es,
    textEn: storedEn || english,
    translated: true,
    lang: 'es',
    disclaimer: DISCLAIMER_ES,
    translationSource: 'stored-es',
  };
  if (next.data && typeof next.data === 'object') {
    next.data = {
      ...next.data,
      cuerpo: es,
      cuerpoEn: storedEn || english,
      traducido: true,
      disclaimer: DISCLAIMER_ES,
    };
  }
  return next;
}

/**
 * Spanish body whenever English corpus exists. Stored first; otherwise
 * faithful PD translate in this request, persist by hash, return ES.
 */
export async function ensureCommentarySpanish(result) {
  const attached = attachStoredSpanish(result);
  if (!attached?.found) return attached;
  if (String(attached.textEs || '').trim()) return attached;

  const english = String(attached.textEn || attached.text || result?.text || '').trim();
  if (!english || /^No hay nota/i.test(english)) return attached;
  if (looksSpanish(english)) {
    persistSpanishBlob({
      book: bookFromPassage(attached.passage),
      authorId: attached.authorId,
      vKey: verseKeyFromPassage(attached.passage),
      english,
      es: english,
      source: attached.source,
    });
    return spanishPayload({ ...attached, translationSource: 'stored-es' }, english, english);
  }

  try {
    const digest = hashEnglish(english);
    const es = await translateFaithfulPd(english, digest);
    if (!String(es || '').trim()) return attached;
    if (english.length >= 500 && es.length < english.length * 0.4) return attached;
    const stored = persistSpanishBlob({
      book: bookFromPassage(attached.passage),
      authorId: attached.authorId,
      vKey: verseKeyFromPassage(attached.passage),
      english,
      es,
      source: attached.source,
    });
    if (!stored) return attached;
    return spanishPayload(
      { ...attached, translationSource: 'live-pd' },
      english,
      es,
    );
  } catch (err) {
    console.warn('[comentario-es] translate', attached.authorId, attached.passage, err?.message || err);
    return attached;
  }
}
