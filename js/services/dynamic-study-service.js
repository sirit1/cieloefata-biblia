/**
 * Éfata RevelatiO — dynamic-study-service.js
 * Cliente del motor universal (/api/ai, /api/exegesis, /api/tsk, /api/lexicon, /api/lente).
 */

async function postStudy(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body || {}),
  });
  const json = await res.json().catch(() => ({}));
  const answer =
    json?.answer ||
    json?.respuesta ||
    json?.result ||
    (typeof json?.data === 'string' ? json.data : '') ||
    json?.data?.comentarioExpositivo ||
    '';
  if (!res.ok && !String(answer).trim()) {
    throw new Error(json?.error || `HTTP ${res.status}`);
  }
  return {
    success: Boolean(json?.success !== false && String(answer).trim()),
    answer: String(answer || '').trim(),
    raw: json,
    source: json?.source || url,
  };
}

export async function fetchDynamicCommentary(passage, author) {
  const endpoints = [
    { url: '/api/exegesis', type: 'commentary' },
    { url: '/api/ai', type: 'commentary' },
  ];
  let lastErr = null;
  for (const ep of endpoints) {
    try {
      const hit = await postStudy(ep.url, {
        passage,
        author,
        autor: author,
        type: ep.type,
        prompt: `Exposición exegética de ${passage}`,
      });
      if (hit.answer) return hit;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error('Sin exposición dinámica');
}

export async function fetchDynamicTsk(passage) {
  const endpoints = ['/api/tsk', '/api/ai'];
  let lastErr = null;
  for (const url of endpoints) {
    try {
      const hit = await postStudy(url, {
        passage,
        type: 'tsk',
        prompt: `Referencias cruzadas TSK para ${passage}`,
      });
      if (hit.answer) return hit;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error('Sin TSK dinámico');
}

export async function fetchDynamicLexicon(passage) {
  const endpoints = ['/api/lexicon', '/api/ai'];
  let lastErr = null;
  for (const url of endpoints) {
    try {
      const hit = await postStudy(url, {
        passage,
        type: 'lexicon',
        prompt: `Léxico Strong de ${passage}`,
      });
      if (hit.answer) return hit;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error('Sin léxico dinámico');
}

export async function fetchDynamicLens({ prompt, passage, lensTitle, lensId }) {
  const endpoints = ['/api/lente', '/api/ai'];
  let lastErr = null;
  for (const url of endpoints) {
    try {
      const hit = await postStudy(url, {
        prompt,
        passage,
        lensTitle,
        lensId,
        type: 'lens',
      });
      if (hit.answer) return hit;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error('Sin dictamen de lente');
}

const api = {
  fetchDynamicCommentary,
  fetchDynamicTsk,
  fetchDynamicLexicon,
  fetchDynamicLens,
};

export default api;

if (typeof window !== 'undefined') {
  window.RV = window.RV || {};
  window.RV.DynamicStudy = api;
}
