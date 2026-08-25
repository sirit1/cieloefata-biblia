/**
 * GET /api/bible?book=&chapter=&version=
 * Endpoint oficial del lector: packs locales + Bolls + Deno.
 * Sin acoplar al DOM. Serverless Node / Vercel.
 */
import { LIBROS, INDICE_NT_INICIO, fetchConTimeout, parsearReferencia } from '../lib/biblia.js';
import { cargarPack, versosDesdePack } from '../lib/versiones.js';
import { traducirLxxAlEspanol, anexarTextoEs } from '../lib/lxx-es.js';

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
  james: 'santiago',
  stg: 'santiago',
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
      label: 'Septuaginta (Rahlfs) · griego y español',
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
    return {
      bolls: 'TLA',
      packKey: 'tla',
      label: 'Traducción en Lenguaje Actual',
      note: null,
      requested: raw,
      fallbackBolls: 'RV1960',
      fallbackLabel: 'Reina-Valera 1960',
      fallbackPack: 'rv1960',
    };
  }
  if (upper.includes('DHH')) {
    return {
      bolls: 'DHH',
      packKey: 'dhh',
      label: 'Dios Habla Hoy',
      note: null,
      requested: raw,
      fallbackBolls: 'RV1960',
      fallbackLabel: 'Reina-Valera 1960',
      fallbackPack: 'rv1960',
    };
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
  try {
    const url = `https://bolls.life/get-chapter/${bolls}/${bookId}/${chapter}/`;
    const data = await fetchConTimeout(url, {}, 8000);
    return mapBollsVerses(data);
  } catch {
    return [];
  }
}

async function fetchDeno(enSlug, chapter) {
  try {
    const url = `https://bible-api.deno.dev/api/read/rv1909/${encodeURIComponent(enSlug)}/${chapter}`;
    const data = await fetchConTimeout(url, {}, 8000);
    return mapDenoVerses(data);
  } catch {
    return [];
  }
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
  const packKey = extra.packKey || 'rv1960';
  const versos = verses.map((v) => {
    const item = { n: v.verse, texto: v.text };
    const es = v.textoEs || v.textEs || '';
    if (es) item.textoEs = es;
    return item;
  });
  const bloque = versos.map((v) => `${v.n} ${v.texto}`).join(' ');
  return {
    success: true,
    book: bookMeta.name,
    chapter,
    version: label,
    note: extra.note || null,
    verses,
    data: {
      referencia: `${bookMeta.name} ${chapter}`,
      versiones: { [packKey]: bloque },
      versionesVersos: { [packKey]: versos },
      versionesLista: [{ key: packKey, etiqueta: label, licencia: 'remote' }],
      original: null,
    },
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST, OPTIONS');
    return res.status(405).json({ success: false, error: 'Método no permitido.' });
  }

  const q = { ...(req.query || {}), ...((req.body && typeof req.body === 'object') ? req.body : {}) };
  let book = typeof q.book === 'string' ? q.book.trim() : String(q.libro || '').trim();
  let chapter = Number.parseInt(q.chapter || q.capitulo, 10);
  const version = typeof q.version === 'string' ? q.version : 'RVR1960';
  const refRaw = String(q.referencia || q.passage || q.ref || '').trim();
  if (refRaw) {
    const parsed = parsearReferencia(refRaw);
    if (parsed) {
      book = parsed.libro;
      chapter = parsed.capitulo;
    }
  }

  if (!book || !Number.isInteger(chapter) || chapter < 1) {
    return res.status(400).json({
      success: false,
      error: 'Parámetros "book" y "chapter" (o referencia) requeridos.',
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
    let verses = [];
    let resolvedLabel = ver.label;
    let source = 'none';

    if (ver.bolls === 'LXX') {
      verses = await fetchBolls(ver.bolls, bookMeta.id, chapter);
      source = verses.length ? 'bolls' : 'none';
      if (!verses.length) {
        verses = fetchLocalPack(ver.packKey, bookMeta.name, chapter);
        if (verses.length) source = 'local-pack';
      }
    } else {
      verses = fetchLocalPack(ver.packKey, bookMeta.name, chapter);
      source = verses.length ? 'local-pack' : 'none';

      if (!verses.length) {
        verses = await fetchBolls(ver.bolls, bookMeta.id, chapter);
        source = 'bolls';
      }
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

    if (!verses.length && ver.bolls !== 'RV1960' && ver.bolls !== 'LXX') {
      verses = await fetchBolls('RV1960', bookMeta.id, chapter);
      if (verses.length) {
        resolvedLabel = 'Reina-Valera 1960';
        source = 'bolls-rv1960';
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
      const requestedUpper = String(ver.requested || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      const stubFallback =
        source === 'bolls-rv1960' ||
        source === 'bolls-rv1909' ||
        source === 'bolls-fallback' ||
        source === 'local-pack-fallback' ||
        source === 'local-pack-rv1960' ||
        source === 'deno';
      let visibleNote = ver.note || null;
      if (stubFallback && requestedUpper.includes('TLA')) {
        visibleNote = 'TLA no está disponible en el catálogo local (pack vacío). Mostrando Reina-Valera 1960.';
      } else if (
        stubFallback &&
        requestedUpper.includes('DHH') &&
        !String(resolvedLabel).toUpperCase().includes('DHH')
      ) {
        visibleNote = `DHH no está disponible en el catálogo local. Mostrando ${resolvedLabel}.`;
      }

      if (ver.packKey === 'septuaginta' && ver.bolls === 'LXX') {
        const paraTraducir = verses.map((v) => ({ n: v.verse, texto: v.text }));
        const mapaEs = await traducirLxxAlEspanol(bookMeta.name, chapter, paraTraducir);
        verses = anexarTextoEs(paraTraducir, mapaEs).map((v) => ({
          verse: v.n,
          text: v.texto,
          textoEs: v.textoEs || '',
        }));
        source = `${source}+lxx-es`;
      }
      return res.status(200).json(
        okPayload(bookMeta, chapter, resolvedLabel, verses, source, {
          requestedVersion: ver.requested,
          note: visibleNote,
          packKey: ver.packKey,
        })
      );
    }

    const denoVerses = await fetchDeno(bookMeta.en, chapter);
    if (denoVerses.length) {
      const requestedUpper = String(ver.requested || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      const denoNote = requestedUpper.includes('TLA')
        ? 'TLA no está disponible en el catálogo local (pack vacío). Mostrando Reina-Valera 1909.'
        : requestedUpper.includes('DHH')
          ? 'DHH no está disponible en el catálogo local. Mostrando Reina-Valera 1909.'
          : null;
      return res.status(200).json(
        okPayload(bookMeta, chapter, 'Reina-Valera 1909', denoVerses, 'deno', {
          requestedVersion: ver.requested,
          note: denoNote,
          packKey: 'rv1960',
        })
      );
    }

    throw new Error('No se pudo recuperar el texto bíblico de las fuentes canónicas.');
  } catch (err) {
    console.error('[api/bible]', err?.message || err);
    const safeBook = bookMeta?.name || book || '';
    const safeChapter = Number.isInteger(chapter) && chapter > 0 ? chapter : 1;
    return res.status(200).json({
      success: false,
      book: safeBook,
      chapter: safeChapter,
      version: ver?.label || 'Reina-Valera 1960',
      verses: [],
      source: 'error',
      error: err?.message || 'Fuente remota temporalmente no disponible',
    });
  }
}
