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
const remoteAlive = new Map();

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

function packTieneTexto(pack) {
  const books = pack?.libros;
  if (!books || typeof books !== 'object') return false;
  return Object.values(books).some((caps) => caps && typeof caps === 'object' && Object.keys(caps).length > 0);
}

/**
 * Probe whether Bolls hosts this version's text.
 * Caches only a completed JSON response (true/false). Timeouts and HTTP
 * errors return null and are not cached — a warm instance must not freeze
 * a transient outage as «sin texto indexable».
 * @returns {Promise<boolean|null>}
 */
async function bollsSirveTexto(bolls) {
  const key = String(bolls || '');
  if (remoteAlive.has(key)) return remoteAlive.get(key);
  const ch = await fetchConTimeout(`https://bolls.life/get-chapter/${key}/40/1/`, {}, 8000);
  if (!Array.isArray(ch)) return null;
  const ok = ch.length > 0;
  remoteAlive.set(key, ok);
  return ok;
}

export async function obtenerConcordancia({ termino, version } = {}) {
  const q = String(termino || '').trim();
  const meta = resolverVersion(version);
  const url = `https://bolls.life/find/${meta.bolls}/?search=${encodeURIComponent(q)}&match_case=false&match_whole=false`;
  const data = await fetchConTimeout(url, {}, 9000);
  const bollsFailed = data == null;
  let resultados = mapBollsHits(data, q);
  let fuente = 'bolls';
  const pack = cargarPack(meta.key);
  if (!resultados.length) {
    const local = buscarEnPack(pack, q);
    if (local.length) {
      resultados = local;
      fuente = 'pack';
    }
  }
  if (resultados.length) {
    return {
      success: true,
      data: {
        termino: q,
        version: meta.key,
        etiqueta: meta.etiqueta,
        total: Array.isArray(data) ? data.length : resultados.length,
        resultados,
        fuente,
        indexable: true,
      },
    };
  }

  const packOk = packTieneTexto(pack);

  // Search HTTP/timeout with no local text: never report «0 coincidencias».
  // Prove the slug is unhosted (completed empty JSON) → indexable:false.
  // Hosted-but-search-failed, or probe also failed → 502.
  if (bollsFailed && !packOk) {
    const remote = await bollsSirveTexto(meta.bolls);
    if (remote === false) {
      return {
        success: true,
        data: {
          termino: q,
          version: meta.key,
          etiqueta: meta.etiqueta,
          total: 0,
          resultados: [],
          fuente: 'bolls',
          indexable: false,
        },
      };
    }
    throw new Error('bolls-unavailable');
  }

  // Find already returned a completed empty list. Probe only sets indexable.
  // Null probe (timeout) must not override a successful empty search.
  const remote = packOk ? true : await bollsSirveTexto(meta.bolls);
  const indexable = packOk || remote !== false;
  return {
    success: true,
    data: {
      termino: q,
      version: meta.key,
      etiqueta: meta.etiqueta,
      total: Array.isArray(data) ? data.length : 0,
      resultados: [],
      fuente: packOk ? 'pack' : 'bolls',
      indexable,
    },
  };
}
