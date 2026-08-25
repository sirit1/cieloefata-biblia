/**
 * Éfata RevelatiO — bible-api.js
 * Cliente limpio: un solo endpoint `/api/bible` + claves de versión nativas.
 * Reintenta RVR1960 si la versión pedida falla; nunca propaga HTTP 500 crudo.
 */

export const VERSION_MAP = {
  DHH: { bolls: 'DHH', label: 'Dios Habla Hoy' },
  TLA: { bolls: 'TLA', label: 'Traducción en Lenguaje Actual' },
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

async function fetchPassageOnce(book, chapter, verKey, signal = null) {
  const res = await fetch(
    `/api/bible?book=${encodeURIComponent(book)}&chapter=${chapter}&version=${encodeURIComponent(verKey)}`,
    signal ? { signal } : undefined
  );
  const json = await res.json().catch(() => null);
  if (json?.success && Array.isArray(json.verses) && json.verses.length) {
    return json;
  }
  if (!res.ok) {
    throw new Error(json?.error || `HTTP Error: ${res.status}`);
  }
  throw new Error(json?.error || 'Respuesta vacía del endpoint bíblico');
}

export async function getPassageData(book, chapter, version = 'RVR1960', signal = null) {
  const verKey = normalizeVersionKey(version);
  const tries = [verKey];
  if (verKey !== 'RVR1960') tries.push('RVR1960');
  if (!tries.includes('RVR1909')) tries.push('RVR1909');

  let lastErr = null;
  for (const key of tries) {
    try {
      const data = await fetchPassageOnce(book, chapter, key, signal);
      if (key !== verKey) {
        data.note = data.note || `Mostrando ${data.version} (fallback desde ${verKey})`;
      }
      return data;
    } catch (err) {
      if (err?.name === 'AbortError') throw err;
      lastErr = err;
      console.warn(`[BibleAPI] ${book} ${chapter} @ ${key}:`, err?.message || err);
    }
  }

  console.error('[BibleAPI Service]', lastErr);
  return {
    success: false,
    error: lastErr?.message || 'No se pudo obtener el pasaje',
    book,
    chapter: Number(chapter) || 1,
    version: verKey,
    verses: [],
  };
}

export default getPassageData;
