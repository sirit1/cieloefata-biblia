/**
 * Éfata RevelatiO — boot-architecture.js
 * Arranca capas desacopladas: API → State → View.
 */
import { AppState } from './core/app-state.js';
import { initReader, initReaderView } from './views/reader-view.js';
import { getPassageData } from './services/bible-api.js';

function passageFromHash() {
  const hash = String(location.hash || '').replace(/^#/, '');
  const parts = hash.split('?')[0].split('/').filter(Boolean);
  if (parts[0] === 'lectura' && parts[1]) {
    try {
      return {
        book: decodeURIComponent(parts[1]),
        chapter: Number(parts[2]) || 1,
        verse: parts[3] ? Number(parts[3]) : 1,
      };
    } catch {
      return null;
    }
  }
  return null;
}

function mapUiVersion(version) {
  const v = String(version || '').toLowerCase();
  if (!v || v === 'rv1960' || v === 'rvr1960') return 'RVR1960';
  if (v === 'rv1909' || v === 'rvr1909' || v.includes('1909')) return 'RVR1909';
  if (v === 'dhh') return 'DHH';
  if (v === 'tla') return 'RVR1960';
  if (v === 'nvi') return 'NVI';
  if (v === 'kjv') return 'KJV';
  if (v === 'lxx' || v === 'septuaginta' || v === 'textual' || v === 'rahlfs') return 'LXX';
  return String(version || 'RVR1960').toUpperCase();
}

function ensureReaderMounted() {
  const ok = initReader();
  if (!ok) setTimeout(() => initReader(), 120);
}

function bridgeLegacyNavigation() {
  document.addEventListener('revelatio:goto', (event) => {
    const d = event.detail || {};
    if (!d.libro) return;
    const ver =
      d.version ||
      document.getElementById('selector-version')?.value ||
      AppState.currentVersion;
    AppState.setPassage(d.libro, Number(d.cap) || 1, mapUiVersion(ver));
  });

  document.addEventListener('change', (event) => {
    if (event.target?.id !== 'selector-version') return;
    AppState.setPassage(AppState.currentBook, AppState.currentChapter, mapUiVersion(event.target.value));
  });

  document.addEventListener('rv:route', (event) => {
    const name = event.detail?.name || event.detail?.route;
    if (name === 'estudio') ensureReaderMounted();
  });
}

function exposeGlobals() {
  const g = globalThis;
  g.RV = g.RV || {};
  g.RV.AppState = AppState;
  g.RV.getPassageData = getPassageData;
  g.RV.setPassage = (book, chapter, version) =>
    AppState.setPassage(book, chapter, version ? mapUiVersion(version) : null);
  g.RV.bootArchitecture = bootArchitecture;
}

export function bootArchitecture() {
  exposeGlobals();
  const fromHash = passageFromHash();
  const ver =
    document.getElementById('selector-version')?.value ||
    AppState.currentVersion;
  if (fromHash?.book) {
    AppState.currentBook = fromHash.book;
    AppState.currentChapter = fromHash.chapter;
    AppState.currentVersion = mapUiVersion(ver);
  }
  ensureReaderMounted();
  if (fromHash?.book) {
    AppState.setPassage(fromHash.book, fromHash.chapter, mapUiVersion(ver));
  }
  bridgeLegacyNavigation();
  return { AppState, initReader, initReaderView };
}

exposeGlobals();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => bootArchitecture());
} else {
  bootArchitecture();
}
