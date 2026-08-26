/**
 * Éfata RevelatiO — bible-api.js
 * Cliente: /api/bible + fallback directo a bolls.life get-chapter.
 * Nunca pinta "HTTP Error: 404". DHH/TLA/NVI vacíos no se sustituyen por RVR.
 */

export const VERSION_MAP = {
  DHH: { bolls: 'DHH', label: 'Dios Habla Hoy' },
  TLA: { bolls: 'TLA', label: 'Traducción en Lenguaje Actual' },
  RVR1960: { bolls: 'RV1960', label: 'Reina-Valera 1960' },
  RV1960: { bolls: 'RV1960', label: 'Reina-Valera 1960' },
  RVR1909: { bolls: 'RV1909', label: 'Reina-Valera 1909' },
  RV1909: { bolls: 'RV1909', label: 'Reina-Valera 1909' },
  NVI: { bolls: 'NVI', label: 'Nueva Versión Internacional' },
  LXX: { bolls: 'LXX', label: 'Septuaginta (Griego)' },
  SEPTUAGINTA: { bolls: 'LXX', label: 'Septuaginta (Griego)' },
  TEXTUAL: { bolls: 'LXX', label: 'Septuaginta (Griego)' },
};

/** Orden protestante 1–66 = numeración Bolls. Juan=43, Santiago=59. */
const BOLLS_BOOKS = [
  'Génesis', 'Éxodo', 'Levítico', 'Números', 'Deuteronomio', 'Josué', 'Jueces', 'Rut', '1 Samuel', '2 Samuel',
  '1 Reyes', '2 Reyes', '1 Crónicas', '2 Crónicas', 'Esdras', 'Nehemías', 'Ester', 'Job', 'Salmos', 'Proverbios',
  'Eclesiastés', 'Cantares', 'Isaías', 'Jeremías', 'Lamentaciones', 'Ezequiel', 'Daniel', 'Oseas', 'Joel', 'Amós',
  'Abdías', 'Jonás', 'Miqueas', 'Nahúm', 'Habacuc', 'Sofonías', 'Hageo', 'Zacarías', 'Malaquías',
  'Mateo', 'Marcos', 'Lucas', 'Juan', 'Hechos', 'Romanos', '1 Corintios', '2 Corintios', 'Gálatas', 'Efesios',
  'Filipenses', 'Colosenses', '1 Tesalonicenses', '2 Tesalonicenses', '1 Timoteo', '2 Timoteo', 'Tito', 'Filemón',
  'Hebreos', 'Santiago', '1 Pedro', '2 Pedro', '1 Juan', '2 Juan', '3 Juan', 'Judas', 'Apocalipsis',
];

function foldName(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

export function bollsBookId(book) {
  const want = foldName(book);
  const idx = BOLLS_BOOKS.findIndex((name) => foldName(name) === want);
  return idx >= 0 ? idx + 1 : 0;
}

/** Normaliza selectores UI (rv1960, dhh, …) → clave canónica para `/api/bible`. */
export function normalizeVersionKey(raw) {
  const key = String(raw || 'RVR1960')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]/g, '');
  if (VERSION_MAP[key]) return key;
  if (key.includes('1909')) return 'RVR1909';
  if (key.includes('1960') || key === 'RVR' || key === 'RV') return 'RVR1960';
  if (key.includes('DHH')) return 'DHH';
  if (key.includes('TLA')) return 'TLA';
  if (key.includes('NVI')) return 'NVI';
  if (key.includes('KJV')) return 'RVR1960';
  if (key.includes('LXX') || key.includes('SEPT') || key.includes('TEXTUAL')) return 'LXX';
  return 'RVR1960';
}

function mapBollsVerses(data) {
  if (!Array.isArray(data) || !data.length) return [];
  return data
    .map((v) => ({
      verse: Number(v.verse || v.n || v.number || 0),
      text: String(v.text || v.texto || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(),
    }))
    .filter((v) => v.verse > 0 && v.text);
}

async function fetchBollsChapter(book, chapter, verKey, signal = null) {
  const bookId = bollsBookId(book);
  if (!bookId) return null;
  const meta = VERSION_MAP[verKey] || VERSION_MAP.RVR1960;
  const url = `https://bolls.life/get-chapter/${meta.bolls}/${bookId}/${chapter}/`;
  try {
    const res = await fetch(url, signal ? { signal } : undefined);
    if (!res.ok) return null;
    const json = await res.json().catch(() => null);
    const verses = mapBollsVerses(json);
    if (!verses.length) return null;
    return {
      success: true,
      book,
      chapter: Number(chapter) || 1,
      version: meta.label,
      verses,
      source: 'bolls-client',
    };
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
    return null;
  }
}

async function fetchPassageOnce(book, chapter, verKey, signal = null) {
  const res = await fetch(
    `/api/bible?book=${encodeURIComponent(book)}&chapter=${chapter}&version=${encodeURIComponent(verKey)}`,
    signal ? { signal } : undefined
  );
  const ctype = (res.headers.get('content-type') || '').toLowerCase();
  const json = ctype.includes('application/json') ? await res.json().catch(() => null) : null;
  if (res.ok && json && typeof json === 'object') {
    if (json.success && Array.isArray(json.verses) && json.verses.length) return json;
    if (json.success === false) return json;
  }
  return null;
}

function versionLabelOf(verKey) {
  return (VERSION_MAP[verKey] || VERSION_MAP.RVR1960).label;
}

export async function getPassageData(book, chapter, version = 'RVR1960', signal = null) {
  const verKey = normalizeVersionKey(version);
  const label = versionLabelOf(verKey);
  const rvrFamily = verKey === 'RVR1960' || verKey === 'RV1960' || verKey === 'RVR1909' || verKey === 'RV1909';

  try {
    const data = await fetchPassageOnce(book, chapter, verKey, signal);
    if (data?.verses?.length) return data;
    if (data && data.success === false) {
      return {
        ...data,
        book: data.book || book,
        chapter: Number(data.chapter) || Number(chapter) || 1,
        version: data.version || label,
        verses: Array.isArray(data.verses) ? data.verses : [],
        note: data.note || data.error || `Pack local y Bolls vacíos para ${label}. No se sustituye por Reina-Valera.`,
      };
    }
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
    console.warn(`[BibleAPI] ${book} ${chapter} @ ${verKey}:`, err?.message || err);
  }

  try {
    const remote = await fetchBollsChapter(book, chapter, verKey, signal);
    if (remote?.verses?.length) return remote;
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
  }

  if (rvrFamily && verKey !== 'RVR1909') {
    try {
      const remote1909 = await fetchBollsChapter(book, chapter, 'RVR1909', signal);
      if (remote1909?.verses?.length) return remote1909;
    } catch (err) {
      if (err?.name === 'AbortError') throw err;
    }
  }

  return {
    success: false,
    error: `Pack local y Bolls vacíos para ${label}. No se sustituye por Reina-Valera.`,
    note: `Pack local y Bolls vacíos para ${label}. No se sustituye por Reina-Valera.`,
    book,
    chapter: Number(chapter) || 1,
    version: label,
    verses: [],
  };
}

export default getPassageData;
