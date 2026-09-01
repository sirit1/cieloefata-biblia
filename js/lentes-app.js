/**
 * Lentes RevelatiO — cliente de los cinco oficios.
 * Pinta título + análisis estricto bajo cada oferta.
 * Henry nunca es el cuerpo. Glosa no declara timeout.
 */
(function (global) {
  'use strict';

  const FETCH_MS = 25000;

  const OFICIOS = [
    {
      id: 'palabra',
      oficio: 'Palabra',
      titulo: 'Texto abierto',
      tags: ['exégesis', 'hermenéutica', 'lenguas'],
      topics: ['Exégesis', 'Hermenéutica', 'Lenguas'],
      beats: ['glosa'],
    },
    {
      id: 'evangelio',
      oficio: 'Evangelio',
      titulo: 'Cristo y la gracia',
      tags: ['cristología', 'soteriología'],
      topics: ['Cristología', 'Soteriología'],
      beats: [],
    },
    {
      id: 'hilo',
      oficio: 'Hilo',
      titulo: 'El pacto',
      tags: ['teología bíblica', 'alianzas'],
      topics: ['Teología bíblica', 'Alianzas'],
      beats: ['tsk'],
    },
    {
      id: 'objecion',
      oficio: 'Objeción',
      titulo: 'Apologética',
      tags: ['defensa de la fe', 'cosmovisión'],
      topics: ['Defensa de la fe', 'Cosmovisión'],
      beats: [],
    },
    {
      id: 'bucle',
      oficio: 'Bucle',
      titulo: 'Ciencia y mente',
      tags: ['neurociencia', 'psicología', 'inteligencia emocional', 'neuroplasticidad', 'metanoia'],
      topics: ['Neurociencia', 'Psicología', 'Inteligencia emocional', 'Neuroplasticidad', 'Metanoia'],
      beats: [],
    },
  ];

  function officeOf(idOrTitle) {
    const s = String(idOrTitle || '').trim().toLowerCase();
    if (!s) return null;
    return (
      OFICIOS.find(
        (o) =>
          o.id === s ||
          o.oficio.toLowerCase() === s ||
          o.titulo.toLowerCase() === s
      ) || null
    );
  }

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function paragraphsHtml(text) {
    const t = String(text || '').trim();
    if (!t) return '';
    return t
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
      .join('');
  }

  function localAnalysis(office, topic, ref, texto) {
    const cita = texto ? `«${texto}»` : `el testimonio de ${ref}`;
    const pack = {
      Exégesis: `La exégesis de ${ref} parte del texto. ${cita} se lee en género, contexto e intención del autor bajo el Espíritu. El léxico sirve; no sustituye el argumento.`,
      Hermenéutica: `Hermenéutica: la Escritura interpreta la Escritura. ${cita} en ${ref} se lee en Cristo (Lc 24:27) distinguiendo indicativo e imperativo.`,
      Lenguas: `Lenguas de ${ref}: ${cita} se pesa en el original cuando está verificado. Strong afina; no inventa.`,
      Cristología: `Cristología: ${ref} testifica del Hijo. ${cita} converge en la cruz y la persona de Cristo.`,
      Soteriología: `Soteriología: ${cita} anuncia gracia, no mérito. Lo que ${ref} manda, la cruz capacita.`,
      'Teología bíblica': `Teología bíblica: ${ref} es eslabón del canon. ${cita} se lee en creación, caída, redención y consumación.`,
      Alianzas: `Alianzas: ${cita} en ${ref} se sostiene en los pactos, cumplidos en la sangre del nuevo pacto.`,
      'Defensa de la fe': `Defensa de la fe: ${ref} es revelación pública. ${cita} se responde con mansedumbre, sin ceder la cruz.`,
      Cosmovisión: `Cosmovisión: ${cita} en ${ref} enfrenta el yo autónomo con el Señorío de Cristo.`,
      Neurociencia: `Neurociencia describe correlatos de ${ref} (atención, hábito). No prueba la doctrina ni inventa autores clínicos.`,
      Psicología: `Psicología cristiana: ${cita} nombra patrones para llevarlos a Cristo. La Escritura es autoridad.`,
      'Inteligencia emocional': `Inteligencia emocional bíblica: ${ref} ordena el afecto bajo el Espíritu, no bajo el yo.`,
      Neuroplasticidad: `Neuroplasticidad ilustra por qué meditar ${ref} forma hábito. La metanoia no es técnica de bienestar.`,
      Metanoia: `Metanoia: ${cita} llama a cambio de mente (Ro 12:2). Arrepentimiento y fe, no cosmética.`,
    };
    return pack[topic] || `Análisis RevelatiO de ${topic} en ${ref}: ${cita}.`;
  }

  function localConclusion(office, ref, texto) {
    const cita = texto ? `«${texto}»` : ref;
    if (office.id === 'bucle') {
      return `Conclusión Revelatio: ${ref} renueva la mente. ${cita} une diseño creado y metanoia bajo la Palabra.`;
    }
    return `Conclusión Revelatio: ${office.titulo} lee ${ref}. ${cita} permanece bajo el Padre, el Hijo y el Espíritu.`;
  }

  function localPayload(office, ref, texto) {
    return {
      id: office.id,
      oficio: office.oficio,
      titulo: office.titulo,
      tags: office.tags,
      topics: office.topics.map((title) => ({
        title,
        analysis: localAnalysis(office, title, ref, texto),
      })),
      conclusion: localConclusion(office, ref, texto),
      beats:
        office.id === 'palabra'
          ? { glosa: `Glosa: léxico Strong del pasaje ${ref}, cuando el original está cargado. No hay timeout: si falta la raíz, se declara la ausencia.` }
          : office.id === 'hilo'
            ? { tsk: `TSK de ${ref}: paralelos de pacto (Gn 12; Ex 19; 2 S 7; Jr 31; Lc 22; Heb 8).` }
            : {},
      citation: null,
      corpusLabel: null,
      henryClip: null,
      source: 'revelatio-local',
    };
  }

  function isUsableOficio(data, office) {
    if (!data || typeof data !== 'object') return false;
    const topics = Array.isArray(data.topics) ? data.topics : [];
    if (topics.length < office.topics.length) return false;
    return office.topics.every((title) => {
      const hit = topics.find((t) => String(t?.title || '').trim() === title);
      return hit && String(hit.analysis || '').trim().length > 40;
    });
  }

  function normalizePayload(office, raw, ref, texto) {
    const base = localPayload(office, ref, texto);
    const data = raw?.oficio || raw?.data || raw;
    if (!isUsableOficio(data, office)) return base;
    const topics = office.topics.map((title) => {
      const hit = (data.topics || []).find((t) => String(t?.title || '').trim() === title);
      const analysis = String(hit?.analysis || '').trim();
      return {
        title,
        analysis: analysis.length > 40 ? analysis : localAnalysis(office, title, ref, texto),
      };
    });
    let conclusion = String(data.conclusion || '').trim();
    if (!/^conclusi[oó]n revelatio/i.test(conclusion)) {
      conclusion = conclusion
        ? `Conclusión Revelatio: ${conclusion}`
        : localConclusion(office, ref, texto);
    }
    const citation = data.citation && data.citation.texto ? data.citation : null;
    const henryClip = citation ? citation.texto : null;
    return {
      ...base,
      topics,
      conclusion,
      beats: {
        glosa: office.id === 'palabra' ? data.beats?.glosa || base.beats.glosa : undefined,
        tsk: office.id === 'hilo' ? data.beats?.tsk || base.beats.tsk : undefined,
      },
      citation,
      corpusLabel: citation ? citation.autor || null : null,
      henryClip,
      source: data.source || raw?.source || 'revelatio-ia',
    };
  }

  function paint(office, payload, host) {
    const box = host || document.getElementById(`oficio-${office.id}`);
    if (!box) return;
    const usable = isUsableOficio(payload, office) ? payload : localPayload(office, payload?.ref || '', '');
    const topicsHtml = office.topics
      .map((title) => {
        const hit = (usable.topics || []).find((t) => t.title === title);
        const analysis = hit?.analysis || localAnalysis(office, title, '', '');
        return `<section class="rv-oficio-topic" data-topic="${escapeHtml(title)}">
          <h4 class="rv-oficio-topic-title">${escapeHtml(title)}</h4>
          <div class="rv-oficio-analysis">${paragraphsHtml(analysis)}</div>
        </section>`;
      })
      .join('');

    let beatsHtml = '';
    if (office.id === 'palabra') {
      const glosa = usable.beats?.glosa || 'Glosa: raíces Strong del pasaje, en español.';
      beatsHtml += `<section class="rv-oficio-beat" data-beat="glosa">
        <h4 class="rv-oficio-topic-title">Glosa</h4>
        <div class="rv-oficio-analysis">${paragraphsHtml(glosa)}</div>
      </section>`;
    }
    if (office.id === 'hilo') {
      const tsk = usable.beats?.tsk || '';
      if (tsk) {
        beatsHtml += `<section class="rv-oficio-beat" data-beat="tsk">
          <h4 class="rv-oficio-topic-title">TSK</h4>
          <div class="rv-oficio-analysis">${paragraphsHtml(tsk)}</div>
        </section>`;
      }
    }

    const citationHtml =
      usable.citation && usable.henryClip
        ? `<footer class="rv-oficio-cita">Cita · ${escapeHtml(usable.citation.autor || 'Matthew Henry')}: «${escapeHtml(usable.henryClip)}»</footer>`
        : '';

    box.innerHTML = `
      <header class="rv-oficio-head">
        <p class="rv-oficio-kicker">${escapeHtml(office.oficio)}</p>
        <h3 class="rv-oficio-title">${escapeHtml(office.titulo)}</h3>
        <p class="rv-oficio-tags">${office.tags.map((t) => escapeHtml(t)).join(' · ')}</p>
      </header>
      ${topicsHtml}
      ${beatsHtml}
      <section class="rv-oficio-cierre" data-topic="Conclusión Revelatio">
        <h4 class="rv-oficio-topic-title">Conclusión Revelatio</h4>
        <div class="rv-oficio-analysis">${paragraphsHtml(usable.conclusion)}</div>
      </section>
      ${citationHtml}
    `;
    box.classList.add('is-ready');
    box.dataset.source = usable.source || '';
  }

  function skeleton(office, ref) {
    return `<article class="rv-oficio-ficha" id="oficio-${office.id}" data-oficio="${office.id}" data-titulo="${escapeHtml(office.titulo)}">
      <header class="rv-oficio-head">
        <p class="rv-oficio-kicker">${escapeHtml(office.oficio)}</p>
        <h3 class="rv-oficio-title">${escapeHtml(office.titulo)}</h3>
        <p class="rv-oficio-tags">${office.tags.map((t) => escapeHtml(t)).join(' · ')}</p>
      </header>
      ${office.topics
        .map(
          (title) => `<section class="rv-oficio-topic" data-topic="${escapeHtml(title)}">
        <h4 class="rv-oficio-topic-title">${escapeHtml(title)}</h4>
        <p class="rv-oficio-wait">RevelatiO analiza ${escapeHtml(title)} en ${escapeHtml(ref)}…</p>
      </section>`
        )
        .join('')}
    </article>`;
  }

  async function fetchOficios(passage, verseText, signal) {
    const res = await fetch('/api/lentes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      signal,
      body: JSON.stringify({
        passage,
        verseText,
        all: true,
        oficios: 'all',
        mode: 'oficios',
        type: 'oficios',
      }),
    });
    const data = await res.json().catch(() => ({}));
    return data;
  }

  async function mount(opts = {}) {
    const passage = String(opts.passage || global.activeStudyPassage || 'Romanos 12:2').trim();
    const verseText = String(opts.verseText || global.activeStudyText || '').trim();
    const container =
      opts.container ||
      document.getElementById('lentes-content-area') ||
      document.getElementById('tab-lentes');
    if (!container) return;

    container.innerHTML = `
      <div class="rv-oficios" id="rv-oficios" data-passage="${escapeHtml(passage)}">
        <p class="rv-oficios-lead">Cinco oficios · análisis RevelatiO de ${escapeHtml(passage)}</p>
        ${OFICIOS.map((o) => skeleton(o, passage)).join('')}
      </div>`;

    OFICIOS.forEach((office) => {
      paint(office, localPayload(office, passage, verseText), document.getElementById(`oficio-${office.id}`));
    });

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_MS);
    try {
      const data = await fetchOficios(passage, verseText, controller.signal);
      const lista = Array.isArray(data?.oficios)
        ? data.oficios
        : Array.isArray(data?.data)
          ? data.data
          : [];
      OFICIOS.forEach((office) => {
        const raw = lista.find((o) => o.id === office.id) || data?.oficio;
        const payload = normalizePayload(office, raw ? { oficio: raw, source: data.source } : data, passage, verseText);
        paint(office, payload, document.getElementById(`oficio-${office.id}`));
      });
    } catch (_err) {
      OFICIOS.forEach((office) => {
        paint(office, localPayload(office, passage, verseText), document.getElementById(`oficio-${office.id}`));
      });
    } finally {
      clearTimeout(timer);
    }
  }

  const api = { OFICIOS, officeOf, paint, mount, FETCH_MS };
  global.RV = global.RV || {};
  global.RV.Lentes = api;
  global.RevelatioLentes = api;
})(typeof window !== 'undefined' ? window : globalThis);
