/**
 * Éfata RevelatiO — commentary-service.js
 * Normaliza comentarios histórico-exegéticos y aplica la tipografía de lectura.
 */

const AUTHOR_LABEL = {
  'matthew-henry': 'Matthew Henry',
  'charles-spurgeon': 'Charles Spurgeon',
  'jamieson-fausset-brown': 'Jamieson-Fausset-Brown',
  'albert-barnes': 'Albert Barnes',
};

export function authorDisplayName(autorId, fallback = '') {
  return AUTHOR_LABEL[autorId] || fallback || autorId || 'Comentarista';
}

/** Convierte cuerpo plano/markdown ligero en párrafos HTML estructurados. */
export function bodyToHtml(cuerpo) {
  const raw = String(cuerpo || '').trim();
  if (!raw) return '';
  if (/<[a-z][\s\S]*>/i.test(raw)) {
    return raw;
  }
  const escape = (s) =>
    String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const paragraphs = raw
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p class="leading-relaxed">${escape(p).replace(/\n/g, '<br>')}</p>`);

  return paragraphs.join('\n') || `<p class="leading-relaxed">${escape(raw)}</p>`;
}

/**
 * Shell tipográfico del panel de comentarios (dominio público).
 * @param {{ authorName: string, fullTextHtml: string }} commentary
 */
export function renderCommentaryHtml(commentary) {
  const authorName = commentary?.authorName || 'Comentarista';
  const fullTextHtml = commentary?.fullTextHtml || '';
  return `
<div class="space-y-4 font-serif text-[#0F172A] leading-relaxed text-sm sm:text-base selection:bg-[#C59B27]/20 text-justify">
  <div class="flex items-center justify-between pb-2 mb-3 border-b border-[#E8DFC8]">
    <span class="text-xs font-mono font-bold text-[#C59B27] uppercase tracking-wider">${authorName}</span>
    <span class="text-[10px] text-stone-400 font-mono">Dominio Público</span>
  </div>
  <div class="commentary-body text-stone-800 space-y-3">
    ${fullTextHtml}
  </div>
</div>`;
}

/**
 * Normaliza un payload de API/local a { authorName, fullTextHtml }.
 */
export function normalizeCommentary(payload, autorId) {
  const authorName =
    payload?.titulo ||
    payload?.author ||
    payload?.authorName ||
    authorDisplayName(autorId);

  let cuerpo =
    payload?.cuerpo ||
    payload?.texto ||
    payload?.html ||
    payload?.fullText ||
    '';

  if (!cuerpo && Array.isArray(payload?.entradas)) {
    cuerpo = payload.entradas
      .map((e) => e.texto || e.cuerpo || '')
      .filter(Boolean)
      .join('\n\n');
  }

  return {
    authorName,
    fullTextHtml: bodyToHtml(cuerpo),
    plain: String(cuerpo || '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
  };
}

export async function fetchCommentary(ref, autor) {
  try {
    const res = await fetch('/api/comentario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ referencia: ref, autor, author: autor, ref }),
    });
    if (!res.ok) return null;
    const json = await res.json().catch(() => null);
    const data = json?.data || json;
    if (!data) return null;
    return normalizeCommentary(data, autor);
  } catch {
    return null;
  }
}

export default {
  renderCommentaryHtml,
  normalizeCommentary,
  fetchCommentary,
  bodyToHtml,
  authorDisplayName,
};
