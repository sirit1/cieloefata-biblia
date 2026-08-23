/**
 * Éfata RevelatiO — bible-api.js
 * Cliente limpio: un solo endpoint `/api/bible` + claves de versión nativas.
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

export async function getPassageData(book, chapter, version = 'RVR1960') {
  const verKey = normalizeVersionKey(version);
  try {
    const res = await fetch(
      `/api/bible?book=${encodeURIComponent(book)}&chapter=${chapter}&version=${encodeURIComponent(verKey)}`
    );
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('[BibleAPI Service]', err);
    return { success: false, error: err.message };
  }
}

export default getPassageData;
