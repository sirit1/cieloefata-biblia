/**
 * Éfata RevelatiO — reader-view.js
 * Renderizador puro: AppState → /api/bible → cabecera limpia + versículos.
 * Sin avisos de contingencia ni badges «Mostrando texto en…».
 */
import { getPassageData } from '../services/bible-api.js';
import { AppState } from '../core/app-state.js';

let mounted = false;

function paintHeader(data) {
  const header = document.getElementById('chapter-header');
  const titleEl = document.getElementById('chapter-title');
  const versionEl = document.getElementById('chapter-version-label');

  const book = data?.book || AppState.currentBook || '';
  const chapter = data?.chapter ?? AppState.currentChapter ?? '';
  const version = data?.version || AppState.currentVersion || '';

  if (header) {
    header.className = 'mb-6 pb-2 border-b border-[#E8DFC8]';
    header.innerHTML = `
      <h1 id="chapter-title" class="text-3xl font-serif font-bold text-[#0A192F]">${book} ${chapter}</h1>
      <span id="chapter-version-label" class="text-xs font-serif font-semibold text-[#C59B27] tracking-wider uppercase">${version}</span>
    `;
    return;
  }

  if (titleEl) titleEl.textContent = `${book} ${chapter}`;
  if (versionEl) {
    versionEl.textContent = version;
    versionEl.className =
      'text-xs font-serif font-semibold text-[#C59B27] tracking-wider uppercase';
  }
}

export function initReader() {
  const shell = document.getElementById('verses-container');
  const container = document.getElementById('texto-biblico') || shell;
  if (!shell || !container) return false;
  if (mounted) return true;
  mounted = true;

  if (globalThis.RV) {
    globalThis.RV.readerView = { active: true, initReader };
  }

  AppState.subscribe(async (state) => {
    paintHeader({
      book: state.currentBook,
      chapter: state.currentChapter,
      version: state.currentVersion,
    });

    container.innerHTML =
      '<div class="py-12 text-center text-stone-400 font-serif">Cargando Sagradas Escrituras...</div>';

    const data = await getPassageData(
      state.currentBook,
      state.currentChapter,
      state.currentVersion
    );

    if (!data.success || !data.verses?.length) {
      paintHeader({
        book: state.currentBook,
        chapter: state.currentChapter,
        version: state.currentVersion,
      });
      container.innerHTML = `
        <div class="p-6 bg-amber-50 border border-[#E8DFC8] rounded-xl text-center font-serif text-[#0A192F]">
          <p class="font-bold">No se pudo cargar el pasaje.</p>
          <p class="text-xs text-stone-500 mt-1">${data.error || 'Revisa la conexión.'}</p>
        </div>`;
      return;
    }

    paintHeader(data);

    container.innerHTML = '';
    const fragment = document.createDocumentFragment();

    data.verses.forEach((v) => {
      const verseEl = document.createElement('div');
      verseEl.className =
        'verse-item p-3 rounded-lg hover:bg-[#C59B27]/10 transition-colors cursor-pointer border-l-2 border-transparent';
      verseEl.dataset.verseNum = v.verse;
      verseEl.dataset.passage = `${data.book} ${data.chapter}:${v.verse}`;

      verseEl.innerHTML = `
        <sup class="text-xs font-bold text-[#C59B27] mr-2 select-none">${v.verse}</sup>
        <span class="text-base sm:text-lg font-serif text-[#0F172A] leading-relaxed select-text">${v.text}</span>
      `;

      verseEl.addEventListener('click', () => {
        if (window.selectVerseForAction) {
          window.selectVerseForAction(
            verseEl,
            `${data.book} ${data.chapter}:${v.verse}`,
            v.text
          );
        }
      });

      fragment.appendChild(verseEl);
    });

    container.appendChild(fragment);
  });

  return true;
}

export function initReaderView() {
  return initReader();
}

export default initReader;
