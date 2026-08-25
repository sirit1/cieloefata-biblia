#!/usr/bin/env node
/**
 * One-shot Spanish store for English PD commentary.
 * Does NOT live-translate at request time. Does NOT impersonate authors.
 *
 * Usage:
 *   node scripts/traducir-comentario-lucas.js
 *
 * Extend to another book:
 *   1. Keep the same JSON shape under data/commentaries/es/{slug}/
 *   2. Change BOOK / USFM below (or pass BOOK=Juan USFM=JHN)
 *   3. Re-run. Existing verses with matching enHash are skipped.
 */
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadProjectEnv } from '../lib/load-env.js';
import { obtenerComentarioCorpus } from '../lib/comentario-corpus.js';
import { generarTexto, hayMotorIA } from '../lib/ai.js';
import { DISCLAIMER_ES, hashEnglish } from '../lib/comentario-es.js';

loadProjectEnv();

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BOOK = process.env.BOOK || 'Lucas';
const USFM = process.env.USFM || 'LUK';
const CHAPTERS = Number(process.env.CHAPTERS || 24);
const AUTHORS = (process.env.AUTHORS || 'matthew-henry,charles-spurgeon,adam-clarke,john-wesley').split(',');
const PROMPT =
  'Traduce al español, de forma fiel, el texto inglés de dominio público que sigue. No resumas, no acortes, no omitas, no añadas, y no insertes citas bíblicas que no estén en la fuente. Conserva griego, hebreo y la estructura. Devuelve solo la traducción en español.\n\n';

function slug(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function layerFile(authorId) {
  return join(ROOT, 'data', 'commentaries', 'es', slug(BOOK), `${authorId}.json`);
}

function loadLayer(authorId) {
  const p = layerFile(authorId);
  if (!existsSync(p)) {
    return {
      book: BOOK,
      usfm: USFM,
      authorId,
      disclaimer: DISCLAIMER_ES,
      blobs: {},
      verses: {},
    };
  }
  return JSON.parse(readFileSync(p, 'utf8'));
}

async function translateOnce(english) {
  if (!hayMotorIA()) {
    throw new Error('No hay motor de IA configurado (AI_GATEWAY_API_KEY / VERCEL_OIDC_TOKEN). No se traduce en vivo.');
  }
  const es = await generarTexto(PROMPT + english, { maxOutputTokens: 8000 });
  if (!es || es.length < 20) throw new Error('Traducción vacía');
  return es.trim();
}

async function main() {
  const bookSlug = slug(BOOK);
  mkdirSync(join(ROOT, 'data', 'commentaries', 'es', bookSlug), { recursive: true });
  console.log(`[traducir] ${BOOK} authors=${AUTHORS.join(',')} ia=${hayMotorIA()}`);
  for (const authorId of AUTHORS) {
    const layer = loadLayer(authorId);
    layer.blobs = layer.blobs || {};
    layer.verses = layer.verses || {};
    const seen = new Map();
    for (const [id, blob] of Object.entries(layer.blobs)) {
      if (blob?.enHash) seen.set(blob.enHash, id);
    }
    for (let ch = 1; ch <= CHAPTERS; ch++) {
      for (let v = 1; v <= 80; v++) {
        const passage = `${BOOK} ${ch}:${v}`;
        const hit = await obtenerComentarioCorpus({ passage, author: authorId });
        if (!hit.found) {
          if (v === 1) break;
          continue;
        }
        const english = String(hit.textEn || (hit.translated ? '' : hit.text) || '').trim() || String(hit.text || '').trim();
        // When attachStoredSpanish already swapped text, prefer textEn.
        const en = String(hit.translated ? hit.textEn : english).trim();
        if (!en || /^No hay nota/i.test(en)) continue;
        const h = hashEnglish(en);
        const vKey = `${ch}:${v}`;
        if (layer.verses[vKey]) continue;
        let blobId = seen.get(h);
        if (!blobId) {
          const es = await translateOnce(en);
          blobId = `b${Object.keys(layer.blobs).length + 1}`;
          layer.blobs[blobId] = { en, es, enHash: h, source: hit.source };
          seen.set(h, blobId);
          console.log(`  ${authorId} ${vKey} new blob ${blobId} en=${en.length} es=${es.length}`);
        }
        layer.verses[vKey] = blobId;
      }
    }
    writeFileSync(layerFile(authorId), JSON.stringify(layer, null, 2) + '\n');
    console.log(`wrote ${layerFile(authorId)}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
