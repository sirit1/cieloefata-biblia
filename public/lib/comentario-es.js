/**
 * Stored Spanish layer for English PD commentary.
 * Never live-translates. Never impersonates the author.
 * Lookup: data/commentaries/es/{book-slug}/{authorId}.json
 *
 * PRODUCT LAW (Alejandro): if English corpus found:true for an author, stored
 * Spanish must exist for that blob (any book, any verse). Honest miss only when
 * the corpus has no covering note. Range covering (previous verse / pericope)
 * is for range-keyed authors only — never steal a neighbor's Spanish for a
 * different English blob. No `if (passage === …)` special cases.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

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

function layerPath(bookSlug, authorId) {
  const file = join('data', 'commentaries', 'es', bookSlug, `${authorId}.json`);
  const candidates = [
    join(ROOT, file),
    join(process.cwd(), file),
    join(ROOT, 'public', file),
    join(process.cwd(), 'public', file),
  ];
  return candidates.find((p) => existsSync(p)) || candidates[0];
}

export function loadAuthorLayer(bookSlug, authorId) {
  const slug = foldBook(bookSlug);
  const id = String(authorId || '').trim();
  if (!slug || !id) return null;
  const key = `${slug}:${id}`;
  if (fileCache.has(key)) return fileCache.get(key);
  const p = layerPath(slug, id);
  if (!existsSync(p)) {
    fileCache.set(key, null);
    return null;
  }
  try {
    const json = JSON.parse(readFileSync(p, 'utf8'));
    fileCache.set(key, json);
    return json;
  } catch {
    fileCache.set(key, null);
    return null;
  }
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

/**
 * Attach stored Spanish when the English blob matches.
 * If there is no stored row, leave English as `text` (no live translation).
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
