/**
 * Cliente unificado del motor de estudio.
 * Comentario → /api/commentary (corpus)
 * TSK → /api/tsk (nunca Gemini)
 * Léxico → /api/lexico
 * PRODUCT LAW (Alejandro): TSK / commentary / lexicon / lenses — any passage.
 * Lentes timeout 45s globally. Concordance is GET /api/concordancia, never IA.
 */
(function (global) {
  'use strict';

  const AUTHOR_MAP = {
    'matthew-henry': 'Matthew Henry',
    'charles-spurgeon': 'C. H. Spurgeon',
    'jamieson-fausset-brown': 'Jamieson-Fausset-Brown',
    'juan-calvino': 'Juan Calvino',
    'john-gill': 'John Gill',
    henry: 'Matthew Henry',
    spurgeon: 'C. H. Spurgeon',
    calvin: 'Juan Calvino',
    calvino: 'Juan Calvino',
    gill: 'John Gill',
    jfb: 'Jamieson-Fausset-Brown',
  };

  function resolveAuthor(raw) {
    const key = String(raw || '').trim().toLowerCase();
    return AUTHOR_MAP[key] || raw || 'C. H. Spurgeon';
  }

  function extractAnswer(data) {
    const raw =
      data?.answer ||
      data?.respuesta ||
      data?.result ||
      data?.text ||
      data?.commentary?.text ||
      data?.cuerpo ||
      data?.data?.cuerpo ||
      (typeof data?.data === 'string' ? data.data : '');
    return String(raw || '').trim();
  }

  async function postJson(url, body, timeoutMs = 18000) {
    const controller = timeoutMs ? new AbortController() : null;
    const timer = timeoutMs ? setTimeout(() => controller.abort(), timeoutMs) : null;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body),
        signal: controller?.signal,
      });
      const data = await res.json().catch(() => ({}));
      return { ok: res.ok, data };
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  async function askStudyEngine({ passage, mode = 'commentary', author, lensTitle, prompt } = {}) {
    const ref = String(passage || '').trim();
    if (!ref) throw new Error('Pasaje no definido.');
    const type = String(mode || 'commentary').toLowerCase();
    let lastError = null;

    if (type === 'commentary' || type === 'comentario' || type === 'exegesis') {
      try {
        const { ok, data } = await postJson('/api/commentary', {
          passage: ref,
          referencia: ref,
          autor: author,
          author: resolveAuthor(author),
          verseText: global.activeStudyText || '',
        }, 18000);
        const answer = String(data?.textEs || data?.text || extractAnswer(data) || '').trim();
        if (ok && data?.success && answer) {
          return { success: true, answer, source: data.source || 'corpus', raw: data };
        }
        if (answer) {
          return { success: true, answer, source: data.source || 'corpus-miss', raw: data };
        }
        lastError = new Error(data?.error || 'Error al procesar la solicitud');
      } catch (err) {
        lastError = err;
      }
      throw lastError || new Error('Sin nota de corpus.');
    }

    if (type === 'tsk' || type === 'xref' || type === 'cross') {
      const version = (typeof localStorage !== 'undefined' && localStorage.getItem('revelatio_version')) || 'rv1960';
      const { ok, data } = await postJson('/api/tsk', {
        consulta: ref,
        passage: ref,
        referencia: ref,
        version,
      }, 18000);
      const lista = data?.data?.referencias || data?.referencias || [];
      if (ok && lista.length) {
        const answer = lista
          .map((x) => {
            const cita = x.ref || x.reference;
            const cuerpo = String(x.texto || x.text || '').trim();
            if (cuerpo) return `- **${cita}**\n  «${cuerpo}»`;
            return `- **${cita}** — ${x.nota || x.description || ''}`;
          })
          .join('\n');
        return { success: true, answer, source: data?.fuente || 'tsk-open-cross-ref', raw: data };
      }
      return {
        success: true,
        answer: `No hay referencias TSK catalogadas para ${ref}.`,
        source: 'tsk-open-cross-ref',
        raw: data,
      };
    }

    if (type === 'lexicon' || type === 'lexico' || type === 'strong') {
      const { ok, data } = await postJson('/api/lexico', {
        passage: ref,
        referencia: ref,
      }, 18000);
      const answer = extractAnswer(data);
      if (ok && answer) return { success: true, answer, source: data.source || 'lexicon', raw: data };
      throw new Error(data?.error || 'Léxico sin resultado.');
    }

    if (type === 'concordance' || type === 'concordancia' || type === 'thematic') {
      throw new Error('La concordancia usa GET /api/concordancia. La IA no inventa coincidencias.');
    }

    const endpoints =
      type === 'lens' || type === 'lente' || type === 'vida' || type === 'elite_lens' || type === 'elite'
        ? ['/api/study-engine', '/api/lente-elite', '/api/lente']
        : ['/api/study-engine'];

    for (const url of endpoints) {
      try {
        const lensCall = type === 'lens' || type === 'lente' || type === 'vida' || type === 'elite_lens' || type === 'elite';
        const { data } = await postJson(url, {
          passage: ref,
          ref,
          referencia: ref,
          mode: type,
          type,
          author: resolveAuthor(author),
          autor: author,
          lensTitle,
          prompt,
        }, lensCall ? 45000 : 18000);
        const answer = extractAnswer(data);
        if (data.success !== false && answer) {
          return { success: true, answer, source: data.source || url, raw: data };
        }
        lastError = new Error(data.error || `Sin respuesta (${url})`);
      } catch (err) {
        lastError = err;
      }
    }

    throw lastError || new Error('Motor de estudio no disponible.');
  }

  function answerToParagraphs(answer) {
    return String(answer || '')
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean);
  }

  function parseTskItems(answer) {
    const lines = String(answer || '').split('\n').map((l) => l.trim()).filter(Boolean);
    const items = [];
    for (const line of lines) {
      const m = line.match(/^[-*•]\s*(?:\*\*)?([^—–\-:]+?)(?:\*\*)?\s*[—–\-:]\s*(.+)$/);
      if (m) {
        items.push({ ref: m[1].trim(), nota: m[2].trim() });
        continue;
      }
      const refOnly = line.match(/^[-*•]\s*(.+)$/);
      if (refOnly) items.push({ ref: refOnly[1].replace(/\*\*/g, '').trim(), nota: '' });
    }
    if (items.length) return items;
    return answerToParagraphs(answer).map((t) => ({ ref: '', nota: t }));
  }

  const api = { askStudyEngine, resolveAuthor, answerToParagraphs, parseTskItems };
  global.RV = global.RV || {};
  global.RV.StudyEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);
