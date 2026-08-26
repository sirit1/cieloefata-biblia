/**
 * Concordance: the same engine for every consulted Spanish version's text.
 *
 * PRODUCT LAW (Alejandro): RVR1960 / NVI / DHH / TLA all use this search.
 * Version chooses which text is scanned, never whether the engine runs.
 * Empty only when the term is absent from that version's available text
 * (Bolls, then local pack). No per-passage special cases.
 */
import { fetchConTimeout, resaltarCoincidencia, LIBROS, resolverVersion } from './biblia.js';
import { cargarPack } from './versiones.js';

const MAX_RESULTADOS = 40;

function fold(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function mapBollsHits(data, termino) {
  if (!Array.isArray(data)) return [];
  return data.slice(0, MAX_RESULTADOS).map((r) => {
    const libro = LIBROS[r.book - 1] || null;
    return {
      libro,
      capitulo: r.chapter,
      verso: r.verse,
      ref: libro ? `${libro} ${r.chapter}:${r.verse}` : null,
      html: resaltarCoincidencia(r.text, termino),
    };
  }).filter((r) => r.libro);
}

function buscarEnPack(pack, termino) {
  const needle = fold(termino);
  if (!needle || !pack?.libros) return [];
  const out = [];
  for (const [libro, caps] of Object.entries(pack.libros)) {
    if (!caps || typeof caps !== 'object') continue;
    for (const [cap, versos] of Object.entries(caps)) {
      if (!versos || typeof versos !== 'object') continue;
      for (const [n, texto] of Object.entries(versos)) {
        const t = String(texto || '');
        if (!t || !fold(t).includes(needle)) continue;
        out.push({
          libro,
          capitulo: Number(cap),
          verso: Number(n),
          ref: `${libro} ${cap}:${n}`,
          html: resaltarCoincidencia(t, termino),
        });
        if (out.length >= MAX_RESULTADOS) return out;
      }
    }
  }
  return out;
}

export async function obtenerConcordancia({ termino, version } = {}) {
  const q = String(termino || '').trim();
  const meta = resolverVersion(version);
  const url = `https://bolls.life/find/${meta.bolls}/?search=${encodeURIComponent(q)}&match_case=false&match_whole=false`;
  const data = await fetchConTimeout(url, {}, 9000);
  let resultados = mapBollsHits(data, q);
  let fuente = 'bolls';
  if (!resultados.length) {
    const local = buscarEnPack(cargarPack(meta.key), q);
    if (local.length) {
      resultados = local;
      fuente = 'pack';
    }
  }
  const total = Array.isArray(data) ? data.length : resultados.length;
  return {
    success: true,
    data: {
      termino: q,
      version: meta.key,
      etiqueta: meta.etiqueta,
      total,
      resultados,
      fuente,
    },
  };
}
