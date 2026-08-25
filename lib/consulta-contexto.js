/**
 * Contexto canónico de cualquier consulta: referencia, capítulo, versículo,
 * palabra o tema. Texto real (Bolls) + original Strong, sin anclarse a Romanos.
 */
import {
  parsearReferencia,
  obtenerCapitulo,
  extraerTexto,
  extraerVersos,
  obtenerOriginal,
  originalComoTextoPlano,
  strongsUnicos,
  obtenerDefinicionStrong,
  fetchConTimeout,
  LIBROS,
  VERSIONES,
} from './biblia.js';
import { cargarPack, versosDesdePack } from './versiones.js';
import { glosaEspanol as traducirGlosa, limpiarTextoVerso } from './glosa-es.js';

const STOP = new Set(
  `el la los las un una unos unas de del al a en y o u que se su sus le les lo
   por para con sin sobre entre hasta desde como cuando donde porque pues asi
   este esta estos estas ese esa eso aquel aquella hay ser son fue eran muy
   mas pero sino tambien ya no ni me te nos os yo tu el oh oh jehova
   nunca jamas siempre todos todas este esta`.split(/\s+/)
);

export function foldKey(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseConsultaFlexible(input) {
  if (!input) return null;
  if (typeof input === 'object') {
    const referencia =
      String(input.referencia || input.passage || input.ref || input.consulta || '').trim();
    const book = String(input.book || input.libro || '').trim();
    const chapter = Number(input.chapter || input.capitulo || 0);
    const verse = Number(input.verse || input.verso || 0);
    if (referencia) {
      const parsed = parsearReferencia(referencia) || parsearReferencia(`${referencia} 1`);
      if (parsed) {
        return {
          ...parsed,
          versoInicio: parsed.versoInicio || verse || null,
          versoFin: parsed.versoFin || parsed.versoInicio || verse || null,
          cruda: referencia,
        };
      }
    }
    if (book && chapter > 0) {
      const parsed = parsearReferencia(`${book} ${chapter}${verse ? `:${verse}` : ''}`);
      if (parsed) return { ...parsed, cruda: `${book} ${chapter}${verse ? `:${verse}` : ''}` };
    }
    return null;
  }
  const raw = String(input).trim();
  if (!raw) return null;
  return parsearReferencia(raw) || parsearReferencia(`${raw} 1`);
}

export function etiquetaReferencia(ref) {
  if (!ref?.libro) return '';
  if (ref.versoInicio) {
    const fin = ref.versoFin && ref.versoFin !== ref.versoInicio ? `-${ref.versoFin}` : '';
    return `${ref.libro} ${ref.capitulo}:${ref.versoInicio}${fin}`;
  }
  return `${ref.libro} ${ref.capitulo}`;
}

function mapVersos(raw, versoInicio, versoFin) {
  return extraerVersos(raw, versoInicio, versoFin);
}

export async function obtenerTextoVersion(ref, bolls = 'RV1960') {
  const localKey = String(bolls || 'rv1960').toLowerCase().replace(/[^a-z0-9]/g, '');
  const pack = cargarPack(localKey) || cargarPack('rv1960');
  if (pack) {
    const versosLocal = versosDesdePack(pack, ref.libro, ref.capitulo, ref.versoInicio, ref.versoFin);
    if (versosLocal && versosLocal.length) {
      const versosNorm = versosLocal.map(v => ({ verse: v.n, text: v.texto }));
      const texto = versosLocal.map(v => `${v.n}. ${v.texto}`).join('\n');
      return { versos: versosNorm, texto };
    }
  }

  const raw = await obtenerCapitulo(bolls, ref.libroId, ref.capitulo);
  const versos = mapVersos(raw, ref.versoInicio, ref.versoFin);
  return {
    versos,
    texto: extraerTexto(raw, ref.versoInicio, ref.versoFin),
  };
}

export async function contextoConsulta(input, opts = {}) {
  const ref = parseConsultaFlexible(input);
  const wanted = String(opts.version || 'RV1960').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const versionMeta =
    VERSIONES.find((v) => v.bolls === wanted || v.key.toUpperCase() === wanted) || VERSIONES[0];

  const vacio = {
    ref: ref || null,
    etiqueta: ref ? etiquetaReferencia(ref) : String(input?.passage || input || ''),
    texto: '',
    versos: [],
    original: null,
    planoOriginal: '',
    strongs: [],
    version: versionMeta.etiqueta || versionMeta.bolls,
  };

  if (!ref) return vacio;

  const [principal, original] = await Promise.all([
    obtenerTextoVersion(ref, versionMeta.bolls).catch(() => ({ versos: [], texto: '' })),
    obtenerOriginal({
      ...ref,
      versoInicio: ref.versoInicio || 1,
      versoFin: ref.versoFin || ref.versoInicio || 1,
    }).catch(() => null),
  ]);

  let { versos, texto } = principal;
  if (!versos.length) {
    const fb = await obtenerTextoVersion(ref, 'RV1960').catch(() => ({ versos: [], texto: '' }));
    versos = fb.versos;
    texto = fb.texto;
  }

  const codes = original ? strongsUnicos(original).slice(0, 10) : [];
  const strongs = (
    await Promise.all(codes.map((c) => obtenerDefinicionStrong(c).catch(() => null)))
  ).filter(Boolean);

  return {
    ref,
    etiqueta: etiquetaReferencia(ref),
    texto,
    versos,
    original,
    planoOriginal: original ? originalComoTextoPlano(original) : '',
    strongs,
    version: versionMeta.etiqueta || versionMeta.bolls,
  };
}

function palabrasClave(texto) {
  return String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9ñ\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 5 && !STOP.has(w))
    .slice(0, 4);
}

export async function enriquecerReferenciasConTexto(items = []) {
  const lista = Array.isArray(items) ? items : [];
  return Promise.all(
    lista.map(async (p) => {
      const ya = limpiarTextoVerso(p.texto || p.text || '');
      if (ya.length >= 12) return { ...p, texto: ya };
      const parsed = parseConsultaFlexible(p.ref || p.reference || '');
      if (!parsed) return { ...p, texto: ya };
      try {
        const got = await obtenerTextoVersion(parsed, 'RV1960');
        return { ...p, texto: limpiarTextoVerso(got.texto || '') };
      } catch {
        return { ...p, texto: ya };
      }
    })
  );
}

export async function paralelosReales(texto, opts = {}) {
  const version = opts.bolls || 'RV1960';
  const exclude = foldKey(opts.excludeRef || '');
  const keys = palabrasClave(texto);
  if (!keys.length) return [];
  const seen = new Set();
  const out = [];
  for (const term of keys) {
    const data = await fetchConTimeout(
      `https://bolls.life/find/${version}/?search=${encodeURIComponent(term)}&match_case=false&match_whole=false`,
      {},
      9000
    );
    if (!Array.isArray(data)) continue;
    for (const r of data) {
      const libro = LIBROS[r.book - 1];
      if (!libro) continue;
      const cita = `${libro} ${r.chapter}:${r.verse}`;
      const k = foldKey(cita);
      if (exclude && k === exclude) continue;
      if (seen.has(k)) continue;
      seen.add(k);
      out.push({
        ref: cita,
        texto: limpiarTextoVerso(r.text || r.content || ''),
        nota: `Coincide en «${term}» con el texto consultado.`,
      });
      if (out.length >= 8) return enriquecerReferenciasConTexto(out);
    }
  }
  return enriquecerReferenciasConTexto(out);
}

export function formatearLexico(ctx) {
  const ref = ctx.etiqueta || 'el pasaje';
  if (!ctx.strongs?.length) {
    return (
      `**Léxico Strong de ${ref}**\n\n` +
      (ctx.planoOriginal
        ? `Texto original verificado:\n${ctx.planoOriginal}\n\nAún no hay glosas españolas para estas raíces.`
        : `No se recuperó el texto original (hebreo/griego) de ${ref}. Reintenta en unos segundos.`)
    );
  }
  const bloques = ctx.strongs.map((d, i) => {
    const glosa = traducirGlosa(
      d.traduccionEstricta ||
        d.definicionEs ||
        d.definicionCorta ||
        (d.definicion || '').split('\n')[0] ||
        '',
      d.codigo
    );
    return (
      `${i + 1}. **${d.codigo}** · ${d.lexema || d.lemma || ''} (${d.transliteracion || d.translit || ''})\n` +
      `   **Glosa ES:** ${glosa}\n` +
      `   **Fuente:** ${d.fuente || 'Strong · dominio público'}`
    );
  });
  return `**Léxico Strong de ${ref}** (traducido al español)\n\n${bloques.join('\n\n')}`;
}

export function formatearTsk(ctx, paralelos) {
  const ref = ctx.etiqueta || 'el pasaje';
  const texto = ctx.texto ? `\nTexto: «${ctx.texto}»\n` : '';
  if (!paralelos?.length) {
    return `### Paralelos canónicos de ${ref}${texto}\nNo se hallaron coincidencias textuales verificables en este momento.`;
  }
  const lineas = paralelos.map((p) => {
    const cuerpo = String(p.texto || '').trim();
    if (cuerpo) {
      return `- **${p.ref}**\n  «${cuerpo}»`;
    }
    return `- **${p.ref}** — ${p.nota || ''}`.trim();
  });
  return `### Paralelos canónicos de ${ref}${texto}\n${lineas.join('\n')}`;
}
