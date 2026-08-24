/**
 * Éfata RevelatiO — reader-view.js
 * Renderizador puro: AppState → /api/bible → cabecera + versículos interactivos.
 * Cada versículo usa .rv-verse-surface para la barra flotante (verse-actions).
 */
import { getPassageData } from '../services/bible-api.js';
import { AppState } from '../core/app-state.js';

let mounted = false;

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

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
      <h1 id="chapter-title" class="text-3xl font-serif font-bold text-[#0A192F]">${escapeHtml(book)} ${escapeHtml(String(chapter))}</h1>
      <span id="chapter-version-label" class="text-xs font-serif font-semibold text-[#C59B27] tracking-wider uppercase">${escapeHtml(String(version))}</span>
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

/**
 * Selección de versículo → resaltado + barra flotante.
 * Compatible con verse-actions.js (RV.verseActions.show / selectVerseForAction).
 */
function handleVerseClick(verseEl, passageRef, verseText) {
  if (!verseEl) return;
  document
    .querySelectorAll(
      '#texto-biblico .is-verse-on, #texto-biblico .is-va-active, #verses-container .is-verse-on, #verses-container .is-va-active, .verse-item.is-verse-on'
    )
    .forEach((n) => {
      if (n !== verseEl) n.classList.remove('is-verse-on', 'is-va-active');
    });

  verseEl.classList.add('is-verse-on', 'is-va-active');
  if (passageRef) verseEl.dataset.reference = passageRef;
  if (verseText != null) verseEl.dataset.text = verseText;

  const api = globalThis.RV?.verseActions;
  if (api?.show) {
    api.show(verseEl, passageRef, verseText);
    return;
  }
  if (typeof globalThis.selectVerseForAction === 'function') {
    globalThis.selectVerseForAction(verseEl, passageRef, verseText);
  }
}

function renderVerseElement(book, chapter, v) {
  const num = v.verse ?? v.n ?? v.number;
  const text = v.text ?? v.texto ?? '';
  const passage = `${book} ${chapter}:${num}`;

  const verseEl = document.createElement('p');
  verseEl.className =
    'rv-verse-surface verse-item p-3 rounded-xl transition-all duration-150 cursor-pointer hover:bg-amber-100/50 relative border-l-4 border-transparent select-text';
  verseEl.dataset.verse = String(num);
  verseEl.dataset.versiculo = String(num);
  verseEl.dataset.text = text;
  verseEl.dataset.passage = passage;
  verseEl.dataset.reference = passage;
  verseEl.setAttribute('data-verse', '');
  verseEl.setAttribute('tabindex', '0');
  verseEl.setAttribute('role', 'button');
  verseEl.setAttribute('aria-label', `Versículo ${num}`);

  verseEl.innerHTML = `
    <sup class="rv-verse-num text-xs font-serif font-bold text-[#C59B27] mr-2 select-none">${escapeHtml(String(num))}</sup>
    <span class="rv-verse-text verse-text font-serif text-[#0F172A] text-lg leading-relaxed">${escapeHtml(text)}</span>
  `;

  const onActivate = (e) => {
    e.stopPropagation();
    handleVerseClick(verseEl, passage, text);
  };

  verseEl.addEventListener('click', onActivate);
  verseEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onActivate(e);
    }
  });

  return verseEl;
}

export function initReader() {
  const shell = document.getElementById('verses-container');
  const container = document.getElementById('texto-biblico') || shell;
  if (!shell || !container) return false;
  if (mounted) return true;
  mounted = true;

  if (globalThis.RV) {
    globalThis.RV.readerView = {
      active: true,
      initReader,
      handleVerseClick,
    };
  }
  globalThis.handleVerseClick = handleVerseClick;

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
          <p class="text-xs text-stone-500 mt-1">${escapeHtml(data.error || 'Revisa la conexión.')}</p>
        </div>`;
      return;
    }

    paintHeader(data);

    container.innerHTML = '';
    const fragment = document.createDocumentFragment();
    const book = data.book || state.currentBook;
    const chapter = data.chapter ?? state.currentChapter;

    data.verses.forEach((v) => {
      fragment.appendChild(renderVerseElement(book, chapter, v));
    });

    container.appendChild(fragment);

    document.dispatchEvent(
      new CustomEvent('revelatio:passage-ready', {
        detail: { book, chapter, version: data.version, count: data.verses.length },
      })
    );

    // Restaurar resaltados Frutos del Espíritu tras pintar
    setTimeout(() => {
      globalThis.RV?.verseActions?.restoreHighlights?.();
      globalThis.RV?.verseActions?.restore?.();
    }, 80);
  });

  return true;
}

export function initReaderView() {
  return initReader();
}

export { handleVerseClick };
export default initReader;
