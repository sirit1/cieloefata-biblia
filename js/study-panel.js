/**
 * RevelatiO — Panel Unificado de Estudio Bíblico
 * Integra Comentarios Clásicos, Referencias TSK, Concordancia, Léxico Strong y Lentes Hermenéuticas & Cognitivas Élite
 *
 * PRODUCT LAW (Alejandro): every panel action is GENERAL — any passage, any
 * version (RVR1960/NVI/DHH/TLA), any commentator, any lens id. Timeout / dedupe
 * / abort-previous apply to ALL lenses. Life-topic chips do not live on this
 * study door. Hebrews 10:6 / Mateo 9:12 / Juan 14:6 are acceptance tests only.
 */
(function (global) {
  'use strict';

  const RV = (global.Revelatio = global.Revelatio || {});

  const COMMENTATORS = [
    { id: 'charles-spurgeon', label: 'C. H. Spurgeon (El Príncipe de los Predicadores)' },
    { id: 'matthew-henry', label: 'Matthew Henry (Comentario Devocional)' },
    { id: 'john-calvin', label: 'Juan Calvino (Comentarios Exegéticos)' },
    { id: 'john-wesley', label: 'John Wesley (Notas Explicativas)' },
    { id: 'jamieson-fausset-brown', label: 'Jamieson-Fausset-Brown (Crítico y Explicativo)' },
    { id: 'john-gill', label: 'John Gill (Exposición)' },
    { id: 'adam-clarke', label: 'Adam Clarke (Comentario)' },
    { id: 'martin-luther', label: 'Martín Lutero (Comentarios Reformados)' },
    { id: 'agustin-de-hipona', label: 'Agustín de Hipona (Padres de la Iglesia)' },
  ];

  const ELITE_LENSES = {
    maestro: {
      id: 'dictamen_maestro',
      icon: '⚡',
      title: 'Dictamen integrado',
      subtitle: '',
      discipline: '',
      blurb: 'La IA redacta el dictamen de este pasaje. No hay texto prefabricado.',
      prompt: 'Emite un dictamen integrado (exégesis, diagnóstico cognitivo, renovación del nous y matriz decisional) para'
    },
    biblica: [
      {
        id: 'biblica_exegesis',
        icon: '📜',
        title: 'Exégesis Filológica & Textual',
        discipline: 'Filología Bíblica · Morfosintaxis · Strong',
        blurb: 'Morfosintáctico & Léxico Profundo, Contexto Histórico-Literario y Traducción Técnica Anotada.',
        prompt: 'Realiza un análisis morfosintáctico, léxico y exegético profundo con traducción técnica anotada para'
      },
      {
        id: 'biblica_cristo',
        icon: '✝️',
        title: 'Cristocentrismo & Sola Gratia',
        discipline: 'Teología Sistemática Reformada · Justificación Forense',
        blurb: 'Tipificación & Cumplimiento en Cristo, Desmantelamiento Forense del Mérito e Implicación Doctrinal del Pacto.',
        prompt: 'Analiza la tipificación y cumplimiento en Cristo, el desmantelamiento del mérito y la justificación forense en'
      },
      {
        id: 'biblica_pactos',
        icon: '🏛️',
        title: 'Teología del Pacto & Metarrelato',
        discipline: 'Arquitectura Pactal · Continuidad & Discontinuidad',
        blurb: 'Ubicación en el Metarrelato Canónico, Conexión Pactal y Continuidad/Discontinuidad.',
        prompt: 'Ubica el pasaje en el metarrelato canónico y la arquitectura de los pactos bíblicos para'
      },
      {
        id: 'biblica_apologetica',
        icon: '🛡️',
        title: 'Apologética Clásica & Cosmovisión',
        discipline: 'Filosofía Clásica · Epistemología · Defensa Canónica',
        blurb: 'Confrontación de Cosmovisiones, Coherencia Epistémica y Defensa Argumentativa.',
        prompt: 'Realiza una confrontación de cosmovisiones y defensa apologética rigurosa para'
      }
    ],
    mental: [
      {
        id: 'mental_neuro',
        icon: '🔬',
        title: 'Neurociencia Cognitiva & Sinapsis',
        discipline: 'Neurobiología · Córtex Prefrontal · Hexis',
        blurb: 'Dinámica Cerebral & Sesgos Heurísticos: la ciencia nombra el bucle; la Escritura nombra la salida (arrepentimiento, conversión, bautismo y perseverancia).',
        prompt: 'Diagnostica el bucle cognitivo y transmuta a arrepentimiento, conversión, bautismo y perseverancia en'
      },
      {
        id: 'mental_metanoia',
        icon: '🧠',
        title: 'Metanoia & Renovación del Nous',
        discipline: 'Epistemología Bíblica · Ro. 12:2 · Regeneración',
        blurb: 'Radiografía del Esquema del Siglo (Aion), Regeneración del Nous y Discernimiento de la Voluntad de Dios.',
        prompt: 'Analiza la radiografía del siglo, la regeneración del nous y el discernimiento de la voluntad de Dios en'
      },
      {
        id: 'mental_psicologia',
        icon: '🕊️',
        title: 'Psicología del Alma & Shalom',
        discipline: 'Consejería Clínica Bíblica · Terapia del Alma',
        blurb: 'Desarraigo de Motivaciones Ocultas, Regulación Emocional & Shalom y Acompañamiento en Crisis.',
        prompt: 'Analiza el desarraigo de motivaciones ocultas, la regulación emocional y el Shalom en crisis para'
      },
      {
        id: 'mental_decision',
        icon: '🧭',
        title: 'Matriz Decisional Estratégica',
        discipline: 'Asesoría Estratégica · Criterio Rector · Red Flags',
        blurb: 'Criterio Rector Innegociable, Matriz de Límites Rojos (Red Flags) y Directriz de Ejecución.',
        prompt: 'Genera la matriz decisional innegociable, líneas rojas y directriz de ejecución estratégica para'
      }
    ]
  };

  const REVELATIO_LENSES = [
    {
      id: 'dictamen_maestro',
      icon: '⚡',
      title: 'Dictamen integrado',
      discipline: '',
      blurb: 'La IA redacta el dictamen de este pasaje.',
      prompt: 'Emite un dictamen integrado para'
    },
    {
      id: 'biblica_exegesis',
      icon: '📜',
      title: 'Exégesis Filológica & Textual',
      discipline: 'Filología Bíblica · Morfosintaxis',
      blurb: 'Morfosintaxis profunda, raíces griegas/hebreas y contexto histórico-literario.',
      prompt: 'Realiza un análisis exegético y morfosintáctico riguroso de'
    },
    {
      id: 'biblica_cristo',
      icon: '✝️',
      title: 'Cristocentrismo & Sola Gratia',
      discipline: 'Teología Sistemática Reformada',
      blurb: 'Tipología en Cristo, desmantelamiento del mérito y justificación forense.',
      prompt: 'Analiza la tipificación y cumplimiento en Cristo para'
    },
    {
      id: 'mental_neuro',
      icon: '🔬',
      title: 'Neurociencia Cognitiva',
      discipline: 'Neurobiología · Dinámica Sináptica',
      blurb: 'Dinámica cerebral y sesgos cognitivos; la salida es metanoia, no un protocolo de autoayuda.',
      prompt: 'Diagnostica el bucle cognitivo y transmuta a metanoia y obediencia en'
    },
    {
      id: 'mental_metanoia',
      icon: '🧠',
      title: 'Metanoia & Renovación del Nous',
      discipline: 'Epistemología Bíblica · Ro. 12:2',
      blurb: 'Radiografía del siglo, regeneración del entendimiento y discernimiento.',
      prompt: 'Analiza la metanoia y renovación del nous en'
    }
  ];

  function resolveLens(idOrTitle) {
    if (!idOrTitle) return null;
    const s = String(idOrTitle).trim().toLowerCase();
    if (s.includes('maestro') || s.includes('dictamen')) return ELITE_LENSES.maestro;
    const foundB = ELITE_LENSES.biblica.find(l => l.id === s || l.title.toLowerCase().includes(s));
    if (foundB) return foundB;
    const foundM = ELITE_LENSES.mental.find(l => l.id === s || l.title.toLowerCase().includes(s));
    if (foundM) return foundM;
    return REVELATIO_LENSES.find((l) => l.id === s || l.title.toLowerCase().includes(s)) || null;
  }

  let currentActivePassage = '';
  let currentVerseText = '';
  let currentOpticTab = 'biblica';
  let commentaryAbort = null;
  let commentaryStamp = 0;
  let tskAbort = null;
  let tskStamp = 0;
  let concordanceAbort = null;
  let concordanceStamp = 0;
  let strongAbort = null;
  let strongStamp = 0;
  const lensAbortMap = new Map();
  /** Global: any passage, any lens id. Client waits >= server (45s). */
  const LENS_TIMEOUT_MS = 60000;
  const COMMENTARY_TIMEOUT_MS = 55000;
  const CONCORDANCE_TIMEOUT_MS = 40000;

  function consultedVersion() {
    try {
      return localStorage.getItem('revelatio_version') || 'rv1960';
    } catch {
      return 'rv1960';
    }
  }

  function drawerRoot() {
    return document.getElementById('study-drawer') || document.getElementById('rv-study-panel');
  }

  function drawerEl(id) {
    const root = drawerRoot();
    if (root) {
      const hit = root.querySelector(`#${id}`);
      if (hit) return hit;
    }
    return document.getElementById(id);
  }

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function escapeJsParam(s) {
    return String(s || '')
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/"/g, '&quot;')
      .replace(/\n/g, ' ')
      .replace(/\r/g, '');
  }

  function formatAnswerHtml(text) {
    if (!text) return '';
    const escaped = escapeHtml(String(text).trim());
    return escaped
      // Roman numerals with ### or ##
      .replace(/^###\s+([IVXLCDM]+\.?\s+.*?)$/gm, '<h5 class="font-bold text-[#855D10] font-mono uppercase tracking-wide my-3 border-b border-[#E8DFC8]/70 pb-1 text-xs flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-[#C59B27] inline-block"></span>$1</h5>')
      .replace(/^###\s+(.*?)$/gm, '<h5 class="font-bold text-[#855D10] uppercase tracking-wide my-2.5 border-b border-[#E8DFC8]/60 pb-1 text-xs">$1</h5>')
      .replace(/^##\s+([IVXLCDM]+\.?\s+.*?)$/gm, '<h4 class="font-bold text-[#0A192F] font-mono text-sm tracking-wide my-3 border-b border-[#C59B27]/30 pb-1.5">$1</h4>')
      .replace(/^##\s+(.*?)$/gm, '<h4 class="font-bold text-[#0A192F] text-sm tracking-wide my-2.5">$1</h4>')
      .replace(/^#\s+(.*?)$/gm, '<h3 class="font-bold text-[#0A192F] text-base my-3.5">$1</h3>')
      // Standalone Roman numerals at line start
      .replace(/^([IVXLCDM]+\.\s+.*?)$/gm, '<h5 class="font-bold text-[#855D10] font-mono text-xs tracking-wide my-2.5 flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-[#C59B27] inline-block"></span>$1</h5>')
      // Markdown formatting
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-[#0A192F] font-bold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-stone-700">$1</em>')
      .replace(/^[-*•]\s+(.*?)$/gm, '<div class="flex items-start gap-2 my-1 text-stone-800"><span class="text-[#855D10] font-bold text-xs mt-0.5">•</span><div class="flex-1">$1</div></div>')
      .replace(/\n\n+/g, '<div class="my-3"></div>')
      .replace(/\n/g, '<br/>');
  }

  function setStudyContext(passageRef, verseText = '') {
    if (!passageRef) return;
    currentActivePassage = String(passageRef).trim();
    if (verseText) currentVerseText = String(verseText).trim();

    global.activeStudyPassage = currentActivePassage;
    global.activeStudyText = currentVerseText;

    const titleEl = document.getElementById('study-panel-verse-title');
    if (titleEl) titleEl.textContent = currentActivePassage;

    const refEl = document.getElementById('rv-sp-ref');
    if (refEl) {
      refEl.textContent = currentActivePassage;
      refEl.hidden = true;
    }

    const state = global.currentStudyState || RV.currentStudyState || {};
    state.ref = currentActivePassage;
    state.text = currentVerseText;
    global.currentStudyState = state;
    RV.currentStudyState = state;
  }

  function syncStudyPanelToVerse(passageRef, verseText = '') {
    setStudyContext(passageRef, verseText);
    if (currentTab === 'comentarios') {
      fetchCommentary(currentAutor);
    } else if (currentTab === 'tsk') {
      loadTskReferences();
    } else if (currentTab === 'concordancia') {
      loadConcordance(currentActivePassage);
    } else if (currentTab === 'strong') {
      loadStrongLexicon();
    } else if (currentTab === 'dogmatica' || currentTab === 'lentes') {
      abortInFlightLenses('Cambio de versículo. El dictamen no llegó.');
      renderDualLensPanel();
    }
  }

  function httpErrorMessage(data, status) {
    if (typeof data?.error === 'string' && data.error.trim()) return data.error;
    if (data?.error && typeof data.error === 'object') {
      return data.error.message || data.error.code || `HTTP ${status}`;
    }
    if (typeof data?.message === 'string' && data.message.trim()) return data.message;
    return `HTTP ${status}`;
  }

  async function postEngine(url, bodyPayload, signal) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(bodyPayload),
      signal,
    });
    const data = await res.json().catch(() => ({}));
    return { res, data };
  }

  async function askEngine(bodyPayload, timeoutMs = 18000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const mode = String(bodyPayload.mode || bodyPayload.type || '').toLowerCase();
    const urls = ['/api/study-engine'];
    if (mode === 'lexicon' || mode === 'lexico' || mode === 'strong') {
      urls.push('/api/ai', '/api/lexico', '/api/lexicon');
    } else {
      urls.push('/api/ai');
    }

    let lastErr = null;
    try {
      for (const url of urls) {
        try {
          const { res, data } = await postEngine(url, bodyPayload, controller.signal);
          if (res.status === 404) {
            lastErr = new Error(httpErrorMessage(data, 404));
            continue;
          }
          if (!res.ok && res.status !== 200) {
            throw new Error(httpErrorMessage(data, res.status));
          }
          return data;
        } catch (err) {
          if (err?.name === 'AbortError') throw err;
          lastErr = err;
          if (!/404/.test(String(err?.message || ''))) {
            /* keep trying remaining fallbacks only on 404 */
          }
        }
      }

      if (mode === 'concordance' || mode === 'concordancia') {
        const q = String(
          bodyPayload.keyword || bodyPayload.searchTerm || bodyPayload.termino || bodyPayload.q || '',
        ).trim();
        if (q.length >= 3) {
          const res = await fetch(
          `/api/concordancia?q=${encodeURIComponent(q)}&version=${encodeURIComponent(bodyPayload.version || consultedVersion())}`,
            { method: 'GET', headers: { Accept: 'application/json' }, signal: controller.signal },
          );
          const data = await res.json().catch(() => ({}));
          if (res.status === 404) throw new Error(httpErrorMessage(data, 404));
          if (!res.ok && res.status !== 200) {
            throw new Error(httpErrorMessage(data, res.status));
          }
          return data;
        }
      }

      throw lastErr || new Error('HTTP 404');
    } finally {
      clearTimeout(timer);
    }
  }

  async function fetchCommentary(authorKey) {
    const container = document.getElementById('commentary-content-area');
    if (!container) return;
    const author = authorKey || currentAutor || 'charles-spurgeon';
    const authorObj = COMMENTATORS.find((c) => c.id === author) || COMMENTATORS[0];
    const passage = currentActivePassage;
    const stamp = ++commentaryStamp;

    if (commentaryAbort) commentaryAbort.abort();
    commentaryAbort = new AbortController();
    const timer = setTimeout(() => commentaryAbort.abort(), COMMENTARY_TIMEOUT_MS);

    container.innerHTML = `
      <div class="py-8 px-4 text-center font-serif text-[#855D10] space-y-2 animate-pulse">
        <span class="inline-block text-xl">⏳</span>
        <p class="text-xs font-semibold tracking-wide uppercase">Consultando comentario de ${escapeHtml(authorObj.label.split('(')[0].trim())}...</p>
        <p class="text-[11px] text-stone-500 font-mono">${escapeHtml(passage)}</p>
      </div>`;

    try {
      const res = await fetch('/api/commentary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        signal: commentaryAbort.signal,
        body: JSON.stringify({
          passage,
          referencia: passage,
          author: authorObj.id,
          autor: authorObj.id,
          verseText: currentVerseText,
        }),
      });
      clearTimeout(timer);
      if (stamp !== commentaryStamp || currentActivePassage !== passage) return;

      const data = await res.json().catch(() => ({}));
      if (!res.ok && res.status !== 200) {
        throw new Error(httpErrorMessage(data, res.status));
      }
      const textEs = String(data.textEs || '').trim();
      const textEn = String(data.textEn || '').trim();
      const apiText = String(data.text || data.answer || data.respuesta || '').trim();
      const spanishBody = textEs || (data.translated === true ? apiText : '');
      const englishBody = textEn || (!spanishBody ? apiText : '');
      const found = data.found === true && (spanishBody || englishBody) && data.source !== 'corpus-miss' && data.source !== 'theological-engine-fallback' && !/^No hay nota/i.test(spanishBody || apiText);
      const displayAuthor = authorObj.label;
      const nombreCorto = authorObj.label.split('(')[0].trim();
      const wrap = (inner) => `
          <div class="p-4 font-serif text-xs leading-relaxed text-stone-900 rounded-xl border shadow-sm space-y-2" style="background:#EEF2F4;border-color:#C9A84C;color:#2C3E4A">
            <div class="flex items-center justify-between pb-1.5 mb-2" style="border-bottom:1px solid #C9A84C">
              <span class="font-mono text-[10px] font-bold uppercase tracking-wider" style="color:#2C3E4A">${escapeHtml(displayAuthor)}</span>
            </div>
            ${inner}
          </div>`;
      if (!found) {
        const raw = String(apiText || spanishBody).trim();
        const miss = /^No hay nota/i.test(raw) && !/respaldo teol[oó]gico|gemini|\.env/i.test(raw)
          ? raw
          : `No hay nota de ${nombreCorto} para ${passage}.`;
        container.innerHTML = wrap(`<p class="text-xs">${escapeHtml(miss)}</p>`);
        return;
      }
      const disclaimer = String(data.disclaimer || 'Traducción automática del original inglés (dominio público). No es la edición de CLIE.').trim();
      if (spanishBody) {
        const formattedEs = formatAnswerHtml(spanishBody);
        const formattedEn = formatAnswerHtml(englishBody);
        container.innerHTML = wrap(`
          <div data-rv-tr-root>
            <div data-rv-tr-pane="es">
              <div class="text-xs leading-relaxed text-justify space-y-2">${formattedEs}</div>
              <p class="text-[10px] leading-snug mt-2" style="color:#2C3E4A">${escapeHtml(disclaimer)}</p>
              ${englishBody ? `<button type="button" data-rv-tr-toggle class="mt-2 font-mono text-[11px] font-bold px-3 py-1.5 rounded-lg cursor-pointer" style="color:#2C3E4A;background:#EEF2F4;border:1px solid #C9A84C">Ver original (inglés)</button>` : ''}
            </div>
            ${englishBody ? `<div data-rv-tr-pane="en" hidden>
              <p class="text-[10px] font-mono mb-2" style="color:#2C3E4A">Texto original en inglés (dominio público). No es una traducción de IA.</p>
              <div class="text-xs leading-relaxed text-justify space-y-2">${formattedEn}</div>
              <button type="button" data-rv-tr-toggle class="mt-2 font-mono text-[11px] font-bold px-3 py-1.5 rounded-lg cursor-pointer" style="color:#2C3E4A;background:#EEF2F4;border:1px solid #C9A84C">Ver traducción (español)</button>
            </div>` : ''}
          </div>`);
        return;
      }
      const originalEn = /spurgeon|henry|calvin|calvino|gill|clarke|jamieson|jfb|wesley/i.test(`${authorObj.id} ${authorObj.label}`)
        || (/\b(the|and|that|which|this|from|but|not)\b/i.test(englishBody) && !/[áéíóúñü¿¡]/.test(String(englishBody).slice(0, 500)));
      container.innerHTML = wrap(`
          ${originalEn ? `<p class="text-[10px] font-mono">Texto original en inglés (dominio público). No es una traducción de IA.</p>` : ''}
          <div class="text-xs leading-relaxed text-justify space-y-2">${formatAnswerHtml(englishBody)}</div>`);
    } catch (err) {
      clearTimeout(timer);
      if (stamp !== commentaryStamp) return;
      const isAbort = err?.name === 'AbortError' || /aborted/i.test(err?.message || '');
      const msg = isAbort ? 'La consulta requirió más tiempo de procesamiento.' : (err.message || 'Error al consultar comentario');
      container.innerHTML = `
        <div class="p-4 bg-amber-50/90 border border-[#C59B27]/40 text-stone-900 rounded-xl text-xs font-serif text-center space-y-2">
          <p class="font-bold text-[#855D10]">Comentario</p>
          <p class="text-[11px] text-stone-600">${escapeHtml(msg)}</p>
          <button type="button" data-sp-retry-commentary data-ref="${escapeHtml(passage)}" data-author="${escapeHtml(author)}" data-text="${escapeHtml(currentVerseText)}" class="px-3 py-1.5 bg-[#0A192F] text-[#DFB743] rounded-lg text-[11px] font-mono font-bold hover:bg-[#1E293B] cursor-pointer">Reintentar</button>
        </div>`;
    }
  }

  function renderCommentarySelector() {
    const sel = document.getElementById('commentary-author-select');
    if (!sel) return;
    sel.value = currentAutor;
  }

  async function loadCommentaryForVerse(passageRef, authorKey, verseText = '') {
    setStudyContext(passageRef, verseText);
    if (authorKey) {
      currentAutor = authorKey;
      localStorage.setItem('revelatio_autor', authorKey);
    }
    renderCommentarySelector();
    await fetchCommentary(currentAutor);
  }

  function ensureStudyPanelRoot() {
    const root = ensurePanel();
    const tskPane = document.getElementById('rv-sp-tsk');
    if (tskPane && !document.getElementById('tsk-content-area')) {
      tskPane.innerHTML = '<div id="tsk-content-area"></div>';
    }
    return root;
  }

  async function loadTskReferences(passageRef = currentActivePassage) {
    ensureStudyPanelRoot();
    const container = document.getElementById('tsk-content-area');
    if (!container) return;
    const passage = String(passageRef || currentActivePassage || 'Mateo 16:2').trim();
    const stamp = ++tskStamp;

    if (tskAbort) tskAbort.abort();
    tskAbort = new AbortController();
    const timer = setTimeout(() => tskAbort.abort(), 18000);

    container.innerHTML = `
      <div class="py-8 px-4 text-center font-serif text-[#855D10] space-y-2 animate-pulse">
        <span class="inline-block text-xl">⏳</span>
        <p class="text-xs font-semibold tracking-wide uppercase">Cargando referencias cruzadas Treasury of Scripture Knowledge...</p>
        <p class="text-[11px] text-stone-500 font-mono">${escapeHtml(passage)}</p>
      </div>`;

    try {
      let data = {};
      let lastStatus = 0;
      const version = consultedVersion();
      const res = await fetch('/api/tsk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        signal: tskAbort.signal,
        body: JSON.stringify({
          passage,
          consulta: passage,
          referencia: passage,
          version,
        }),
      });
      lastStatus = res.status;
      data = await res.json().catch(() => ({}));
      if (!res.ok && res.status !== 200) {
        throw new Error(httpErrorMessage(data, res.status));
      }
      clearTimeout(timer);
      if (stamp !== tskStamp || currentActivePassage !== passage) return;
      if (lastStatus === 404) {
        throw new Error(httpErrorMessage(data, 404));
      }

      if (data?.error && !data?.success && !data?.data?.referencias && !data?.referencias) {
        throw new Error(httpErrorMessage(data, lastStatus || 502));
      }

      const refs = Array.isArray(data.data?.referencias)
        ? data.data.referencias
        : (Array.isArray(data.referencias)
            ? data.referencias
            : (Array.isArray(data.references) ? data.references : []));
      const quotePackNote = String(data.data?.quotePackNote || '').trim();

      if (refs.length === 0) {
        const answer = data.answer || data.text || '';
        if (answer) {
          container.innerHTML = `
            <div class="p-4 font-serif text-xs leading-relaxed text-stone-900 bg-amber-50/50 rounded-xl border border-[#E8DFC8] space-y-2">
              <div class="font-mono text-[10px] font-bold text-[#855D10] uppercase tracking-wider pb-1 border-b border-[#E8DFC8]">TSK · ${escapeHtml(passage)}</div>
              <div>${formatAnswerHtml(answer)}</div>
            </div>`;
          return;
        }
        container.innerHTML = `
          <div class="p-4 bg-stone-50 border border-[#E8DFC8] rounded-xl text-xs font-serif text-center text-stone-600">
            No se encontraron referencias directas para ${escapeHtml(passage)}.
          </div>`;
        return;
      }

      container.innerHTML = `
        <div class="space-y-2">
          <div class="flex items-center justify-between pb-1.5 border-b border-[#E8DFC8]">
            <span class="font-mono text-[10px] font-bold text-[#855D10] uppercase tracking-wider">Referencias Cruzadas TSK (${refs.length})</span>
            <span class="text-[10px] text-stone-500 font-mono">${escapeHtml(passage)}</span>
          </div>
          ${quotePackNote ? `<div class="p-2.5 rounded-lg border border-[#C59B27]/50 bg-amber-50 text-[11px] text-stone-700">${escapeHtml(quotePackNote)}</div>` : ''}
          <div class="space-y-2">
            ${refs.map((r) => {
              const rRef = r.referencia || r.ref || r.cita || '';
              const rTxt = r.texto || r.text || '';
              const rTheme = r.tema || r.theme || '';
              const missing = r.quoteMissing === true || r.quotePackMissing === true;
              const missNote = r.nota && missing ? r.nota : `Sin cita de ${consultedVersion().toUpperCase()}: el texto de esta versión no está disponible.`;
              return `
                <div class="p-3 bg-white border border-[#E8DFC8] hover:border-[#C59B27] rounded-xl shadow-sm transition-all text-xs font-serif space-y-1">
                  <div class="flex items-center justify-between font-mono font-bold text-[#855D10]">
                    <span>${escapeHtml(rRef)}</span>
                    ${rTheme ? `<span class="text-[9px] font-normal text-stone-500 bg-amber-50 px-1.5 py-0.5 rounded border border-[#E8DFC8]">${escapeHtml(rTheme)}</span>` : ''}
                  </div>
                  ${rTxt ? `<p class="text-stone-700 italic text-[11px] leading-relaxed">"${escapeHtml(rTxt)}"</p>` : (missing ? `<p class="text-[10px] text-stone-500">${escapeHtml(missNote)}</p>` : '')}
                </div>`;
            }).join('')}
          </div>
        </div>`;
    } catch (err) {
      clearTimeout(timer);
      if (stamp !== tskStamp) return;
      const isAbort = err?.name === 'AbortError' || /aborted/i.test(err?.message || '');
      const msg = isAbort ? 'La consulta requirió más tiempo de procesamiento.' : (err.message || 'Error al cargar TSK');
      container.innerHTML = `
        <div class="p-4 bg-amber-50/90 border border-[#C59B27]/40 text-stone-900 rounded-xl text-xs font-serif text-center space-y-2">
          <p class="font-bold text-[#855D10]">Referencias Cruzadas</p>
          <p class="text-[11px] text-stone-600">${escapeHtml(msg)}</p>
          <button type="button" onclick="RV.loadTskReferences('${escapeHtml(passage)}')" class="px-3 py-1.5 bg-[#0A192F] text-[#DFB743] rounded-lg text-[11px] font-mono font-bold hover:bg-[#1E293B] cursor-pointer">Reintentar</button>
        </div>`;
    }
  }

  function keywordsFromVerse(text) {
    const stop = /^(para|como|que|los|las|del|una|uno|por|con|sin|sus|este|esta|the|and|from|that|this|el|la|de|en|y|o|un|al|lo|se|su|tu|mi|nos|les|mas|más|pero|porque|pues|cuando|donde|quien|cual|fue|son|hay|asi|así|muy|todos|todas|este|esta|eso)$/i;
    return String(text || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\p{L}\s]/gu, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 5 && !stop.test(w));
  }

  function keywordFromVerse(text) {
    return keywordsFromVerse(text)[0] || '';
  }

  function renderConcordanceHits(container, term, passage, resultados, banner = '') {
    const bannerHtml = banner
      ? `<div class="p-2.5 rounded-lg border border-[#C59B27]/50 bg-amber-50 text-[11px] text-stone-700">${escapeHtml(banner)}</div>`
      : '';
    container.innerHTML = `
      <div class="space-y-2">
        ${bannerHtml}
        <div class="flex items-center justify-between pb-1.5 border-b border-[#E8DFC8]">
          <span class="font-mono text-[10px] font-bold text-[#855D10] uppercase tracking-wider">Concordancia: "${escapeHtml(term)}" (${resultados.length})</span>
          <span class="text-[10px] text-stone-500 font-mono">${escapeHtml(passage)}</span>
        </div>
        <div class="space-y-2">
          ${resultados.map((r) => {
            const rRef = r.ref || (r.libro ? `${r.libro} ${r.capitulo}:${r.verso}` : '');
            const html = r.html || escapeHtml(r.texto || r.text || '');
            return `
              <div class="p-3 bg-white border border-[#E8DFC8] rounded-xl text-xs font-serif space-y-1">
                <div class="font-mono font-bold text-[#855D10]">${escapeHtml(rRef)}</div>
                <p class="text-stone-700 text-[11px] leading-relaxed">${html}</p>
              </div>`;
          }).join('')}
        </div>
      </div>`;
  }

  function getConcordanceSuggestions(_passage) {
    const fromVerse = keywordsFromVerse(currentVerseText).slice(0, 4);
    const base = ['Gracia', 'Pacto', 'Creer', 'Justificación', 'Paz', 'Verdad'];
    const out = [];
    for (const t of [...fromVerse, ...base]) {
      const key = String(t || '').toLowerCase();
      if (key && !out.some((x) => x.toLowerCase() === key)) out.push(t);
    }
    return out.filter((tag) => String(tag).replace(/\s+/g, '').length >= 3).slice(0, 6);
  }

  function renderConcordanceShell(initialTerm = '', passage = currentActivePassage) {
    const pane = document.getElementById('rv-sp-concordancia');
    if (!pane) return;
    const prior = pane.querySelector('#concordance-search-input')?.value || '';
    const term = initialTerm || prior || '';
    pane.innerHTML = `
        <div id="tab-concordancia" class="space-y-3 font-serif text-[#0F172A]">
          <div class="pb-2 border-b border-[#E8DFC8]">
            <h3 class="text-sm font-bold text-[#0A192F] uppercase tracking-wider">Concordancia Temática & Léxica</h3>
            <p class="text-xs text-[#C59B27] font-sans mt-0.5">Exploración transversal en las Escrituras · ${escapeHtml(passage)}</p>
          </div>
          <form id="concordance-search-form" onsubmit="event.preventDefault(); RV.executeConcordanceSearch();" class="flex gap-1.5">
            <input type="text" id="concordance-search-input" name="concordanceTerm" value="${escapeHtml(term)}" placeholder="Buscar término o doctrina (ej. Gracia, Pacto, Justificación)..."
              class="flex-1 px-3 py-1.5 bg-white border border-[#E8DFC8] rounded-lg text-xs font-serif text-[#0A192F] focus:border-[#C59B27] focus:outline-none shadow-sm" />
            <button type="submit" id="concordance-search-btn" class="px-3 py-1.5 bg-[#0A192F] text-[#DFB743] font-mono text-xs font-bold rounded-lg hover:bg-[#1E293B] cursor-pointer transition-colors">
              Buscar
            </button>
          </form>
          <div id="concordance-quick-tags" class="flex flex-wrap gap-1 items-center">
            <span class="text-[10px] font-mono text-stone-500 uppercase tracking-wider mr-1">Sugeridos:</span>
            ${getConcordanceSuggestions(passage).map(tag => `
              <button type="button" onclick="RV.setQuickConcordanceTag('${escapeHtml(tag)}')" class="px-2 py-0.5 bg-stone-100 hover:bg-[#0A192F] hover:text-[#DFB743] border border-[#E8DFC8] rounded text-[11px] font-serif text-stone-700 transition-colors cursor-pointer">
                ${escapeHtml(tag)}
              </button>
            `).join('')}
          </div>
          <div id="concordance-content-area" class="mt-3"></div>
        </div>
    `;
  }

  async function loadConcordance(passageRef = currentActivePassage, customTerm = '') {
    const passage = String(passageRef || currentActivePassage || '').trim();
    const typed = String(customTerm || '').trim();
    let term = typed;
    if (!term) term = keywordFromVerse(currentVerseText);

    renderConcordanceShell(term, passage);
    const pane = document.getElementById('rv-sp-concordancia');
    const container = pane?.querySelector('#concordance-content-area');
    if (!container) return;

    const stamp = ++concordanceStamp;
    if (concordanceAbort) concordanceAbort.abort();
    concordanceAbort = new AbortController();
    const timer = setTimeout(() => concordanceAbort.abort(), CONCORDANCE_TIMEOUT_MS);

    const candidates = [];
    if (typed.length >= 3) candidates.push(typed);
    else {
      for (const w of keywordsFromVerse(currentVerseText)) {
        if (!candidates.includes(w)) candidates.push(w);
      }
    }

    if (!candidates.length) {
      clearTimeout(timer);
      container.innerHTML = `
        <div class="p-4 bg-amber-50/90 border border-[#C59B27]/40 text-stone-900 rounded-xl text-xs font-serif text-center space-y-2">
          <p class="font-bold text-[#855D10]">Concordancia Bíblica</p>
          <p class="text-[11px] text-stone-600">Escribe al menos 3 letras para buscar en la Biblia.</p>
        </div>`;
      return;
    }

    try {
      let hits = [];
      let used = candidates[0];
      let indexable = true;
      let banner = '';
      let fallbackEtiqueta = '';
      for (const q of candidates) {
        if (q.length < 3) continue;
        container.innerHTML = `
      <div class="py-8 px-4 text-center font-serif text-[#855D10] space-y-2 animate-pulse">
        <span class="inline-block text-xl">⏳</span>
        <p class="text-xs font-semibold tracking-wide uppercase">Indexando concordancia bíblica para "${escapeHtml(q)}"...</p>
        <p class="text-[11px] text-stone-500 font-mono">${escapeHtml(passage)}</p>
      </div>`;
        const res = await fetch(
          `/api/concordancia?q=${encodeURIComponent(q)}&version=${encodeURIComponent(consultedVersion())}`,
          { method: 'GET', headers: { Accept: 'application/json' }, signal: concordanceAbort.signal },
        );
        const data = await res.json().catch(() => ({}));
        if (stamp !== concordanceStamp) return;
        if (!res.ok) {
          throw new Error(httpErrorMessage(data, res.status));
        }
        const payload = data.data || data;
        const got = payload.resultados || [];
        used = q;
        if (payload.indexable === false) indexable = false;
        if (payload.fallbackUsed && payload.banner) banner = String(payload.banner);
        if (payload.fallbackEtiqueta) fallbackEtiqueta = String(payload.fallbackEtiqueta);
        if (Array.isArray(got) && got.length) {
          hits = got;
          break;
        }
        if (payload.fallbackUsed) break;
      }
      clearTimeout(timer);
      if (stamp !== concordanceStamp) return;
      const input = pane.querySelector('#concordance-search-input');
      if (input) input.value = used;
      if (hits.length) {
        renderConcordanceHits(container, used, passage, hits, banner);
        return;
      }
      const emptyMsg = banner
        ? `No hay coincidencias para «${escapeHtml(used)}» en ${escapeHtml(fallbackEtiqueta || 'RVR1960')}.`
        : (indexable
          ? `No hay coincidencias para «${escapeHtml(used)}».`
          : `${escapeHtml(consultedVersion().toUpperCase())} no tiene índice y no fue posible usar un índice alterno.`);
      container.innerHTML = `
        <div class="p-4 font-serif text-xs leading-relaxed text-stone-900 bg-amber-50/50 rounded-xl border border-[#C59B27]/40 shadow-sm space-y-2">
          ${banner ? `<div class="p-2.5 rounded-lg border border-[#C59B27]/50 bg-amber-50 text-[11px] text-stone-700">${escapeHtml(banner)}</div>` : ''}
          <div class="flex items-center justify-between border-b border-[#C59B27]/30 pb-1.5 mb-2">
            <span class="font-mono text-[10px] font-bold text-[#855D10] uppercase tracking-wider">Concordancia: "${escapeHtml(used)}"</span>
          </div>
          <p class="text-xs text-stone-700">${emptyMsg}</p>
        </div>`;
    } catch (err) {
      clearTimeout(timer);
      if (stamp !== concordanceStamp) return;
      const isAbort = err?.name === 'AbortError' || /aborted/i.test(err?.message || '');
      const msg = isAbort ? 'La consulta requirió más tiempo de procesamiento.' : (err.message || 'Error al consultar concordancia');
      container.innerHTML = `
        <div class="p-4 bg-amber-50/90 border border-[#C59B27]/40 text-stone-900 rounded-xl text-xs font-serif text-center space-y-2">
          <p class="font-bold text-[#855D10]">Concordancia Bíblica</p>
          <p class="text-[11px] text-stone-600">${escapeHtml(msg)}</p>
          <button type="button" onclick="RV.loadConcordance('${escapeHtml(passage)}', '${escapeHtml(term)}')" class="px-3 py-1.5 bg-[#0A192F] text-[#DFB743] rounded-lg text-[11px] font-mono font-bold hover:bg-[#1E293B] cursor-pointer">Reintentar</button>
        </div>`;
    }
  }

  function executeConcordanceSearch() {
    const input = document.getElementById('concordance-search-input');
    const term = input ? input.value.trim() : '';
    loadConcordance(currentActivePassage, term);
  }

  function setQuickConcordanceTag(tag) {
    const input = document.getElementById('concordance-search-input');
    if (input) input.value = tag;
    loadConcordance(currentActivePassage, tag);
  }

  function fieldLabel(key) {
    const map = {
      codigo: 'Strong',
      lexema: 'Lexema',
      lemma: 'Lema',
      transliteracion: 'Transliteración',
      translit: 'Transliteración',
      pronunciacion: 'Pronunciación',
      definicionEs: 'Glosa ES',
      traduccionEstricta: 'Traducción',
      definicionCorta: 'Definición corta',
      definicion: 'Definición',
      idioma: 'Idioma',
      fuente: 'Fuente',
      raiz: 'Raíz',
    };
    return map[key] || key;
  }

  function looksSpanish(s) {
    return /[áéíóúñü¿¡]|ción\b|dad\b|mente\b/i.test(String(s || ''));
  }

  function renderStrongEntries(container, passage, entradas) {
    const cards = entradas.map((e) => {
      if (!e || typeof e !== 'object') return '';
      const codigo = e.codigo || e.code || '';
      const lexema = e.lexema || e.lemma || e.raiz || '';
      const translit = e.transliteracion || e.translit || '';
      const rawEs = String(e.definicionEs || e.traduccionEstricta || e.glosa || '').trim();
      const fake = /equivalente español no catalogado|glosa del original bíblico/i.test(rawEs);
      const glosaEs = !e.sinGlosaEs && !fake && rawEs && !/\b(the|and|of|to|from|with|that|this)\b/i.test(rawEs)
        ? rawEs
        : '';
      const definicion = String(e.definicion || e.definicionCorta || e.definition || '').trim();
      const extra = [];
      extra.push(
        glosaEs
          ? `<p><span class="font-mono text-[10px] text-[#855D10] uppercase">Glosa ES:</span> ${escapeHtml(glosaEs)}</p>`
          : `<p class="text-stone-600"><span class="font-mono text-[10px] text-[#855D10] uppercase">Glosa ES:</span> sin glosa ES catalogada</p>`
      );
      if (definicion && definicion !== glosaEs && !fake) {
        extra.push(`<p><span class="font-mono text-[10px] text-[#855D10] uppercase">${looksSpanish(definicion) ? 'Definición' : 'Definición (EN)'}:</span> ${escapeHtml(definicion)}</p>`);
      }
      ['idioma', 'fuente'].forEach((k) => {
        if (e[k]) extra.push(`<p class="text-[10px] text-stone-500">${escapeHtml(fieldLabel(k))}: ${escapeHtml(e[k])}</p>`);
      });
      return `
        <div class="p-3 bg-white border border-[#E8DFC8] rounded-xl text-xs font-serif space-y-1">
          <div class="font-mono font-bold text-[#855D10]">${escapeHtml(codigo)} · ${escapeHtml(lexema)} ${translit ? `(${escapeHtml(translit)})` : ''}</div>
          ${extra.join('')}
        </div>`;
    }).join('');
    container.innerHTML = `
      <div class="space-y-2">
        <div class="flex items-center justify-between pb-1.5 border-b border-[#E8DFC8]">
          <span class="font-mono text-[10px] font-bold text-[#855D10] uppercase tracking-wider">Léxico Strong</span>
          <span class="text-[10px] text-stone-500 font-mono">${escapeHtml(passage)}</span>
        </div>
        <div class="space-y-2">${cards}</div>
      </div>`;
  }

  async function loadStrongLexicon(passageRef = currentActivePassage) {
    const container = drawerEl('strong-content-area');
    if (!container) return;
    const passage = String(passageRef || currentActivePassage || 'Génesis 48:1').trim();
    const stamp = ++strongStamp;

    if (strongAbort) strongAbort.abort();
    strongAbort = new AbortController();
    const timer = setTimeout(() => strongAbort.abort(), 18000);

    container.innerHTML = `
      <div class="py-8 px-4 text-center font-serif text-[#855D10] space-y-2 animate-pulse">
        <span class="inline-block text-xl">⏳</span>
        <p class="text-xs font-semibold tracking-wide uppercase">Extrayendo raíces y léxico Strong...</p>
        <p class="text-[11px] text-stone-500 font-mono">${escapeHtml(passage)}</p>
      </div>`;

    try {
      const res = await fetch(
        `/api/lexico?referencia=${encodeURIComponent(passage)}`,
        { method: 'GET', headers: { Accept: 'application/json' }, signal: strongAbort.signal },
      );
      const data = await res.json().catch(() => ({}));
      clearTimeout(timer);
      if (stamp !== strongStamp || currentActivePassage !== passage) return;
      if (!res.ok) throw new Error(httpErrorMessage(data, res.status));

      const entradas =
        data.data?.entradas ||
        data.data?.resultados ||
        data.entradas ||
        (Array.isArray(data.data) ? data.data : null) ||
        [];
      if (Array.isArray(entradas) && entradas.length && typeof entradas[0] === 'object' && !Array.isArray(entradas[0])) {
        renderStrongEntries(container, passage, entradas);
        return;
      }
      container.innerHTML = `
        <div class="p-4 font-serif text-xs leading-relaxed text-stone-900 bg-amber-50/50 rounded-xl border border-[#C59B27]/40 shadow-sm space-y-2">
          <p class="text-xs text-stone-700">No hay entradas Strong estructuradas para ${escapeHtml(passage)}.</p>
        </div>`;
    } catch (err) {
      clearTimeout(timer);
      if (stamp !== strongStamp) return;
      const isAbort = err?.name === 'AbortError' || /aborted/i.test(err?.message || '');
      const msg = isAbort ? 'La consulta requirió más tiempo de procesamiento.' : (err.message || 'Error al consultar léxico Strong');
      container.innerHTML = `
        <div class="p-4 bg-amber-50/90 border border-[#C59B27]/40 text-stone-900 rounded-xl text-xs font-serif text-center space-y-2">
          <p class="font-bold text-[#855D10]">Léxico Strong</p>
          <p class="text-[11px] text-stone-600">${escapeHtml(msg)}</p>
          <button type="button" onclick="RV.loadStrongLexicon('${escapeHtml(passage)}')" class="px-3 py-1.5 bg-[#0A192F] text-[#DFB743] rounded-lg text-[11px] font-mono font-bold hover:bg-[#1E293B] cursor-pointer">Reintentar</button>
        </div>`;
    }
  }

  function switchOpticTab(tabKey) {
    currentOpticTab = tabKey === 'mental' ? 'mental' : 'biblica';
    const btnBiblica = document.getElementById('btn-optic-biblica');
    const btnMental = document.getElementById('btn-optic-mental');
    const secBiblica = document.getElementById('optic-section-biblica');
    const secMental = document.getElementById('optic-section-mental');

    if (btnBiblica && btnMental) {
      if (currentOpticTab === 'biblica') {
        btnBiblica.className = 'flex-1 py-2 px-3 rounded-lg text-xs font-bold font-mono text-center transition-all cursor-pointer bg-[#0A192F] text-[#DFB743] shadow-sm border border-[#C59B27]/40';
        btnMental.className = 'flex-1 py-2 px-3 rounded-lg text-xs font-bold font-mono text-center transition-all cursor-pointer text-stone-600 hover:text-stone-900 border border-transparent';
      } else {
        btnMental.className = 'flex-1 py-2 px-3 rounded-lg text-xs font-bold font-mono text-center transition-all cursor-pointer bg-[#0A192F] text-[#DFB743] shadow-sm border border-[#C59B27]/40';
        btnBiblica.className = 'flex-1 py-2 px-3 rounded-lg text-xs font-bold font-mono text-center transition-all cursor-pointer text-stone-600 hover:text-stone-900 border border-transparent';
      }
    }

    if (secBiblica) secBiblica.hidden = currentOpticTab !== 'biblica';
    if (secMental) secMental.hidden = currentOpticTab !== 'mental';
  }

  function paintLensError(cardId, msg, titleHint = '') {
    const box = document.getElementById(`lens-result-${cardId}`);
    if (!box) return;
    const btn = document.querySelector(`[data-sp-lens-id="${cardId}"]`);
    const title = titleHint || btn?.getAttribute('data-sp-lens-title') || 'Lente';
    box.dataset.lensState = 'error';
    const escapedId = escapeJsParam(cardId);
    const escapedTitle = escapeJsParam(title);
    box.innerHTML = `
        <div class="p-4 bg-amber-50/95 border border-[#C59B27]/50 text-stone-900 rounded-xl text-xs font-serif text-center space-y-2.5 shadow-sm">
          <div class="flex justify-between items-center pb-1 border-b border-[#C59B27]/30">
            <strong class="font-mono font-bold text-[11px] text-[#855D10] uppercase tracking-wider">${escapeHtml(title)}</strong>
            <button type="button" onclick="event.stopPropagation(); document.getElementById('lens-result-${cardId}')?.remove()" class="text-stone-400 hover:text-stone-800 font-bold text-sm px-1 cursor-pointer" aria-label="Cerrar">&times;</button>
          </div>
          <p class="text-[11px] text-stone-600">${escapeHtml(msg)}</p>
          <button type="button" onclick="event.stopPropagation(); window.triggerEliteLens('${escapedId}', '${escapedTitle}')" class="px-3 py-1.5 bg-[#0A192F] text-[#DFB743] rounded-lg text-[11px] font-mono font-bold hover:bg-[#1E293B] transition-colors cursor-pointer">Reintentar Dictamen</button>
        </div>
      `;
  }

  function abortInFlightLenses(reason) {
    const msg = String(reason || 'El dictamen no llegó.');
    for (const [pendingId, pending] of lensAbortMap.entries()) {
      paintLensError(pendingId, msg);
      try {
        pending.abort('replaced');
      } catch {
        pending.abort();
      }
    }
    lensAbortMap.clear();
  }

  async function triggerEliteLens(subLensId, lensTitle) {
    const ref = String(currentActivePassage || global.activeStudyPassage || global.currentStudyRef || '').trim();
    const title = String(lensTitle || 'Análisis Bíblico Élite').trim();
    const id = String(subLensId || 'dictamen_maestro').trim();
    const cardId = id;
    const verseText = String(currentVerseText || global.activeStudyText || '').trim();

    const root = drawerRoot();
    const targetCard =
      (root && root.querySelector(`#lens-card-${cardId}`)) ||
      (root && root.querySelector(`[data-sp-lens-id="${id}"]`)?.closest('.rv-sp-lens-block')) ||
      drawerEl('lentes-content-area');

    if (!targetCard) return;

    let resultBox = targetCard.querySelector(`#lens-result-${cardId}`) || drawerEl(`lens-result-${cardId}`);
    if (resultBox?.dataset.lensState === 'done') {
      resultBox.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      return;
    }
    if (resultBox?.dataset.lensState === 'loading' && lensAbortMap.has(cardId)) {
      resultBox.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      return;
    }

    for (const [pendingId, pending] of lensAbortMap.entries()) {
      if (pendingId === cardId) continue;
      paintLensError(pendingId, 'Se pidió otra lente. El dictamen no llegó.');
      try {
        pending.abort('replaced');
      } catch {
        pending.abort();
      }
      lensAbortMap.delete(pendingId);
    }

    if (!resultBox) {
      resultBox = document.createElement('div');
      resultBox.id = `lens-result-${cardId}`;
      resultBox.className = 'mt-3 p-4 bg-amber-50/95 border-2 border-[#C59B27]/60 rounded-xl font-serif text-xs leading-relaxed text-stone-900 shadow-md animate-in fade-in duration-200';
      targetCard.querySelectorAll(`#lens-result-${cardId}`).forEach((el) => el.remove());
      document.querySelectorAll(`#lens-result-${cardId}`).forEach((el) => {
        if (el !== resultBox) el.remove();
      });
      targetCard.appendChild(resultBox);
    }
    resultBox.dataset.lensState = 'loading';
    resultBox.innerHTML = `
      <div class="flex items-center gap-2.5 text-[#855D10] font-sans font-semibold py-2">
        <span class="animate-spin inline-block text-base">⏳</span>
        <div class="flex-1 min-w-0">
          <p class="text-xs font-bold uppercase tracking-wide text-[#0A192F]">RevelatiO IA</p>
          <p class="text-[11px] text-stone-600 font-serif">Redactando dictamen para <strong>${escapeHtml(ref || 'el pasaje en lectura')}</strong>…</p>
        </div>
      </div>
    `;

    const controller = new AbortController();
    lensAbortMap.set(cardId, controller);
    const timer = setTimeout(() => {
      try {
        controller.abort('timeout');
      } catch {
        controller.abort();
      }
    }, LENS_TIMEOUT_MS);

    try {
      let res = await fetch('/api/lente-elite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          passage: ref,
          subLensId: id,
          lensId: id,
          lensTitle: title,
          verseText,
          mode: 'elite_lens',
          prompt: `Analiza ${ref} bajo ${title}`,
        }),
      });

      if (!res.ok && res.status !== 200) {
        res = await fetch('/api/study-engine', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            passage: ref,
            subLensId: id,
            lensId: id,
            lensTitle: title,
            verseText,
            mode: 'elite_lens',
            prompt: `Analiza ${ref} bajo ${title}`,
          }),
        });
      }

      clearTimeout(timer);
      const data = await res.json().catch(() => ({}));
      if (data.success === false || data.source === 'ai-unavailable') {
        throw new Error(
          data.error || data.meta?.error || data.meta?.geminiError || data.meta?.gatewayError
            || 'Falta Gemini o AI Gateway. Las lentes no inventarán un dictamen.',
        );
      }
      const answer = data.answer || data.respuesta || data.result || data.text || '';
      if (!answer) {
        throw new Error(httpErrorMessage(data, res.status || 502) || 'No se recibió respuesta del análisis.');
      }

      const formatted = formatAnswerHtml(answer);

      resultBox.dataset.lensState = 'done';
      resultBox.innerHTML = `
        <div class="flex justify-between items-center pb-2 mb-2.5 border-b border-[#C59B27]/40">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-[#855D10]"></span>
            <span class="font-mono font-bold text-[11px] text-[#855D10] uppercase tracking-wider">${escapeHtml(title)}</span>
          </div>
          <button type="button" onclick="event.stopPropagation(); document.getElementById('lens-result-${cardId}')?.remove()" class="text-stone-400 hover:text-stone-800 font-bold text-base px-1.5 py-0.5 rounded hover:bg-amber-100 cursor-pointer transition-colors" aria-label="Cerrar dictamen">&times;</button>
        </div>
        <div class="text-xs font-serif leading-relaxed text-justify space-y-2.5 text-stone-800">
          ${formatted}
        </div>
      `;
      if (id === 'dictamen_maestro') {
        document.getElementById('lentes-opticas')?.removeAttribute('hidden');
      }
    } catch (err) {
      clearTimeout(timer);
      const replaced = controller.signal.reason === 'replaced' || /replaced/i.test(String(controller.signal.reason || err?.message || ''));
      if (replaced) {
        return;
      }
      if (lensAbortMap.get(cardId) && lensAbortMap.get(cardId) !== controller) {
        return;
      }
      resultBox.dataset.lensState = 'error';
      const isAbort = err?.name === 'AbortError' || /aborted|tiempo de espera/i.test(err?.message || '');
      const msg = isAbort ? 'La consulta requirió más tiempo de procesamiento.' : (err.message || 'Error en RevelatiO IA');
      const escapedId = escapeJsParam(id);
      const escapedTitle = escapeJsParam(title);

      resultBox.innerHTML = `
        <div class="p-4 bg-amber-50/95 border border-[#C59B27]/50 text-stone-900 rounded-xl text-xs font-serif text-center space-y-2.5 shadow-sm">
          <div class="flex justify-between items-center pb-1 border-b border-[#C59B27]/30">
            <strong class="font-mono font-bold text-[11px] text-[#855D10] uppercase tracking-wider">${escapeHtml(title)}</strong>
            <button type="button" onclick="event.stopPropagation(); document.getElementById('lens-result-${cardId}')?.remove()" class="text-stone-400 hover:text-stone-800 font-bold text-sm px-1 cursor-pointer" aria-label="Cerrar">&times;</button>
          </div>
          <p class="text-[11px] text-stone-600">${escapeHtml(msg)}</p>
          <button type="button" onclick="event.stopPropagation(); window.triggerEliteLens('${escapedId}', '${escapedTitle}')" class="px-3 py-1.5 bg-[#0A192F] text-[#DFB743] rounded-lg text-[11px] font-mono font-bold hover:bg-[#1E293B] transition-colors cursor-pointer">Reintentar Dictamen</button>
        </div>
      `;
    } finally {
      if (lensAbortMap.get(cardId) === controller) lensAbortMap.delete(cardId);
    }
  }

  function renderDualLensPanel() {
    const pane = document.getElementById('rv-sp-dogmatica');
    const container = pane || drawerEl('lentes-content-area');
    if (!container) return;

    const saved = {};
    container.querySelectorAll('[id^="lens-result-"]').forEach((el) => {
      saved[el.id] = el;
    });

    const m = ELITE_LENSES.maestro;
    const ref = currentActivePassage || global.activeStudyPassage || '';
    const maestroDone = saved['lens-result-dictamen_maestro']?.dataset?.lensState === 'done';

    const opticBtn = (l) => `
              <div id="lens-card-${l.id}" class="rv-sp-lens-block">
                <button type="button" data-sp-lens-id="${l.id}" data-sp-lens-title="${escapeHtml(l.title)}"
                  class="group cursor-pointer px-3 py-2 bg-white border border-[#E8DFC8] hover:border-[#C59B27] rounded-lg text-left w-full">
                  <h4 class="font-bold text-sm text-[#0F172A] group-hover:text-[#855D10] transition-colors">${escapeHtml(l.title)}</h4>
                </button>
              </div>`;

    const html = `
      <div id="tab-lentes" class="space-y-3.5 font-serif text-[#0F172A]">
        <div class="pb-2 border-b border-[#E8DFC8]">
          <h3 class="text-sm font-bold text-[#0A192F] uppercase tracking-wider">Lentes</h3>
          <p class="text-xs text-stone-600 font-sans mt-0.5">${ref ? escapeHtml(ref) : 'Pasaje en lectura'}</p>
        </div>

        <div id="lentes-content-area" class="space-y-3">
          <div id="lens-card-${m.id}" class="rv-sp-lens-block">
            <button type="button" data-sp-lens-id="${m.id}" data-sp-lens-title="${escapeHtml(m.title)}"
              class="group cursor-pointer p-4 bg-[#0A192F] border border-[#C59B27] hover:border-[#DFB743] rounded-xl shadow-md transition-all text-left w-full text-white">
              <h4 class="font-bold text-sm text-[#DFB743] tracking-wide">${escapeHtml(m.title)}</h4>
              <p class="text-xs text-stone-200/90 leading-snug mt-1">${escapeHtml(m.blurb)}</p>
            </button>
          </div>

          <div id="lentes-opticas" class="space-y-3" ${maestroDone ? '' : 'hidden'}>
            <div class="flex items-center gap-1.5 p-1 bg-stone-100 border border-[#E8DFC8] rounded-xl select-none">
              <button type="button" id="btn-optic-biblica" onclick="window.switchOpticTab('biblica')"
                class="flex-1 py-2 px-3 rounded-lg text-xs font-bold font-mono text-center transition-all cursor-pointer ${currentOpticTab === 'biblica' ? 'bg-[#0A192F] text-[#DFB743] shadow-sm border border-[#C59B27]/40' : 'text-stone-600 hover:text-stone-900 border border-transparent'}">
                Óptica bíblica
              </button>
              <button type="button" id="btn-optic-mental" onclick="window.switchOpticTab('mental')"
                class="flex-1 py-2 px-3 rounded-lg text-xs font-bold font-mono text-center transition-all cursor-pointer ${currentOpticTab === 'mental' ? 'bg-[#0A192F] text-[#DFB743] shadow-sm border border-[#C59B27]/40' : 'text-stone-600 hover:text-stone-900 border border-transparent'}">
                Óptica mental
              </button>
            </div>
            <div id="optic-section-biblica" class="space-y-2" ${currentOpticTab === 'biblica' ? '' : 'hidden'}>
              ${ELITE_LENSES.biblica.map(opticBtn).join('')}
            </div>
            <div id="optic-section-mental" class="space-y-2" ${currentOpticTab === 'mental' ? '' : 'hidden'}>
              ${ELITE_LENSES.mental.map(opticBtn).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;
    Object.values(saved).forEach((el) => {
      const id = String(el.id || '').replace(/^lens-result-/, '');
      const card =
        container.querySelector(`#lens-card-${id}`) ||
        container.querySelector(`[data-sp-lens-id="${id}"]`)?.closest('.rv-sp-lens-block');
      if (card) card.appendChild(el);
    });
  }

  const openAiWithLens = async function(promptSeed, passageRef, lensTitle, lensId) {
    const id = String(lensId || '').trim();
    if (id && (id.startsWith('biblica_') || id.startsWith('mental_') || id === 'dictamen_maestro')) {
      return triggerEliteLens(id, lensTitle);
    }
    const resolved = resolveLens(id) || resolveLens(lensTitle);
    if (resolved) {
      return triggerEliteLens(resolved.id, resolved.title);
    }
    return triggerEliteLens(id || 'dictamen_maestro', lensTitle || 'Análisis Bíblico');
  };

  function renderLentesPane() {
    renderDualLensPanel();
  }

  function renderCommentsShell(authorKey) {
    const container = document.getElementById('rv-sp-comentarios');
    if (!container) return;
    container.innerHTML = `
      <div class="mb-3">
        <label for="commentary-author-select" class="text-[10px] font-mono uppercase text-stone-500 font-semibold tracking-wider">Comentarista Clásico</label>
        <select id="commentary-author-select" name="comentarista" class="mt-1 w-full text-sm border border-[#E8DFC8] rounded-lg px-2 py-1.5 font-serif bg-white text-stone-800 shadow-sm focus:border-[#C59B27] focus:outline-none">
          ${COMMENTATORS.map(
            (c) =>
              `<option value="${escapeHtml(c.id)}"${c.id === authorKey ? ' selected' : ''}>${escapeHtml(c.label)}</option>`
          ).join('')}
        </select>
      </div>
      <div id="commentary-content-area"></div>`;
    renderCommentarySelector();
  }

  function renderTabPanes() {
    renderCommentsShell(currentAutor);
    const tskPane = document.getElementById('rv-sp-tsk');
    if (tskPane) tskPane.innerHTML = '<div id="tsk-content-area"></div>';
    renderConcordanceShell('', currentActivePassage);
    const strongPane = document.getElementById('rv-sp-strong');
    if (strongPane) strongPane.innerHTML = '<div id="strong-content-area"></div>';
    renderDualLensPanel();
  }

  async function loadActiveTab() {
    if (currentTab === 'comentarios') await fetchCommentary(currentAutor);
    else if (currentTab === 'tsk') await loadTskReferences();
    else if (currentTab === 'concordancia') await loadConcordance(currentActivePassage);
    else if (currentTab === 'strong') await loadStrongLexicon();
    else if (currentTab === 'dogmatica' || currentTab === 'lentes') {
      const pane = document.getElementById('rv-sp-dogmatica');
      if (!pane?.querySelector('[data-sp-lens-id]')) renderDualLensPanel();
    }
  }

  const TABS_HTML = `
    <button type="button" class="is-on cursor-pointer font-mono text-[9px] font-bold" data-sp-tab="comentarios" role="tab" aria-selected="true" title="Comentarios Clásicos">📖 COMENT.</button>
    <button type="button" class="cursor-pointer font-mono text-[9px] font-bold" data-sp-tab="tsk" role="tab" aria-selected="false" title="Referencias Cruzadas TSK">🔗 TSK</button>
    <button type="button" class="cursor-pointer font-mono text-[9px] font-bold" data-sp-tab="concordancia" role="tab" aria-selected="false" title="Concordancia Bíblica y Temática">📑 CONCORD.</button>
    <button type="button" class="cursor-pointer font-mono text-[9px] font-bold" data-sp-tab="strong" role="tab" aria-selected="false" title="Léxico y Raíces Strong">🏛 LÉXICO</button>
    <button type="button" class="cursor-pointer font-mono text-[9px] font-bold" data-sp-tab="lentes" role="tab" aria-selected="false" title="Lentes Hermenéuticas & Cognitivas Élite">🔬 LENTES</button>`;

  let currentTab = 'comentarios';
  let currentAutor = localStorage.getItem('revelatio_autor') || 'charles-spurgeon';
  if (!COMMENTATORS.some((c) => c.id === currentAutor)) currentAutor = 'charles-spurgeon';

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
              <p id="study-panel-verse-title" class="rv-sp-ref study-verse-header"></p>
              <p class="study-panel-subtitle rv-sp-ref" hidden></p>
              <p id="rv-sp-ref" class="rv-sp-ref" hidden></p>
            </div>
            <button type="button" data-sp-close aria-label="Cerrar panel" class="cursor-pointer">✕</button>
          </header>
          <div id="study-drawer-tabs" class="rv-sp-tabs grid grid-cols-5 gap-1 text-center select-none" role="tablist">${TABS_HTML}</div>
        </div>
        <div class="rv-sp-body canon-scroll">
          <section id="rv-sp-comentarios" class="rv-sp-pane is-on" role="tabpanel"></section>
          <section id="rv-sp-tsk" class="rv-sp-pane" role="tabpanel" hidden></section>
          <section id="rv-sp-concordancia" class="rv-sp-pane" role="tabpanel" hidden></section>
          <section id="rv-sp-strong" class="rv-sp-pane" role="tabpanel" hidden></section>
          <section id="rv-sp-dogmatica" class="rv-sp-pane" role="tabpanel" hidden></section>
        </div>`;
      document.body.appendChild(root);
    }
    return root;
  }

  function switchStudyTab(tabId) {
    const map = {
      tsk: 'tsk',
      comentarios: 'comentarios',
      comentario: 'comentarios',
      commentary: 'comentarios',
      concordancia: 'concordancia',
      concordance: 'concordancia',
      tematica: 'concordancia',
      strong: 'strong',
      lexico: 'strong',
      lexicon: 'strong',
      dogmatica: 'dogmatica',
      lentes: 'dogmatica',
      lente: 'dogmatica',
      lens: 'dogmatica',
      xref: 'tsk',
    };
    currentTab = map[tabId] || tabId || 'comentarios';
    if (currentTab === 'dogmatica' || currentTab === 'lentes' || tabId === 'lentes') {
      currentTab = 'dogmatica';
    }
    const root = ensureStudyPanelRoot();
    root.querySelectorAll('[data-sp-tab]').forEach((btn) => {
      const tabKey = btn.dataset.spTab;
      const on = tabKey === currentTab || map[tabKey] === currentTab || (tabKey === 'lentes' && currentTab === 'dogmatica');
      btn.classList.toggle('is-on', on);
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    ['comentarios', 'tsk', 'concordancia', 'strong', 'dogmatica'].forEach((id) => {
      const pane = document.getElementById(`rv-sp-${id}`);
      if (!pane) return;
      pane.classList.toggle('is-on', id === currentTab);
      pane.hidden = id !== currentTab;
    });
    const tabConcordanciaEl = document.getElementById('tab-concordancia');
    if (tabConcordanciaEl) {
      const parentPane = tabConcordanciaEl.closest('.rv-sp-pane');
      if (parentPane) {
        parentPane.classList.toggle('is-on', currentTab === 'concordancia');
        parentPane.hidden = currentTab !== 'concordancia';
      }
    }
    const tabLentesEl = document.getElementById('tab-lentes');
    if (tabLentesEl) {
      const parentPane = tabLentesEl.closest('.rv-sp-pane');
      if (parentPane) {
        parentPane.classList.toggle('is-on', currentTab === 'dogmatica');
        parentPane.hidden = currentTab !== 'dogmatica';
      }
    }
    loadActiveTab();
  }

  function createApi() {
    const root = ensureStudyPanelRoot();

    const setTab = switchStudyTab;

    const render = async (ref) => {
      if (ref) setStudyContext(ref);
      renderTabPanes();
      await loadActiveTab();
    };

    const open = async (opts = {}) => {
      const { tab = 'comentarios', ref } = opts;
      if (ref) setStudyContext(ref);
      else {
        const study = global.currentStudyState || RV.currentStudyState;
        if (study?.ref) setStudyContext(study.ref);
        else if (study?.book) setStudyContext(`${study.book} ${study.chapter || 1}:${study.verse || 1}`);
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
      const id = event.target?.id;
      if (id !== 'rv-sp-autor' && id !== 'commentary-author-select') return;
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
      const retry = event.target.closest('[data-sp-retry-commentary]');
      if (retry) {
        loadCommentaryForVerse(retry.dataset.ref, retry.dataset.author, retry.dataset.text || '');
        return;
      }
      const trBtn = event.target.closest('[data-rv-tr-toggle]');
      if (trBtn) {
        const trRoot = trBtn.closest('[data-rv-tr-root]');
        const es = trRoot?.querySelector('[data-rv-tr-pane="es"]');
        const en = trRoot?.querySelector('[data-rv-tr-pane="en"]');
        if (es && en) {
          const showEn = Boolean(es.hidden);
          es.hidden = !showEn;
          en.hidden = showEn;
        }
        return;
      }
      const closeLens = event.target.closest('[data-sp-lens-close]');
      if (closeLens) {
        document.getElementById(`lens-result-${closeLens.dataset.spLensClose}`)?.remove();
        return;
      }
      const lensBtn = event.target.closest('[data-sp-lens-id]');
      if (lensBtn) {
        event.preventDefault();
        triggerEliteLens(lensBtn.dataset.spLensId, lensBtn.dataset.spLensTitle);
        return;
      }
      const tab = event.target.closest('[data-sp-tab]')?.dataset?.spTab;
      if (tab) setTab(tab);
    });

    document.addEventListener('revelatio:open-study-panel', (event) => open(event.detail || {}));
    document.addEventListener('revelatio:verse-selected', (event) => {
      const d = event.detail || {};
      if (d.ref) syncStudyPanelToVerse(d.ref, d.text || '');
    });
    document.addEventListener('revelatio:passage-ready', (event) => {
      const d = event.detail || {};
      const ref = d.ref || (d.book ? `${d.book} ${d.chapter || 1}:${d.verse || 1}` : '');
      if (ref) setStudyContext(ref, d.text || d.verseText || '');
    });
    document.addEventListener('revelatio:active-passage', (event) => {
      const d = event.detail || {};
      const ref = d.ref || (d.book ? `${d.book} ${d.chapter || 1}:${d.verse || 1}` : '');
      if (ref) syncStudyPanelToVerse(ref, d.text || d.verseText || '');
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && root.classList.contains('is-open')) close();
    });

    const btnStudy = document.getElementById('btn-study-panel');
    if (btnStudy) btnStudy.addEventListener('click', (e) => { e.preventDefault(); open({ tab: 'comentarios' }); });

    global.loadVerseCommentary = (book, chapter, verse) => {
      syncStudyPanelToVerse(`${book} ${chapter}:${verse || 1}`, '');
    };

    RV.setStudyContext = setStudyContext;
    RV.setStudyPassage = setStudyContext;
    RV.syncStudyPanelToVerse = syncStudyPanelToVerse;
    RV.fetchCommentary = fetchCommentary;
    RV.loadCommentaryForVerse = loadCommentaryForVerse;
    RV.loadTskReferences = loadTskReferences;
    RV.fetchTsk = loadTskReferences;
    RV.loadConcordance = loadConcordance;
    RV.executeConcordanceSearch = executeConcordanceSearch;
    RV.setQuickConcordanceTag = setQuickConcordanceTag;
    RV.searchCustomConcordance = executeConcordanceSearch;
    RV.switchStudyTab = switchStudyTab;
    RV.loadStrongLexicon = loadStrongLexicon;
    RV.fetchLexicon = loadStrongLexicon;
    RV.openAiWithLens = openAiWithLens;
    RV.triggerEliteLens = triggerEliteLens;
    RV.renderDualLensPanel = renderDualLensPanel;
    RV.renderLentes = renderDualLensPanel;
    RV.switchOpticTab = switchOpticTab;
    RV.ELITE_LENSES = ELITE_LENSES;
    RV.REVELATIO_LENSES = REVELATIO_LENSES;

    return {
      open,
      close,
      render,
      setTab: switchStudyTab,
      switchStudyTab,
      renderLentes: renderDualLensPanel,
      renderDualLensPanel,
      switchOpticTab,
      triggerEliteLens,
      loadConcordance,
      executeConcordanceSearch,
      setQuickConcordanceTag
    };
  }

  function bindCommentarySelectors() {
    const nodes = [
      document.getElementById('commentary-author-select'),
      document.getElementById('rv-sp-autor'),
      document.getElementById('selector-autor'),
      document.getElementById('pop-selector-autor'),
      ...Array.from(document.querySelectorAll('select[name="comentarista"]')),
    ].filter(Boolean);
    nodes.forEach((el) => {
      if (el.dataset.rvCommentaryBound) return;
      el.dataset.rvCommentaryBound = '1';
      el.addEventListener('change', (e) => {
        const activePassage =
          document.getElementById('study-panel-verse-title')?.textContent || currentActivePassage || 'Mateo 16:2';
        currentAutor = e.target.value;
        localStorage.setItem('revelatio_autor', currentAutor);
        loadCommentaryForVerse(activePassage, e.target.value);
      });
    });
  }

  let api = null;
  function mount() {
    if (api) return api;
    api = createApi();
    RV.studyPanel = api;
    return api;
  }

  RV.studyPanel = {
    mount,
    open: (o) => mount().open(o),
    close: () => mount().close(),
    setTab: (t) => mount().setTab(t),
    switchStudyTab: (t) => mount().switchStudyTab(t),
    renderDualLensPanel: () => mount().renderDualLensPanel(),
    switchOpticTab: (t) => mount().switchOpticTab(t),
    triggerEliteLens: (...args) => mount().triggerEliteLens(...args),
    loadConcordance: (...args) => loadConcordance(...args),
    executeConcordanceSearch: (...args) => executeConcordanceSearch(...args),
    setQuickConcordanceTag: (...args) => setQuickConcordanceTag(...args),
  };
  global.setStudyContext = setStudyContext;
  global.setStudyPassage = setStudyContext;
  global.syncStudyPanelToVerse = (...args) => {
    mount();
    return syncStudyPanelToVerse(...args);
  };
  global.loadCommentaryForVerse = (...args) => {
    mount();
    return loadCommentaryForVerse(...args);
  };
  global.loadTskReferences = (...args) => {
    mount();
    return loadTskReferences(...args);
  };
  global.loadConcordance = (...args) => {
    mount();
    return loadConcordance(...args);
  };
  global.executeConcordanceSearch = executeConcordanceSearch;
  global.setQuickConcordanceTag = setQuickConcordanceTag;
  global.searchCustomConcordance = executeConcordanceSearch;
  RV.executeConcordanceSearch = executeConcordanceSearch;
  RV.setQuickConcordanceTag = setQuickConcordanceTag;
  RV.searchCustomConcordance = executeConcordanceSearch;
  global.switchStudyTab = (...args) => {
    mount();
    return switchStudyTab(...args);
  };
  global.switchOpticTab = (...args) => {
    mount();
    return switchOpticTab(...args);
  };
  global.triggerEliteLens = (...args) => {
    mount();
    return triggerEliteLens(...args);
  };
  global.renderDualLensPanel = (...args) => {
    mount();
    return renderDualLensPanel(...args);
  };
  global.openAiWithLens = (...args) => {
    mount();
    return openAiWithLens(...args);
  };
  global.loadStrongLexicon = (...args) => {
    mount();
    return loadStrongLexicon(...args);
  };

  if (typeof window !== 'undefined') {
    window.switchOpticTab = switchOpticTab;
    window.triggerEliteLens = triggerEliteLens;
    window.renderDualLensPanel = renderDualLensPanel;
    window.openAiWithLens = openAiWithLens;
    window.switchStudyTab = switchStudyTab;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      mount();
      bindCommentarySelectors();
    });
  } else {
    mount();
    bindCommentarySelectors();
  }
})(typeof window !== 'undefined' ? window : globalThis);
