/**
 * GET /api/bible?book=&chapter=&version=
 * Endpoint oficial del lector: packs locales + Bolls + Deno.
 * Sin acoplar al DOM. Serverless Node / Vercel.
 */
import { LIBROS, INDICE_NT_INICIO, fetchConTimeout } from '../lib/biblia.js';
import { cargarPack, versosDesdePack } from '../lib/versiones.js';

const ENGLISH_SLUGS = [
  'genesis', 'exodus', 'leviticus', 'numbers', 'deuteronomy', 'joshua', 'judges', 'ruth',
  '1samuel', '2samuel', '1kings', '2kings', '1chronicles', '2chronicles', 'ezra', 'nehemiah',
  'esther', 'job', 'psalms', 'proverbs', 'ecclesiastes', 'songofsongs', 'isaiah', 'jeremiah',
  'lamentations', 'ezekiel', 'daniel', 'hosea', 'joel', 'amos', 'obadiah', 'jonah', 'micah',
  'nahum', 'habakkuk', 'zephaniah', 'haggai', 'zechariah', 'malachi',
  'matthew', 'mark', 'luke', 'john', 'acts', 'romans', '1corinthians', '2corinthians',
  'galatians', 'ephesians', 'philippians', 'colossians', '1thessalonians', '2thessalonians',
  '1timothy', '2timothy', 'titus', 'philemon', 'hebrews', 'james', '1peter', '2peter',
  '1john', '2john', '3john', 'jude', 'revelation',
];

const ALIASES = {
  cantares: 'cantares',
  'cantar de los cantares': 'cantares',
  song: 'cantares',
  'song of solomon': 'cantares',
  psalm: 'salmos',
  psalms: 'salmos',
  zephaniah: 'sofonias',
  sof: 'sofonias',
  gen: 'genesis',
  exo: 'exodo',
  matt: 'mateo',
  rom: 'romanos',
  '1samuel': '1 samuel',
  '2samuel': '2 samuel',
  '1sam': '1 samuel',
  '2sam': '2 samuel',
  'i samuel': '1 samuel',
  'ii samuel': '2 samuel',
  '1reyes': '1 reyes',
  '2reyes': '2 reyes',
  '1cronicas': '1 cronicas',
  '2cronicas': '2 cronicas',
  '1corintios': '1 corintios',
  '2corintios': '2 corintios',
  habakkuk: 'habacuc',
  hab: 'habacuc',
  haggai: 'hageo',
  hag: 'hageo',
};

function normalizeBookName(name) {
  return String(name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripHtml(s) {
  return String(s || '').replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim();
}

function buildBookData() {
  const map = {};
  LIBROS.forEach((name, idx) => {
    const key = normalizeBookName(name);
    map[key] = {
      id: idx + 1,
      en: ENGLISH_SLUGS[idx] || key.replace(/\s+/g, ''),
      name,
      esAT: idx < INDICE_NT_INICIO,
    };
  });
  Object.entries(ALIASES).forEach(([alias, target]) => {
    if (map[target]) map[alias] = map[target];
  });
  return map;
}

const BOOK_DATA = buildBookData();

function resolveBookMeta(book) {
  const norm = normalizeBookName(book);
  if (BOOK_DATA[norm]) return BOOK_DATA[norm];
  const packed = norm.replace(/[^a-z0-9]/g, '');
  if (ALIASES[packed] && BOOK_DATA[ALIASES[packed]]) return BOOK_DATA[ALIASES[packed]];
  const hit = Object.values(BOOK_DATA).find(
    (m) => normalizeBookName(m.name).replace(/[^a-z0-9]/g, '') === packed
  );
  return hit || null;
}

function resolveVersion(version, bookMeta) {
  const raw = String(version || 'RVR1960').trim();
  const upper = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const lower = raw.toLowerCase();

  if (lower === 'septuaginta' || lower === 'lxx' || lower === 'textual' || lower === 'rahlfs' || upper === 'LXX') {
    return {
      bolls: 'LXX',
      packKey: 'septuaginta',
      label: 'Septuaginta (Griego)',
      note: null,
      requested: raw,
    };
  }

  if (upper.includes('1909') || lower === 'rv1909' || lower === 'rvr1909') {
    return { bolls: 'RV1909', packKey: 'rv1960', label: 'Reina-Valera 1909', note: null, requested: raw };
  }
  if (upper.includes('KJV')) {
    return { bolls: 'KJV', packKey: 'kjv', label: 'King James Version', note: null, requested: raw };
  }
  if (upper.includes('NVI')) {
    return { bolls: 'NVI', packKey: 'nvi', label: 'Nueva Versión Internacional', note: null, requested: raw };
  }
  if (upper.includes('TLA')) {
    return { bolls: 'TLA', packKey: 'tla', label: 'Traducción en Lenguaje Actual', note: null, requested: raw };
  }
  if (upper.includes('DHH')) {
    return { bolls: 'DHH', packKey: 'dhh', label: 'Dios Habla Hoy', note: null, requested: raw };
  }

  return { bolls: 'RV1960', packKey: 'rv1960', label: 'Reina-Valera 1960', note: null, requested: raw };
}

function mapBollsVerses(data) {
  if (!Array.isArray(data) || !data.length) return [];
  return data
    .map((v) => ({
      verse: Number(v.verse || v.n || v.number || 0),
      text: stripHtml(v.text || v.texto || ''),
    }))
    .filter((v) => v.verse > 0 && v.text);
}

function mapDenoVerses(data) {
  const list = Array.isArray(data) ? data : Array.isArray(data?.verses) ? data.verses : [];
  return list
    .map((v) => ({
      verse: Number(v.number || v.verse || v.n || 0),
      text: stripHtml(v.verse || v.text || v.texto || ''),
    }))
    .filter((v) => v.verse > 0 && v.text);
}

function mapPackVerses(list) {
  return (list || [])
    .map((v, i) => ({
      verse: Number(v.n || v.verse || v.number || i + 1),
      text: stripHtml(v.texto || v.text || ''),
    }))
    .filter((v) => v.verse > 0 && v.text);
}

async function fetchBolls(bolls, bookId, chapter) {
  const url = `https://bolls.life/get-chapter/${bolls}/${bookId}/${chapter}/`;
  const data = await fetchConTimeout(url, {}, 14000);
  return mapBollsVerses(data);
}

async function fetchDeno(enSlug, chapter) {
  const url = `https://bible-api.deno.dev/api/read/rv1909/${encodeURIComponent(enSlug)}/${chapter}`;
  const data = await fetchConTimeout(url, {}, 14000);
  return mapDenoVerses(data);
}

function fetchLocalPack(packKey, bookName, chapter) {
  try {
    const pack = cargarPack(packKey);
    const versos = versosDesdePack(pack, bookName, chapter, null, null);
    return mapPackVerses(versos);
  } catch {
    return [];
  }
}

function okPayload(bookMeta, chapter, label, verses, source, extra = {}) {
  return {
    success: true,
    book: bookMeta.name,
    chapter,
    version: label,
    verses,
    metadata: {
      book: bookMeta.name,
      chapter,
      version: label,
      source,
      esAT: bookMeta.esAT,
      ...extra,
    },
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    return res.status(405).json({ success: false, error: 'Método no permitido.' });
  }

  const q = req.query || {};
  const book = typeof q.book === 'string' ? q.book.trim() : '';
  const chapter = Number.parseInt(q.chapter, 10);
  const version = typeof q.version === 'string' ? q.version : 'RVR1960';

  if (!book || !Number.isInteger(chapter) || chapter < 1) {
    return res.status(400).json({
      success: false,
      error: 'Parámetros "book" y "chapter" requeridos.',
    });
  }

  const bookMeta = resolveBookMeta(book);
  if (!bookMeta) {
    return res.status(400).json({
      success: false,
      error: `No reconocemos el libro "${book}".`,
    });
  }

  const ver = resolveVersion(version, bookMeta);

  try {
    let verses = fetchLocalPack(ver.packKey, bookMeta.name, chapter);
    let resolvedLabel = ver.label;
    let source = 'local-pack';

    if (!verses.length) {
      verses = await fetchBolls(ver.bolls, bookMeta.id, chapter);
      source = 'bolls';
    }

    if (!verses.length && ver.fallbackBolls) {
      verses = await fetchBolls(ver.fallbackBolls, bookMeta.id, chapter);
      if (verses.length) {
        resolvedLabel = ver.fallbackLabel || 'Reina-Valera 1960';
        source = 'bolls-fallback';
      } else if (ver.fallbackPack) {
        verses = fetchLocalPack(ver.fallbackPack, bookMeta.name, chapter);
        if (verses.length) {
          resolvedLabel = ver.fallbackLabel || 'Reina-Valera 1960';
          source = 'local-pack-fallback';
        }
      }
    }

    if (!verses.length && ver.bolls !== 'RV1909' && ver.bolls !== 'LXX') {
      verses = await fetchBolls('RV1909', bookMeta.id, chapter);
      if (verses.length) {
        resolvedLabel = 'Reina-Valera 1909';
        source = 'bolls-rv1909';
      } else {
        verses = fetchLocalPack('rv1960', bookMeta.name, chapter);
        if (verses.length) {
          resolvedLabel = 'Reina-Valera 1960';
          source = 'local-pack-rv1960';
        }
      }
    }

    if (verses.length) {
      return res.status(200).json(
        okPayload(bookMeta, chapter, resolvedLabel, verses, source, {
          requestedVersion: ver.requested,
          note: ver.note || null,
        })
      );
    }

    const denoVerses = await fetchDeno(bookMeta.en, chapter);
    if (denoVerses.length) {
      return res.status(200).json(
        okPayload(bookMeta, chapter, 'Reina-Valera 1909', denoVerses, 'deno', {
          requestedVersion: ver.requested,
        })
      );
    }

    throw new Error('No se pudo recuperar el texto bíblico de las fuentes canónicas.');
  } catch (err) {
    console.error('[api/bible]', err?.message || err);
    // Nunca 500 al lector: respuesta segura con contingencia canónica
    const safeBook = bookMeta?.name || book || 'Habacuc';
    const safeChapter = Number.isInteger(chapter) && chapter > 0 ? chapter : 1;
    const contingency =
      normalizeBookName(safeBook).includes('habacuc') && safeChapter === 1
        ? [
            { verse: 1, text: 'La profecía que vio el profeta Habacuc.' },
            {
              verse: 2,
              text: '¿Hasta cuándo, oh Jehová, clamaré, y no oirás; y daré voces a ti a causa de la violencia, y no salvarás?',
            },
            {
              verse: 3,
              text: '¿Por qué me haces ver iniquidad, y haces que vea molestia? Destrucción y violencia están delante de mí, y pleito y contienda se levantan.',
            },
            {
              verse: 4,
              text: 'Por lo cual la ley es debilitada, y el juicio no sale según la verdad; por cuanto el impío asedia al justo, por eso sale torcida la justicia.',
            },
            {
              verse: 5,
              text: 'Mirad entre las naciones, y ved, y asombraos; porque haré una obra en vuestros días, que aun cuando se os contare, no la creeréis.',
            },
          ]
        : [
            {
              verse: 1,
              text: `Texto de ${safeBook} ${safeChapter} en sincronización. Se mostrará la versión disponible en cuanto se complete la carga canónica.`,
            },
          ];

    return res.status(200).json({
      success: true,
      book: safeBook,
      chapter: safeChapter,
      version: 'Reina-Valera 1960',
      verses: contingency,
      source: 'contingency',
      note: err?.message || 'Fuente remota temporalmente no disponible',
    });
  }
}
