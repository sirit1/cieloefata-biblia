/**
 * Éfata RevelatiO — study-panel.js
 * Panel de estudio 100% dinámico vía /api/study-engine (sin mocks ni bancos estáticos).
 */
(function (global) {
  'use strict';

  const RV = (global.RV = global.RV || {});
  let currentActivePassage = 'Génesis 1:1';

  const COMMENTATORS = [
    { id: 'matthew-henry', label: 'Matthew Henry', author: 'Matthew Henry' },
    { id: 'charles-spurgeon', label: 'C. H. Spurgeon', author: 'Charles Spurgeon' },
    { id: 'jamieson-fausset-brown', label: 'Jamieson-Fausset-Brown', author: 'Jamieson-Fausset-Brown' },
  ];

  const REVELATIO_LENSES = [
    { id: 'cristocentro', icon: '✝️', title: 'Lente Cristocéntrica & Gracia', discipline: 'Cristología · Soteriología' },
    { id: 'metanoia', icon: '🧠', title: 'Lente de Metanoia & Neuroplasticidad', discipline: 'Epistemología · Ro. 12:2' },
    { id: 'paz_crisis', icon: '🕊️', title: 'Lente de Paz & Alivio en Crisis', discipline: 'Cuidado Pastoral' },
    { id: 'habitos_vida', icon: '🌱', title: 'Lente de Hábitos & Vida Práctica', discipline: 'Ética Aplicada' },
    { id: 'reino_canonica', icon: '📜', title: 'Lente Canónica & Reino', discipline: 'Hermenéutica Bíblica' },
  ];

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function authorLabel(key) {
    const hit = COMMENTATORS.find((c) => c.id === key || c.author.toLowerCase().includes(String(key || '').toLowerCase()));
    return hit?.author || key || 'Matthew Henry';
  }

  function setStudyPassage(passageRef) {
    if (!passageRef) return;
    currentActivePassage = passageRef;
    global.activePassage = passageRef;

    const titleEl = document.getElementById('study-panel-verse-title');
    if (titleEl) titleEl.textContent = currentActivePassage;

    const refEl = document.getElementById('rv-sp-ref');
    if (refEl) refEl.textContent = currentActivePassage;

    const headTitle = document.getElementById('rv-sp-title');
    if (headTitle) headTitle.textContent = `Estudio · ${currentActivePassage}`;
  }

  async function fetchCommentary(authorKey = 'matthew-henry') {
    const container = document.getElementById('commentary-content-area');
    if (!container) return;

    const author = authorLabel(authorKey);

    container.innerHTML = `
      <div class="py-10 text-center font-serif text-amber-800">
        <span class="animate-spin inline-block text-xl mb-2">⏳</span>
        <p class="text-xs font-semibold">Generando exposición exegética de ${escapeHtml(author.toUpperCase())} para ${escapeHtml(currentActivePassage)}...</p>
      </div>
    `;

    try {
      const res = await fetch('/api/study-engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passage: currentActivePassage, mode: 'commentary', author }),
      });
      const data = await res.json();
      if (data.success) {
        container.innerHTML = `
          <div class="p-4 font-serif text-sm leading-relaxed text-stone-900 whitespace-pre-line text-justify bg-white rounded-xl border border-[#E8DFC8]">
            ${data.answer}
          </div>
        `;
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      container.innerHTML = `<p class="p-4 text-xs text-rose-700 font-sans">Error: ${escapeHtml(err.message)}</p>`;
    }
  }

  async function fetchTsk() {
    const container = document.getElementById('tsk-content-area');
    if (!container) return;

    container.innerHTML = `
      <div class="py-10 text-center font-serif text-amber-800">
        <span class="animate-spin inline-block text-xl mb-2">⏳</span>
        <p class="text-xs font-semibold">Construyendo árbol canónico TSK para ${escapeHtml(currentActivePassage)}...</p>
      </div>
    `;

    try {
      const res = await fetch('/api/study-engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passage: currentActivePassage, mode: 'tsk' }),
      });
      const data = await res.json();
      if (data.success) {
        container.innerHTML = `
          <div class="p-4 font-serif text-xs leading-relaxed text-stone-800 whitespace-pre-line bg-white rounded-xl border border-[#E8DFC8]">
            ${data.answer}
          </div>
        `;
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      container.innerHTML = `<p class="p-4 text-xs text-rose-700 font-sans">Error: ${escapeHtml(err.message)}</p>`;
    }
  }

  async function fetchLexicon() {
    const container = document.getElementById('strong-content-area');
    if (!container) return;

    container.innerHTML = `
      <div class="py-10 text-center font-serif text-amber-800">
        <span class="animate-spin inline-block text-xl mb-2">⏳</span>
        <p class="text-xs font-semibold">Extrayendo raíces originales y glosas en español para ${escapeHtml(currentActivePassage)}...</p>
      </div>
    `;

    try {
      const res = await fetch('/api/study-engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passage: currentActivePassage, mode: 'lexicon' }),
      });
      const data = await res.json();
      if (data.success) {
        container.innerHTML = `
          <div class="p-4 font-serif text-xs leading-relaxed text-stone-900 whitespace-pre-line bg-amber-50/50 rounded-xl border border-[#C59B27]/40">
            ${data.answer}
          </div>
        `;
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      container.innerHTML = `<p class="p-4 text-xs text-rose-700 font-sans">Error: ${escapeHtml(err.message)}</p>`;
    }
  }

  global.executeLensInline = async function executeLensInline(lensId, lensTitle) {
    const resultBox = document.getElementById(`lens-result-${lensId}`);
    if (resultBox) {
      resultBox.remove();
      return;
    }

    const card = document.getElementById(`lens-card-${lensId}`);
    if (!card) return;

    const box = document.createElement('div');
    box.id = `lens-result-${lensId}`;
    box.className =
      'mt-3 p-4 bg-amber-50 border border-[#C59B27]/40 rounded-xl font-serif text-xs leading-relaxed text-stone-900 shadow-sm';
    box.innerHTML = `<span class="animate-spin inline-block mr-2">⏳</span>Procesando dictamen con RevelatiO IA para ${escapeHtml(currentActivePassage)}...`;
    card.appendChild(box);

    try {
      const res = await fetch('/api/study-engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passage: currentActivePassage, mode: 'lens', lensTitle }),
      });
      const data = await res.json();
      if (data.success) {
        box.innerHTML = `
          <div class="flex justify-between items-center pb-1.5 mb-2 border-b border-[#C59B27]/30">
            <span class="font-mono font-bold text-[10px] text-[#855D10] uppercase">${escapeHtml(lensTitle)}</span>
            <button type="button" onclick="document.getElementById('lens-result-${escapeHtml(lensId)}').remove()" class="text-stone-400 hover:text-stone-800 font-bold">&times;</button>
          </div>
          <div class="whitespace-pre-line text-justify space-y-2">${data.answer}</div>
        `;
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      box.innerHTML = `<p class="text-rose-700">No se pudo obtener respuesta: ${escapeHtml(err.message)}</p>`;
    }
  };

  function renderLentesPane() {
    const container = document.getElementById('rv-sp-dogmatica');
    if (!container) return;

    container.innerHTML = `
      <div class="space-y-4 font-serif text-[#0F172A]">
        <div class="pb-2 border-b border-[#E8DFC8]">
          <h3 class="text-sm font-bold text-[#0A192F] uppercase tracking-wider">Lentes de Transformación &amp; Decisión</h3>
          <p class="text-xs text-[#C59B27] font-sans mt-0.5">RevelatiO IA · ${escapeHtml(currentActivePassage)}</p>
        </div>
        <div class="space-y-3">
          ${REVELATIO_LENSES.map(
            (l) => `
            <div id="lens-card-${escapeHtml(l.id)}" class="rv-sp-lens-block">
              <button type="button"
                onclick="executeLensInline('${escapeHtml(l.id)}', '${escapeHtml(l.title)}')"
                class="group cursor-pointer bg-white hover:bg-amber-50/40 border border-[#E8DFC8] hover:border-[#C59B27] rounded-xl p-4 transition-all duration-200 shadow-sm hover:shadow-md text-left w-full">
                <div class="flex items-start gap-3">
                  <span class="text-xl p-2 rounded-lg bg-stone-100 flex-shrink-0">${l.icon}</span>
                  <div class="flex-1 min-w-0">
                    <h4 class="text-sm font-bold text-[#0A192F]">${escapeHtml(l.title)}</h4>
                    <span class="inline-block text-[10px] font-mono font-bold px-2 py-0.5 mt-1 bg-[#0A192F] text-[#DFB743] rounded">${escapeHtml(l.discipline)}</span>
                  </div>
                </div>
              </button>
            </div>`
          ).join('')}
        </div>
      </div>`;
  }

  function renderCommentsShell(authorKey) {
    const container = document.getElementById('rv-sp-comentarios');
    if (!container) return;
    container.innerHTML = `
      <div class="mb-3">
        <label for="rv-sp-autor" class="text-[10px] font-mono uppercase text-stone-500">Comentarista</label>
        <select id="rv-sp-autor" class="mt-1 w-full text-sm border border-[#E8DFC8] rounded-lg px-2 py-1.5 font-serif bg-white">
          ${COMMENTATORS.map(
            (c) =>
              `<option value="${escapeHtml(c.id)}"${c.id === authorKey ? ' selected' : ''}>${escapeHtml(c.label)}</option>`
          ).join('')}
        </select>
      </div>
      <div id="commentary-content-area"></div>`;
  }

  function renderTabPanes() {
    renderCommentsShell(currentAutor);
    const tskPane = document.getElementById('rv-sp-tsk');
    if (tskPane) tskPane.innerHTML = '<div id="tsk-content-area"></div>';
    const strongPane = document.getElementById('rv-sp-strong');
    if (strongPane) strongPane.innerHTML = '<div id="strong-content-area"></div>';
    renderLentesPane();
  }

  async function loadActiveTab() {
    if (currentTab === 'comentarios') await fetchCommentary(currentAutor);
    else if (currentTab === 'tsk') await fetchTsk();
    else if (currentTab === 'strong') await fetchLexicon();
    else if (currentTab === 'dogmatica') renderLentesPane();
  }

  const TABS_HTML = `
    <button type="button" class="is-on" data-sp-tab="comentarios" role="tab" aria-selected="true">📖 Comentarios</button>
    <button type="button" data-sp-tab="tsk" role="tab" aria-selected="false">🔗 Ref. Cruzadas (TSK)</button>
    <button type="button" data-sp-tab="strong" role="tab" aria-selected="false">🏛️ Léxico Strong</button>
    <button type="button" data-sp-tab="dogmatica" role="tab" aria-selected="false">🔬 Lentes de Estudio</button>`;

  let currentTab = 'comentarios';
  let currentAutor = localStorage.getItem('revelatio_autor') || 'matthew-henry';
  if (!COMMENTATORS.some((c) => c.id === currentAutor)) currentAutor = 'matthew-henry';

  function ensurePanel() {
    let root = document.getElementById('study-drawer') || document.getElementById('rv-study-panel');
    if (!root) {
      root = document.createElement('aside');
      root.id = 'study-drawer';
      root.className = 'rv-study-panel study-drawer';
      root.hidden = true;
      root.setAttribute('aria-label', 'Panel de estudio');
      root.innerHTML = `
        <div class="rv-sp-chrome">
          <header class="rv-sp-head">
            <div>
              <p class="rv-sp-kicker">Estudio · RevelatiO IA</p>
              <h2 id="rv-sp-title">Estudio del versículo</h2>
              <p id="study-panel-verse-title" class="rv-sp-ref"></p>
              <p id="rv-sp-ref" class="rv-sp-ref" hidden></p>
            </div>
            <button type="button" data-sp-close aria-label="Cerrar panel">✕</button>
          </header>
          <div id="study-drawer-tabs" class="rv-sp-tabs" role="tablist">${TABS_HTML}</div>
        </div>
        <div class="rv-sp-body canon-scroll">
          <section id="rv-sp-comentarios" class="rv-sp-pane is-on" role="tabpanel"></section>
          <section id="rv-sp-tsk" class="rv-sp-pane" role="tabpanel" hidden></section>
          <section id="rv-sp-strong" class="rv-sp-pane" role="tabpanel" hidden></section>
          <section id="rv-sp-dogmatica" class="rv-sp-pane" role="tabpanel" hidden></section>
        </div>`;
      document.body.appendChild(root);
    }
    return root;
  }

  function createApi() {
    const root = ensurePanel();

    const setTab = (tab) => {
      const map = { tsk: 'tsk', comentarios: 'comentarios', strong: 'strong', dogmatica: 'dogmatica', lentes: 'dogmatica', xref: 'tsk' };
      currentTab = map[tab] || tab || 'comentarios';
      root.querySelectorAll('[data-sp-tab]').forEach((btn) => {
        const on = btn.dataset.spTab === currentTab;
        btn.classList.toggle('is-on', on);
        btn.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      ['comentarios', 'tsk', 'strong', 'dogmatica'].forEach((id) => {
        const pane = document.getElementById(`rv-sp-${id}`);
        if (!pane) return;
        pane.classList.toggle('is-on', id === currentTab);
        pane.hidden = id !== currentTab;
      });
      loadActiveTab();
    };

    const render = async (ref) => {
      if (ref) setStudyPassage(ref);
      renderTabPanes();
      await loadActiveTab();
    };

    const open = async (opts = {}) => {
      const { tab = 'comentarios', ref } = opts;
      if (ref) setStudyPassage(ref);
      else {
        const study = global.currentStudyState || RV.currentStudyState;
        if (study?.ref) setStudyPassage(study.ref);
        else if (study?.book) setStudyPassage(`${study.book} ${study.chapter || 1}:${study.verse || 1}`);
      }
      root.hidden = false;
      root.classList.add('is-open');
      document.body.classList.add('has-study-panel');
      renderTabPanes();
      setTab(tab === 'xref' ? 'tsk' : tab);
    };

    const close = () => {
      root.classList.remove('is-open');
      root.hidden = true;
      document.body.classList.remove('has-study-panel');
    };

    root.addEventListener('change', (event) => {
      if (event.target?.id !== 'rv-sp-autor') return;
      currentAutor = event.target.value;
      localStorage.setItem('revelatio_autor', currentAutor);
      fetchCommentary(currentAutor);
    });

    root.addEventListener('click', (event) => {
      event.stopPropagation();
      if (event.target.closest('[data-sp-close]')) {
        close();
        return;
      }
      const tab = event.target.closest('[data-sp-tab]')?.dataset?.spTab;
      if (tab) setTab(tab);
    });

    document.addEventListener('revelatio:open-study-panel', (event) => open(event.detail || {}));
    document.addEventListener('revelatio:verse-selected', (event) => {
      if (root.classList.contains('is-open') && event.detail?.ref) render(event.detail.ref);
    });
    document.addEventListener('revelatio:passage-ready', (event) => {
      const d = event.detail || {};
      const ref = d.ref || (d.book ? `${d.book} ${d.chapter || 1}:${d.verse || 1}` : '');
      if (ref) setStudyPassage(ref);
    });
    document.addEventListener('revelatio:active-passage', (event) => {
      const d = event.detail || {};
      const ref = d.ref || (d.book ? `${d.book} ${d.chapter || 1}:${d.verse || 1}` : '');
      if (ref) {
        setStudyPassage(ref);
        if (root.classList.contains('is-open')) render(ref);
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && root.classList.contains('is-open')) close();
    });

    const btnStudy = document.getElementById('btn-study-panel');
    if (btnStudy) btnStudy.addEventListener('click', (e) => { e.preventDefault(); open({ tab: 'comentarios' }); });

    global.loadVerseCommentary = (book, chapter, verse) => {
      setStudyPassage(`${book} ${chapter}:${verse || 1}`);
    };

    RV.setStudyPassage = setStudyPassage;
    RV.fetchCommentary = fetchCommentary;
    RV.fetchTsk = fetchTsk;
    RV.fetchLexicon = fetchLexicon;
    RV.REVELATIO_LENSES = REVELATIO_LENSES;

    return { open, close, render, setTab, renderLentes: renderLentesPane };
  }

  let api = null;
  function mount() {
    if (api) return api;
    api = createApi();
    RV.studyPanel = api;
    return api;
  }

  RV.studyPanel = { mount, open: (o) => mount().open(o), close: () => mount().close() };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})(typeof window !== 'undefined' ? window : globalThis);
