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

/**
 * Sincroniza estado global del pasaje activo con el panel de estudio.
 */
export function updateActivePassageState(book, chapter, verse = 1) {
  const b = String(book || '').trim();
  const c = Number(chapter) || 1;
  const v = Number(verse) || 1;
  const ref = b ? `${b} ${c}:${v}` : '';

  globalThis.currentStudyState = { book: b, chapter: c, verse: v, ref };
  if (globalThis.RV) {
    globalThis.RV.currentStudyState = globalThis.currentStudyState;
  }

  const headerVerse =
    document.getElementById('study-panel-verse-title') ||
    document.getElementById('rv-sp-ref');
  if (headerVerse && ref) headerVerse.textContent = ref;

  const titleEl = document.getElementById('rv-sp-title');
  if (titleEl && ref) titleEl.textContent = `Estudio · ${ref}`;

  try {
    document.dispatchEvent(
      new CustomEvent('revelatio:active-passage', {
        detail: { book: b, chapter: c, verse: v, ref },
      })
    );
  } catch {
    /* ignore */
  }

  if (typeof globalThis.loadVerseCommentary === 'function' && b) {
    try {
      globalThis.loadVerseCommentary(b, c, v);
    } catch {
      /* ignore */
    }
  }

  return globalThis.currentStudyState;
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
      ${data?.note ? `<p id="chapter-version-note" class="mt-2 text-xs font-serif text-[#0A192F]/70">${escapeHtml(data.note)}</p>` : ''}
    `;
    return;
  }

  if (titleEl) titleEl.textContent = `${book} ${chapter}`;
  if (versionEl) {
    versionEl.textContent = version;
    versionEl.className =
      'text-xs font-serif font-semibold text-[#C59B27] tracking-wider uppercase';
  }
  const existingNote = document.getElementById('chapter-version-note');
  if (data?.note) {
    if (existingNote) {
      existingNote.textContent = data.note;
    } else if (versionEl?.parentElement) {
      const p = document.createElement('p');
      p.id = 'chapter-version-note';
      p.className = 'mt-2 text-xs font-serif text-[#0A192F]/70';
      p.textContent = data.note;
      versionEl.parentElement.appendChild(p);
    }
  } else if (existingNote) {
    existingNote.remove();
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

  const m = String(passageRef || '').match(/^(.+?)\s+(\d+)\s*:\s*(\d+)/);
  if (m) updateActivePassageState(m[1], m[2], m[3]);

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

const STRONG_PARTICLE = /^(ὁ|ἡ|τό|τὸ|τοῦ|τῆς|τῷ|τῇ|καί|καὶ|δέ|δὲ|τε|οὖν|γάρ|γὰρ|εἰς|ἐν|ἐκ|ἀπό|διά|μή|μὴ|οὐ|οὐκ|ו|ה|את|ל|ב|מ|כ)$/i;

function strongRowFromTokens(tokens) {
  const seen = new Set();
  const keys = [];
  for (const t of tokens || []) {
    const s = String(t.strong || '');
    const p = String(t.palabra || t.texto || '').trim();
    if (!s || seen.has(s) || STRONG_PARTICLE.test(p)) continue;
    seen.add(s);
    keys.push({ strong: s, palabra: p });
    if (keys.length >= 8) break;
  }
  if (!keys.length) return null;
  const span = document.createElement('span');
  span.className = 'rv-strong-row';
  span.innerHTML = keys
    .map(
      (t) =>
        `<button type="button" class="rv-strong" data-strong="${escapeHtml(t.strong)}" data-lemma="${escapeHtml(t.palabra)}" aria-label="Strong ${escapeHtml(t.strong)}">${escapeHtml(t.palabra)}<sup>${escapeHtml(t.strong)}</sup></button>`
    )
    .join('');
  return span;
}

function paintStrongRows(original, root) {
  const versos = original?.versos || [];
  if (!root || !versos.length) return 0;
  let painted = 0;
  for (const v of versos) {
    const n = Number(v.verso || v.n || v.verse);
    if (!n) continue;
    const el =
      root.querySelector(`[data-versiculo="${n}"]`) ||
      root.querySelector(`.verse-item[data-verse="${n}"]`);
    if (!el) continue;
    el.querySelector('.rv-strong-row')?.remove();
    const row = strongRowFromTokens(v.tokens);
    if (row) {
      el.appendChild(row);
      painted += 1;
    }
  }
  return painted;
}

async function attachOriginalChips(book, chapter, token, signal) {
  const ref = `${book} ${chapter}`;
  const res = await fetch(`/api/pasaje?referencia=${encodeURIComponent(ref)}`, {
    headers: { Accept: 'application/json' },
    signal,
  });
  if (!res.ok) return;
  const json = await res.json().catch(() => ({}));
  const original = json.data?.original || json.original;
  if (!original?.versos?.length) return;

  const prev = globalThis.__revelatioPassageData && typeof globalThis.__revelatioPassageData === 'object'
    ? globalThis.__revelatioPassageData
    : {};
  globalThis.__revelatioPassageData = { ...prev, original, referencia: prev.referencia || ref };

  if (token != null && token !== AppState.generation) return;
  const root = document.getElementById('texto-biblico') || document.getElementById('verses-container');
  paintStrongRows(original, root);
}

function foldName(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
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
      updateActivePassageState,
    };
  }
  globalThis.handleVerseClick = handleVerseClick;
  globalThis.updateActivePassageState = updateActivePassageState;

  let abortCtrl = null;

  AppState.subscribe(async (state, gen) => {
    const wantBook = state.currentBook;
    const wantChap = Number(state.currentChapter) || 1;
    const wantVer = state.currentVersion;
    const token = gen || state.generation;

    paintHeader({
      book: wantBook,
      chapter: wantChap,
      version: wantVer,
    });
    updateActivePassageState(wantBook, wantChap, 1);

    container.innerHTML =
      '<div class="py-12 text-center text-stone-400 font-serif">Cargando Sagradas Escrituras...</div>';

    if (abortCtrl) abortCtrl.abort();
    abortCtrl = typeof AbortController !== 'undefined' ? new AbortController() : null;

    let data;
    try {
      data = await getPassageData(wantBook, wantChap, wantVer, abortCtrl?.signal);
    } catch (err) {
      if (err?.name === 'AbortError') return;
      data = { success: false, verses: [], error: err?.message || 'Error de red' };
    }

    if (token !== AppState.generation) return;
    if (foldName(AppState.currentBook) !== foldName(wantBook) || Number(AppState.currentChapter) !== wantChap) {
      return;
    }

    const returnedBook = foldName(data.book || wantBook);
    if (data.success && data.verses?.length && returnedBook && returnedBook !== foldName(wantBook)) {
      return;
    }

    if (!data.success || !data.verses?.length) {
      paintHeader({
        book: wantBook,
        chapter: wantChap,
        version: wantVer,
      });
      updateActivePassageState(wantBook, wantChap, 1);
      container.innerHTML = `
        <div class="p-6 bg-amber-50 border border-[#E8DFC8] rounded-xl text-center font-serif text-[#0A192F]">
          <p class="font-bold">No se pudo cargar ${escapeHtml(wantBook)} ${wantChap}.</p>
          <p class="text-xs text-stone-500 mt-1">${escapeHtml(/HTTP Error:\s*\d+/i.test(String(data.error || '')) ? 'Comprueba la conexión. Si abriste la app en un servidor estático, las rutas /api/* no existen.' : (data.error || 'Revisa la conexión.'))}</p>
        </div>`;
      return;
    }

    paintHeader({
      book: wantBook,
      chapter: wantChap,
      version: data.version || wantVer,
      note: data.note || '',
    });

    container.innerHTML = '';
    const fragment = document.createDocumentFragment();
    data.verses.forEach((v) => {
      fragment.appendChild(renderVerseElement(wantBook, wantChap, v));
    });
    container.appendChild(fragment);

    updateActivePassageState(wantBook, wantChap, 1);

    attachOriginalChips(wantBook, wantChap, token, abortCtrl?.signal).catch(() => {});

    document.dispatchEvent(
      new CustomEvent('revelatio:passage-ready', {
        detail: {
          book: wantBook,
          chapter: wantChap,
          verse: 1,
          version: data.version,
          count: data.verses.length,
          ref: `${wantBook} ${wantChap}:1`,
        },
      })
    );

    setTimeout(() => {
      if (token !== AppState.generation) return;
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
