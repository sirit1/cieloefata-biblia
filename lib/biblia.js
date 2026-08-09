// Helpers compartidos para trabajar con texto bíblico REAL (no generado por
// IA) desde Bolls Bible (bolls.life), API pública gratuita y sin clave.
// Se usa tanto para el lector (api/pasaje.js) como para dar contexto real
// -textos originales + Strong's- al motor exegético (api/exegesis.js), en
// lugar de que la IA "recuerde" el griego/hebreo de memoria.

// Los 66 libros en el orden canónico protestante = numeración 1-66 de Bolls.
// Índices 0-38 = Antiguo Testamento (39 libros), 39-65 = Nuevo Testamento (27).
export const LIBROS = [
  'Génesis', 'Éxodo', 'Levítico', 'Números', 'Deuteronomio', 'Josué', 'Jueces', 'Rut', '1 Samuel', '2 Samuel',
  '1 Reyes', '2 Reyes', '1 Crónicas', '2 Crónicas', 'Esdras', 'Nehemías', 'Ester', 'Job', 'Salmos', 'Proverbios',
  'Eclesiastés', 'Cantares', 'Isaías', 'Jeremías', 'Lamentaciones', 'Ezequiel', 'Daniel', 'Oseas', 'Joel', 'Amós',
  'Abdías', 'Jonás', 'Miqueas', 'Nahúm', 'Habacuc', 'Sofonías', 'Hageo', 'Zacarías', 'Malaquías',
  'Mateo', 'Marcos', 'Lucas', 'Juan', 'Hechos', 'Romanos', '1 Corintios', '2 Corintios', 'Gálatas', 'Efesios',
  'Filipenses', 'Colosenses', '1 Tesalonicenses', '2 Tesalonicenses', '1 Timoteo', '2 Timoteo', 'Tito', 'Filemón',
  'Hebreos', 'Santiago', '1 Pedro', '2 Pedro', '1 Juan', '2 Juan', '3 Juan', 'Judas', 'Apocalipsis'
];

export const INDICE_NT_INICIO = 39; // libroId 40 (Mateo) en adelante es Nuevo Testamento.

// Catálogo real de versiones en español disponibles vía Bolls (sin clave, gratis).
// Fuente única: la usan tanto el lector de capítulos (api/pasaje.js) como la
// concordancia (api/concordancia.js), para no duplicar los códigos de Bolls.
export const VERSIONES = [
  { key: 'rv1960', bolls: 'RV1960', etiqueta: 'RVR 1960' },
  { key: 'nvi', bolls: 'NVI', etiqueta: 'NVI' },
  { key: 'ntv', bolls: 'NTV', etiqueta: 'NTV' },
  { key: 'lbla', bolls: 'LBLA', etiqueta: 'LBLA' },
  { key: 'pdt', bolls: 'PDT', etiqueta: 'PDT' },
  { key: 'btx3', bolls: 'BTX3', etiqueta: 'Biblia Textual' },
  { key: 'rv2004', bolls: 'RV2004', etiqueta: 'RVR Gómez 2004' }
];

// Idiomas originales reales disponibles en Bolls (con números de Strong).
export const ORIGINAL_AT = { bolls: 'WLCa', etiqueta: 'Hebreo · Texto Masorético (Códice de Leningrado, con Strong\'s)', prefijo: 'H' };
export const ORIGINAL_NT = { bolls: 'TISCH', etiqueta: 'Griego · Nuevo Testamento de Tischendorf, 8ª ed. (con Strong\'s)', prefijo: 'G' };
export const SEPTUAGINTA = { bolls: 'LXX', etiqueta: 'Septuaginta (LXX) · griego original' };

// Diccionario léxico real con números de Strong (hebreo y griego combinados).
export const DICCIONARIO_STRONG = { bolls: 'BDBT', nombre: 'Brown-Driver-Briggs (hebreo) / Thayer (griego)' };

const normalizar = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

export function parsearReferencia(ref) {
  const m = String(ref || '').trim().match(/^((?:[1-3]\s+)?[^\d]+?)\s+(\d+)(?::(\d+)(?:-(\d+))?)?\s*$/);
  if (!m) return null;
  const nombre = normalizar(m[1]);
  const idx = LIBROS.findIndex((l) => normalizar(l) === nombre);
  if (idx === -1) return null;
  const capitulo = Number.parseInt(m[2], 10);
  const versoInicio = m[3] ? Number.parseInt(m[3], 10) : null;
  const versoFin = m[4] ? Number.parseInt(m[4], 10) : versoInicio;
  return { libro: LIBROS[idx], libroId: idx + 1, capitulo, versoInicio, versoFin, esAT: idx < INDICE_NT_INICIO };
}

export async function fetchConTimeout(url, opts = {}, ms = 6000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(url, { ...opts, signal: ctrl.signal });
    if (!r.ok) return null;
    return await r.json();
  } catch (_e) {
    return null;
  } finally {
    clearTimeout(t);
  }
}

// Caché en memoria por instancia (best-effort entre invocaciones cálidas).
const cacheCapitulo = new Map();
const TTL_MS = 30 * 60 * 1000;

export async function obtenerCapitulo(bolls, libroId, capitulo) {
  const clave = `${bolls}:${libroId}:${capitulo}`;
  const cacheada = cacheCapitulo.get(clave);
  if (cacheada && Date.now() - cacheada.t < TTL_MS) return cacheada.data;
  const data = await fetchConTimeout(`https://bolls.life/get-chapter/${bolls}/${libroId}/${capitulo}/`);
  if (data) cacheCapitulo.set(clave, { data, t: Date.now() });
  return data;
}

function versosEnRango(versos, versoInicio, versoFin) {
  if (!Array.isArray(versos) || !versos.length) return [];
  if (!versoInicio) return versos;
  return versos.filter((v) => v.verse >= versoInicio && v.verse <= versoFin);
}

// Algunas versiones (ej. PDT en Bolls) traen marcado HTML incrustado en el
// texto del versículo (ej. "<p align='center'><b><i>...</i></b></p>") para
// dar formato a subtítulos o énfasis. Aquí se limpia a texto plano legible,
// conservando el contenido pero descartando las etiquetas.
function limpiarHtmlVerso(texto) {
  return String(texto || '')
    .replace(/<br\s*\/?>/gi, ' ')
    // Los marcadores de nota al pie (ej. NVI: "...habla misterios.<sup>[40]</sup>")
    // solo tienen sentido junto a su nota explicativa, que este lector no muestra.
    // Se eliminan junto con la etiqueta <sup> para no dejar un "[40]" suelto y confuso.
    .replace(/<sup>\s*\[\d+\]\s*<\/sup>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export function extraerTexto(versos, versoInicio, versoFin) {
  const filtrados = versosEnRango(versos, versoInicio, versoFin);
  if (!filtrados.length) return '';
  if (filtrados.length === 1) return limpiarHtmlVerso(filtrados[0].text);
  return filtrados.map((v) => `${v.verse} ${limpiarHtmlVerso(v.text)}`).join(' ');
}

// Igual que extraerTexto, pero devuelve cada versículo como una unidad
// independiente ({n, texto}) en vez de un solo bloque de texto concatenado.
// Es lo que necesita el lector "modo libro" para resaltar, anotar o marcar
// como favorito un versículo puntual dentro de un capítulo completo.
export function extraerVersos(versos, versoInicio, versoFin) {
  const filtrados = versosEnRango(versos, versoInicio, versoFin);
  return filtrados.map((v) => ({ n: v.verse, texto: limpiarHtmlVerso(v.text) }));
}

// Convierte el texto con marcado <S>NUM</S> de Bolls en tokens {palabra, strong}.
// Ej: "Ἦν<S>1510</S> δὲ<S>1161</S>" -> [{palabra:'Ἦν',strong:'G1510'}, {palabra:'δὲ',strong:'G1161'}]
export function tokenizarOriginal(texto, prefijo) {
  const tokens = [];
  const regex = /(\S+?)<S>(\d+)<\/S>/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(texto))) {
    const previo = texto.slice(lastIndex, match.index).trim();
    if (previo) tokens.push({ palabra: previo, strong: null });
    tokens.push({ palabra: match[1], strong: `${prefijo}${match[2]}` });
    lastIndex = regex.lastIndex;
  }
  const resto = texto.slice(lastIndex).trim();
  if (resto) tokens.push({ palabra: resto, strong: null });
  return tokens;
}

// Texto original real (hebreo o griego, con Strong's) + Septuaginta griega
// (solo Antiguo Testamento) para una referencia ya parseada.
export async function obtenerOriginal(ref) {
  const fuente = ref.esAT ? ORIGINAL_AT : ORIGINAL_NT;
  const versos = await obtenerCapitulo(fuente.bolls, ref.libroId, ref.capitulo);
  const filtrados = versosEnRango(versos, ref.versoInicio, ref.versoFin);
  if (!filtrados.length) return null;

  const tokensPorVerso = filtrados.map((v) => ({
    verso: v.verse,
    tokens: tokenizarOriginal(String(v.text || ''), fuente.prefijo)
  }));

  const resultado = {
    idioma: ref.esAT ? 'hebreo' : 'griego',
    etiqueta: fuente.etiqueta,
    versos: tokensPorVerso
  };

  if (ref.esAT) {
    const versosLxx = await obtenerCapitulo(SEPTUAGINTA.bolls, ref.libroId, ref.capitulo);
    const filtradosLxx = versosEnRango(versosLxx, ref.versoInicio, ref.versoFin);
    if (filtradosLxx.length) {
      resultado.septuaginta = {
        etiqueta: SEPTUAGINTA.etiqueta,
        nota: 'Se muestra en griego: no existe una traducción al español de la Septuaginta verificable en fuente libre. Las versiones en español de este lector siguen el texto hebreo masorético, no la LXX.',
        texto: filtradosLxx.map((v) => `${v.verse} ${String(v.text || '').replace(/\s+/g, ' ').trim()}`).join(' ')
      };
    }
  }

  return resultado;
}

// Texto original aplanado a una sola línea legible con "palabra(STRONG)", para
// dárselo como contexto real al modelo de IA (en vez de que use su memoria).
export function originalComoTextoPlano(original) {
  if (!original) return '';
  return original.versos
    .map((v) => v.tokens.map((t) => (t.strong ? `${t.palabra}(${t.strong})` : t.palabra)).join(' '))
    .join(' ');
}

export function strongsUnicos(original) {
  if (!original) return [];
  const set = new Set();
  for (const v of original.versos) {
    for (const t of v.tokens) {
      if (t.strong) set.add(t.strong);
    }
  }
  return [...set];
}

// Limpia el HTML del diccionario BDBT a texto plano legible.
export function limpiarHtmlDiccionario(html) {
  return String(html || '')
    .replace(/<li>/gi, '\n• ')
    .replace(/<\/li>/gi, '')
    .replace(/<p[^>]*\/?>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/-\s*\n/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .join('\n')
    .trim();
}

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Resalta las coincidencias de `termino` dentro de `texto` con <mark>, escapando
// primero TODO el texto. Bolls también devuelve su propio <mark> en los
// resultados de búsqueda, pero no se reutiliza tal cual: es HTML de un
// tercero y no conviene inyectarlo directo en el DOM. Aquí se construye el
// resaltado desde texto ya sanitizado, así el único HTML real es el <mark>
// que este propio código genera.
export function resaltarCoincidencia(texto, termino) {
  const limpio = limpiarHtmlVerso(texto);
  const term = normalizar(termino);
  if (!term) return escapeHtml(limpio);
  const normalizado = normalizar(limpio);
  let resultado = '';
  let cursor = 0;
  let idx = normalizado.indexOf(term, cursor);
  if (idx === -1) return escapeHtml(limpio);
  while (idx !== -1) {
    resultado += escapeHtml(limpio.slice(cursor, idx));
    resultado += `<mark>${escapeHtml(limpio.slice(idx, idx + term.length))}</mark>`;
    cursor = idx + term.length;
    idx = normalizado.indexOf(term, cursor);
  }
  resultado += escapeHtml(limpio.slice(cursor));
  return resultado;
}

export async function obtenerDefinicionStrong(codigo) {
  const limpio = String(codigo || '').trim().toUpperCase().replace(/^([GH])0*(\d+)$/, '$1$2');
  if (!/^[GH]\d{1,4}$/.test(limpio)) return null;
  const data = await fetchConTimeout(`https://bolls.life/dictionary-definition/${DICCIONARIO_STRONG.bolls}/${limpio}/`);
  if (!Array.isArray(data) || !data.length) return null;
  const d = data[0];
  return {
    codigo: limpio,
    lexema: d.lexeme || '',
    transliteracion: d.transliteration || '',
    pronunciacion: d.pronunciation || '',
    definicionCorta: d.short_definition || '',
    definicion: limpiarHtmlDiccionario(d.definition || '')
  };
}
