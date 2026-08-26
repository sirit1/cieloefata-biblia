#!/usr/bin/env node
/**
 * One-shot Spanish store for English PD commentary (NT).
 * Does NOT live-translate at request time. Does NOT impersonate authors.
 * Faithful translation of the stored English blob only.
 *
 * PRODUCT LAW (Alejandro): whole NT for every menu author when English exists
 * (calvin, luther, gill, jfb, henry, spurgeon, clarke, wesley, augustine).
 * Skip blobs whose enHash already has Spanish. No one-book-only default.
 *
 * Usage:
 *   node scripts/traducir-comentario-lucas.js
 *   BOOKS=Mateo,Juan,Lucas,Filemón AUTHORS=matthew-henry,adam-clarke node scripts/traducir-comentario-lucas.js
 *   PRIORITY_ONLY=1 node scripts/traducir-comentario-lucas.js
 *
 * Existing verses with matching enHash are skipped.
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync, cpSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadProjectEnv } from '../lib/load-env.js';
import { obtenerComentarioCorpus } from '../lib/comentario-corpus.js';
import { generarTexto, hayMotorIA } from '../lib/ai.js';
import { DISCLAIMER_ES, hashEnglish, clearCommentaryEsCache } from '../lib/comentario-es.js';

loadProjectEnv();

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PROMPT =
  'Traduce al español, de forma fiel, el texto inglés de dominio público que sigue. No resumas, no acortes, no omitas, no añadas, y no insertes citas bíblicas que no estén en la fuente. Conserva griego, hebreo y la estructura. Devuelve solo la traducción en español.\n\n';

const NT_BOOKS = [
  { book: 'Mateo', usfm: 'MAT', verses: [25, 23, 17, 25, 48, 34, 29, 34, 38, 42, 30, 50, 58, 36, 39, 28, 27, 35, 30, 34, 46, 46, 39, 51, 46, 75, 66, 20] },
  { book: 'Marcos', usfm: 'MRK', verses: [45, 28, 35, 41, 43, 56, 37, 38, 48, 52, 54, 44, 37, 72, 47, 20] },
  { book: 'Lucas', usfm: 'LUK', verses: [80, 52, 38, 44, 39, 49, 29, 43, 43, 34, 35, 30, 29, 35, 30, 41, 22, 30, 42, 38, 48, 39, 29, 27] },
  { book: 'Juan', usfm: 'JHN', verses: [51, 25, 36, 24, 45, 23, 24, 21, 37, 24, 42, 30, 25, 29, 23, 26, 21, 23, 42, 31, 25] },
  { book: 'Hechos', usfm: 'ACT', verses: [26, 47, 26, 37, 25, 23, 32, 25, 37, 38, 28, 40, 29, 40, 30, 19, 32, 31, 25, 26, 20, 28, 36, 8, 23, 22, 20, 32] },
  { book: 'Romanos', usfm: 'ROM', verses: [32, 29, 31, 25, 21, 23, 25, 39, 33, 21, 36, 21, 14, 23, 33, 27] },
  { book: '1 Corintios', usfm: '1CO', verses: [31, 16, 23, 21, 13, 20, 40, 13, 27, 33, 34, 31, 13, 40, 58, 24] },
  { book: '2 Corintios', usfm: '2CO', verses: [24, 17, 18, 22, 21, 11, 22, 16, 15, 13, 25, 13, 18] },
  { book: 'Gálatas', usfm: 'GAL', verses: [24, 21, 29, 31, 24, 23] },
  { book: 'Efesios', usfm: 'EPH', verses: [23, 22, 21, 32, 33, 24] },
  { book: 'Filipenses', usfm: 'PHP', verses: [30, 30, 21, 23] },
  { book: 'Colosenses', usfm: 'COL', verses: [29, 23, 18, 18] },
  { book: '1 Tesalonicenses', usfm: '1TH', verses: [10, 20, 13, 18, 28] },
  { book: '2 Tesalonicenses', usfm: '2TH', verses: [12, 17, 18] },
  { book: '1 Timoteo', usfm: '1TI', verses: [20, 15, 16, 16, 25, 21] },
  { book: '2 Timoteo', usfm: '2TI', verses: [18, 26, 17, 22] },
  { book: 'Tito', usfm: 'TIT', verses: [16, 15, 15] },
  { book: 'Filemón', usfm: 'PHM', verses: [25] },
  { book: 'Hebreos', usfm: 'HEB', verses: [14, 18, 13, 25, 17, 18, 16, 13, 13, 13, 40, 29, 25] },
  { book: 'Santiago', usfm: 'JAS', verses: [27, 26, 18, 17, 20] },
  { book: '1 Pedro', usfm: '1PE', verses: [25, 25, 22, 19, 14] },
  { book: '2 Pedro', usfm: '2PE', verses: [21, 22, 18] },
  { book: '1 Juan', usfm: '1JN', verses: [10, 29, 24, 21, 21] },
  { book: '2 Juan', usfm: '2JN', verses: [13] },
  { book: '3 Juan', usfm: '3JN', verses: [14] },
  { book: 'Judas', usfm: 'JUD', verses: [25] },
  { book: 'Apocalipsis', usfm: 'REV', verses: [20, 29, 22, 18, 23, 17, 17, 13, 21, 11, 15, 17, 18, 17, 18, 14, 22, 19, 15, 22, 27, 21] },
];

const FULL_NT_AUTHORS = ['matthew-henry', 'charles-spurgeon', 'adam-clarke', 'john-wesley'];
const PRIORITY_AUTHORS = [
  'john-calvin',
  'jamieson-fausset-brown',
  'john-gill',
  'martin-luther',
  'agustin-de-hipona',
];
/** Used only when PRIORITY_ONLY=1. Default harvest is the whole NT. */
const PRIORITY_BOOKS = new Set(['Mateo', 'Juan', 'Lucas', 'Filemón']);

const AUTHOR_FILTER = (process.env.AUTHORS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const BOOK_FILTER = (process.env.BOOKS || process.env.BOOK || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const PRIORITY_ONLY = process.env.PRIORITY_ONLY === '1';
const HARVEST_ONLY = process.env.HARVEST_ONLY === '1';

function slug(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function foldName(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function selectedBooks() {
  if (!BOOK_FILTER.length) {
    return PRIORITY_ONLY ? NT_BOOKS.filter((b) => PRIORITY_BOOKS.has(b.book)) : NT_BOOKS;
  }
  const wanted = new Set(BOOK_FILTER.map(foldName));
  return NT_BOOKS.filter((b) => wanted.has(foldName(b.book)) || wanted.has(foldName(b.usfm)));
}

function authorsForBook(_bookName) {
  if (AUTHOR_FILTER.length) return AUTHOR_FILTER;
  return [...FULL_NT_AUTHORS, ...PRIORITY_AUTHORS];
}

function layerFile(bookName, authorId) {
  return join(ROOT, 'data', 'commentaries', 'es', slug(bookName), `${authorId}.json`);
}

function loadLayer(bookName, usfm, authorId) {
  const p = layerFile(bookName, authorId);
  if (!existsSync(p)) {
    return {
      book: bookName,
      usfm,
      authorId,
      disclaimer: DISCLAIMER_ES,
      blobs: {},
      verses: {},
    };
  }
  return JSON.parse(readFileSync(p, 'utf8'));
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function mapPool(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  const n = Math.max(1, limit);
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (i < items.length) {
        const idx = i++;
        out[idx] = await fn(items[idx], idx);
      }
    }),
  );
  return out;
}

function looksSpanish(s) {
  const sample = String(s || '').slice(0, 700);
  if (/[áéíóúñü¿¡]/i.test(sample)) return true;
  const esHits = (sample.match(/\b(que|los|las|del|una|por|como|para|este|esta|sus)\b/gi) || []).length;
  const enHits = (sample.match(/\b(the|and|that|which|this|from|with|have|been)\b/gi) || []).length;
  return esHits >= 5 && esHits > enHits;
}

function looksEnglish(s) {
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
    if ((buf + '\n\n' + para).length > max && buf) {
      push();
    }
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
  if ((res.status === 429 || res.status >= 500) && attempt < 7) {
    await sleep(800 * 2 ** attempt);
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
  if (!hayMotorIA()) throw new Error('no gateway');
  const es = await generarTexto(PROMPT + text, { maxOutputTokens: 8000 });
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
    await sleep(60);
  }
  const joined = out.join('\n\n').trim();
  if (looksEnglish(joined) && !looksSpanish(joined)) {
    throw new Error('la salida sigue en inglés');
  }
  return joined;
}

function englishFromHit(hit) {
  if (!hit?.found) return '';
  const en = String(hit.textEn || (!hit.translated ? hit.text : '') || '').trim();
  if (!en || /^No hay nota/i.test(en)) return '';
  if (looksSpanish(en) && !looksEnglish(en)) return '';
  return en;
}

async function harvestBookAuthor(meta, authorId) {
  const layer = loadLayer(meta.book, meta.usfm, authorId);
  layer.blobs = layer.blobs || {};
  layer.verses = layer.verses || {};
  const byHash = new Map();
  for (const [id, blob] of Object.entries(layer.blobs)) {
    if (blob?.enHash) byHash.set(blob.enHash, id);
  }
  const unique = new Map();
  let hits = 0;
  let misses = 0;
  for (let ch = 1; ch <= meta.verses.length; ch++) {
    const maxV = meta.verses[ch - 1];
    await obtenerComentarioCorpus({ passage: `${meta.book} ${ch}:1`, author: authorId });
    const verses = Array.from({ length: maxV }, (_, i) => i + 1);
    const conc =
      authorId === 'john-wesley' || authorId === 'charles-spurgeon' || authorId === 'adam-clarke'
        ? 5
        : 10;
    const rows = await mapPool(verses, conc, async (v) => {
      const hit = await obtenerComentarioCorpus({
        passage: `${meta.book} ${ch}:${v}`,
        author: authorId,
      });
      return { v, hit };
    });
    for (const { v, hit } of rows) {
      const en = englishFromHit(hit);
      if (!en) {
        misses += 1;
        continue;
      }
      hits += 1;
      const h = hashEnglish(en);
      const vKey = `${ch}:${v}`;
      if (!unique.has(h)) {
        unique.set(h, { en, source: hit.source, verses: [] });
      }
      unique.get(h).verses.push(vKey);
    }
    process.stdout.write(`  ${authorId} ${meta.book} ${ch}/${meta.verses.length} hits=${hits} unique=${unique.size}\r`);
  }
  process.stdout.write('\n');
  return { layer, byHash, unique, hits, misses };
}

function nextBlobId(blobs) {
  let n = Object.keys(blobs).length + 1;
  while (blobs[`b${n}`]) n += 1;
  return `b${n}`;
}

function persistLayer(bookName, layer) {
  const dir = join(ROOT, 'data', 'commentaries', 'es', slug(bookName));
  mkdirSync(dir, { recursive: true });
  const p = layerFile(bookName, layer.authorId);
  writeFileSync(p, JSON.stringify(layer, null, 2) + '\n');
  const pubDir = join(ROOT, 'public', 'data', 'commentaries', 'es', slug(bookName));
  mkdirSync(pubDir, { recursive: true });
  cpSync(p, join(pubDir, `${layer.authorId}.json`));
  clearCommentaryEsCache();
  return p;
}

function coverageRow(book, authorId, unique, layer) {
  const translated = Object.values(layer.blobs).filter((b) => String(b?.es || '').trim()).length;
  const verses = Object.keys(layer.verses).length;
  return {
    book,
    authorId,
    uniqueEnglish: unique.size,
    blobs: Object.keys(layer.blobs).length,
    translatedBlobs: translated,
    versesMapped: verses,
  };
}

async function fillSpanish(layer, byHash, unique, authorId, bookName) {
  let translatedNew = 0;
  let skipped = 0;
  let failed = 0;
  const hashes = [...unique.keys()];
  for (const h of hashes) {
    const item = unique.get(h);
    let blobId = byHash.get(h);
    if (blobId && String(layer.blobs[blobId]?.es || '').trim()) {
      for (const vKey of item.verses) layer.verses[vKey] = blobId;
      skipped += 1;
      continue;
    }
    if (HARVEST_ONLY) {
      blobId = blobId || nextBlobId(layer.blobs);
      layer.blobs[blobId] = {
        en: item.en,
        es: layer.blobs[blobId]?.es || '',
        enHash: h,
        source: item.source,
      };
      byHash.set(h, blobId);
      for (const vKey of item.verses) layer.verses[vKey] = blobId;
      continue;
    }
    try {
      const es = await translateOnce(item.en);
      blobId = blobId || nextBlobId(layer.blobs);
      layer.blobs[blobId] = { en: item.en, es, enHash: h, source: item.source };
      byHash.set(h, blobId);
      for (const vKey of item.verses) layer.verses[vKey] = blobId;
      translatedNew += 1;
      console.log(
        `    ${authorId} ${bookName} blob ${blobId} en=${item.en.length} es=${es.length} verses=${item.verses.length}`,
      );
      if (translatedNew % 8 === 0) persistLayer(bookName, layer);
    } catch (err) {
      failed += 1;
      console.warn(`    FAIL ${authorId} ${bookName} hash=${h.slice(0, 8)} ${err.message}`);
    }
  }
  persistLayer(bookName, layer);
  return { translatedNew, skipped, failed };
}

async function main() {
  const books = selectedBooks();
  console.log(
    `[traducir] books=${books.map((b) => b.book).join(',')} ia=${hayMotorIA()} priorityOnly=${PRIORITY_ONLY}`,
  );
  const coverage = [];
  const authorOrder = AUTHOR_FILTER.length
    ? AUTHOR_FILTER
    : [...FULL_NT_AUTHORS, ...PRIORITY_AUTHORS];

  const jobs = [];
  for (const authorId of authorOrder) {
    for (const meta of books) {
      if (!authorsForBook(meta.book).includes(authorId)) continue;
      jobs.push({ meta, authorId });
    }
  }

  for (const { meta, authorId } of jobs) {
    console.log(`[traducir] harvest ${authorId} ${meta.book}`);
    const { layer, byHash, unique, hits, misses } = await harvestBookAuthor(meta, authorId);
    console.log(`  hits=${hits} misses=${misses} unique=${unique.size}`);
    const stats = await fillSpanish(layer, byHash, unique, authorId, meta.book);
    coverage.push({ ...coverageRow(meta.book, authorId, unique, layer), ...stats, hits, misses });
  }

  const reportPath = join(ROOT, 'data', 'commentaries', 'es', 'COVERAGE.json');
  let prev = { coverage: [] };
  try {
    if (existsSync(reportPath)) prev = JSON.parse(readFileSync(reportPath, 'utf8'));
  } catch {
    prev = { coverage: [] };
  }
  const byKey = new Map();
  for (const row of prev.coverage || []) {
    if (row?.book && row?.authorId) byKey.set(`${row.book}:${row.authorId}`, row);
  }
  for (const row of coverage) {
    byKey.set(`${row.book}:${row.authorId}`, row);
  }
  const report = {
    generatedAt: new Date().toISOString(),
    disclaimer: DISCLAIMER_ES,
    coverage: [...byKey.values()].sort((a, b) =>
      String(a.book).localeCompare(String(b.book), 'es') || String(a.authorId).localeCompare(String(b.authorId)),
    ),
  };
  writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
  const pub = join(ROOT, 'public', 'data', 'commentaries', 'es');
  mkdirSync(pub, { recursive: true });
  cpSync(reportPath, join(pub, 'COVERAGE.json'));
  console.log(`wrote ${reportPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
