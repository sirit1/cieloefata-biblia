/**
 * Éfata RevelatiO — bible-api.js
 * Cliente: /api/bible si existe; si el origen es estático (Live Server 404 HTML)
 * cae a bolls.life en el navegador. TLA vacío → RV1960. Nunca pintar "HTTP Error: 404".
 */

export const VERSION_MAP = {
  DHH: { bolls: 'DHH', label: 'Dios Habla Hoy' },
  TLA: { bolls: 'RV1960', label: 'Traducción en Lenguaje Actual', fallback: true },
  RVR1960: { bolls: 'RV1960', label: 'Reina-Valera 1960' },
  RV1960: { bolls: 'RV1960', label: 'Reina-Valera 1960' },
  RVR1909: { bolls: 'RV1909', label: 'Reina-Valera 1909' },
  RV1909: { bolls: 'RV1909', label: 'Reina-Valera 1909' },
  NVI: { bolls: 'NVI', label: 'Nueva Versión Internacional' },
  KJV: { bolls: 'KJV', label: 'King James Version' },
  LXX: { bolls: 'LXX', label: 'Septuaginta (Griego)' },
  SEPTUAGINTA: { bolls: 'LXX', label: 'Septuaginta (Griego)' },
  TEXTUAL: { bolls: 'LXX', label: 'Septuaginta (Griego)' },
};

/** Canon protestante 1–66 (Bolls). Santiago = 59. */
const CANON_BOOKS = [
  'Génesis', 'Éxodo', 'Levítico', 'Números', 'Deuteronomio', 'Josué', 'Jueces', 'Rut',
  '1 Samuel', '2 Samuel', '1 Reyes', '2 Reyes', '1 Crónicas', '2 Crónicas', 'Esdras',
  'Nehemías', 'Ester', 'Job', 'Salmos', 'Proverbios', 'Eclesiastés', 'Cantares',
  'Isaías', 'Jeremías', 'Lamentaciones', 'Ezequiel', 'Daniel', 'Oseas', 'Joel', 'Amós',
  'Abdías', 'Jonás', 'Miqueas', 'Nahúm', 'Habacuc', 'Sofonías', 'Hageo', 'Zacarías', 'Malaquías',
  'Mateo', 'Marcos', 'Lucas', 'Juan', 'Hechos', 'Romanos', '1 Corintios', '2 Corintios',
  'Gálatas', 'Efesios', 'Filipenses', 'Colosenses', '1 Tesalonicenses', '2 Tesalonicenses',
  '1 Timoteo', '2 Timoteo', 'Tito', 'Filemón', 'Hebreos', 'Santiago', '1 Pedro', '2 Pedro',
  '1 Juan', '2 Juan', '3 Juan', 'Judas', 'Apocalipsis',
];

const BOOK_ALIASES = {
  james: 'santiago',
  santiago: 'santiago',
  stg: 'santiago',
  jacques: 'santiago',
};

function normalizeBookName(name) {
  return String(name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function packedName(name) {
  return normalizeBookName(name).replace(/[^a-z0-9]/g, '');
}

export function resolveBookId(book) {
  const norm = normalizeBookName(book);
  const packed = packedName(book);
  const aliased = BOOK_ALIASES[norm] || BOOK_ALIASES[packed] || packed;
  const idx = CANON_BOOKS.findIndex((n) => packedName(n) === aliased || normalizeBookName(n) === aliased);
  if (idx < 0) return null;
  return { id: idx + 1, name: CANON_BOOKS[idx] };
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
  if (key.includes('KJV')) return 'KJV';
  if (key.includes('LXX') || key.includes('SEPT') || key.includes('TEXTUAL')) return 'LXX';
  return 'RVR1960';
}

function stripHtml(s) {
  return String(s || '').replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim();
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

function labelForBolls(code) {
  if (code === 'RV1960') return 'Reina-Valera 1960';
  if (code === 'RV1909') return 'Reina-Valera 1909';
  if (code === 'NVI') return 'Nueva Versión Internacional';
  if (code === 'DHH') return 'Dios Habla Hoy';
  if (code === 'KJV') return 'King James Version';
  if (code === 'LXX') return 'Septuaginta (Griego)';
  return code;
}

/** TLA no existe en bolls ni en el pack local → RV1960. Luego NVI / RV1909. */
function bollsCodesFor(verKey) {
  const key = normalizeVersionKey(verKey);
  if (key === 'TLA') return ['RV1960', 'NVI', 'RV1909'];
  const primary = VERSION_MAP[key]?.bolls || 'RV1960';
  const codes = [primary];
  if (primary !== 'RV1960') codes.push('RV1960');
  if (primary !== 'NVI') codes.push('NVI');
  if (primary !== 'RV1909') codes.push('RV1909');
  return [...new Set(codes)];
}

function isJsonContentType(res) {
  return String(res.headers.get('content-type') || '').toLowerCase().includes('application/json');
}

function hasVerses(json) {
  return Boolean(json?.success && Array.isArray(json.verses) && json.verses.length);
}

function tlaNote(requestedKey, usedLabel) {
  if (normalizeVersionKey(requestedKey) !== 'TLA') return null;
  return `TLA no está disponible todavía. Mostrando ${usedLabel || 'Reina-Valera 1960'}.`;
}

async function fetchLocalBibleApi(book, chapter, verKey, signal = null) {
  const res = await fetch(
    `/api/bible?book=${encodeURIComponent(book)}&chapter=${chapter}&version=${encodeURIComponent(verKey)}`,
    signal ? { signal } : undefined
  );
  if (!res.ok || !isJsonContentType(res)) return null;
  const json = await res.json().catch(() => null);
  if (hasVerses(json)) {
    if (!json.note) {
      const note = tlaNote(verKey, json.version);
      if (note) json.note = note;
    }
    return json;
  }
  return null;
}

async function fetchBollsDirect(book, chapter, verKey, signal = null) {
  const meta = resolveBookId(book);
  if (!meta) return null;
  const codes = bollsCodesFor(verKey);
  for (const code of codes) {
    try {
      const url = `https://bolls.life/get-chapter/${code}/${meta.id}/${chapter}/`;
      const res = await fetch(url, signal ? { signal } : undefined);
      if (!res.ok) continue;
      const data = await res.json().catch(() => null);
      const verses = mapBollsVerses(data);
      if (!verses.length) continue;
      const version = labelForBolls(code);
      const note =
        tlaNote(verKey, version) ||
        (code !== (VERSION_MAP[normalizeVersionKey(verKey)]?.bolls || 'RV1960')
          ? `Mostrando ${version} (la versión pedida no devolvió texto).`
          : null);
      return {
        success: true,
        book: meta.name,
        chapter: Number(chapter) || 1,
        version,
        verses,
        note,
        source: 'bolls-browser',
      };
    } catch (err) {
      if (err?.name === 'AbortError') throw err;
    }
  }
  return null;
}

export async function getPassageData(book, chapter, version = 'RVR1960', signal = null) {
  const verKey = normalizeVersionKey(version);
  const tries = [verKey];
  if (verKey !== 'RVR1960') tries.push('RVR1960');
  if (!tries.includes('RVR1909')) tries.push('RVR1909');

  for (const key of tries) {
    try {
      const local = await fetchLocalBibleApi(book, chapter, key, signal);
      if (hasVerses(local)) {
        if (key !== verKey) {
          local.note = local.note || `Mostrando ${local.version} (fallback desde ${verKey})`;
        }
        return local;
      }
    } catch (err) {
      if (err?.name === 'AbortError') throw err;
    }

    try {
      const remote = await fetchBollsDirect(book, chapter, key, signal);
      if (hasVerses(remote)) {
        if (key !== verKey && !remote.note) {
          remote.note = `Mostrando ${remote.version} (fallback desde ${verKey})`;
        }
        return remote;
      }
    } catch (err) {
      if (err?.name === 'AbortError') throw err;
    }
  }

  return {
    success: false,
    error: 'No se pudo obtener el pasaje. Comprueba la conexión.',
    book,
    chapter: Number(chapter) || 1,
    version: verKey,
    verses: [],
  };
}

export default getPassageData;
