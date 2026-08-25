/**
 * Stored Spanish layer for English PD commentary.
 * Never live-translates. Never impersonates the author.
 * Lookup: data/commentaries/es/{book-slug}/{authorId}.json
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const DISCLAIMER_ES =
  'Traducción automática del original inglés (dominio público). No es la edición de CLIE.';

const fileCache = new Map();

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
  const row = resolveVerseRow(layer, vKey);
  const es = String(row?.es || '').trim();
  const storedEn = String(row?.en || '').trim();
  const ok =
    es &&
    (!storedEn || storedEn === english || row?.enHash === hashEnglish(english));
  if (!ok) {
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
