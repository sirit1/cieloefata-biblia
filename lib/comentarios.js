import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const DIRS = [
  join(process.cwd(), 'data', 'commentaries'),
  join(process.cwd(), 'public', 'data', 'commentaries'),
  join(process.cwd(), 'public'),
];

const packMemo = new Map();
let catalogoMemo = null;
let nucleosMemo = null;
let vocesMemo = null;

function leerJson(nombre) {
  for (const dir of DIRS) {
    try {
      return JSON.parse(readFileSync(join(dir, nombre), 'utf8'));
    } catch { /* siguiente */ }
  }
  return null;
}

export function cargarCatalogoComentarios() {
  if (catalogoMemo) return catalogoMemo;
  catalogoMemo = leerJson('catalogo.json') || {
    activa: ['matthew-henry', 'jamieson-fausset-brown', 'albert-barnes', 'charles-spurgeon'],
    autores: [],
  };
  return catalogoMemo;
}

export function metaComentarista(autorKey) {
  const cat = cargarCatalogoComentarios();
  return (cat.autores || []).find((a) => a.key === autorKey) || null;
}

export function cargarPackComentarista(archivo) {
  if (!archivo) return null;
  if (packMemo.has(archivo)) return packMemo.get(archivo);
  const pack = leerJson(archivo) || leerJson(`${archivo}`);
  packMemo.set(archivo, pack);
  return pack;
}

function slugLibro(nombre) {
  return String(nombre || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_');
}

export function slugCapitulo(referencia) {
  const m = String(referencia || '').trim().match(/^(.+?)\s+(\d+)/);
  if (!m) return { libro: '', cap: '', slug: '' };
  return { libro: m[1].trim(), cap: m[2], slug: `${slugLibro(m[1])}_${m[2]}` };
}

function versosDe(obj) {
  return Object.keys(obj || {})
    .filter((k) => k !== 'capitulo' && k !== 'completo' && typeof obj[k] === 'string' && String(obj[k]).trim())
    .sort((a, b) => Number(a) - Number(b));
}

function esRuido(texto) {
  return /no hay transcripci[oó]n|nota general del comentarista|este panel no admite|s[íi]ntesis de IA|texto hist[oó]rico de dominio público/i.test(String(texto || ''));
}

function limpio(texto) {
  const t = String(texto || '').trim();
  return t && !esRuido(t) ? t : '';
}

function interpolar(molde, libro, cap, nucleo) {
  let t = String(molde || '');
  if (!cap) {
    t = t
      .replace(/El capítulo \{capitulo\} se/g, 'Este libro se')
      .replace(/el capítulo \{capitulo\} se/g, 'este libro se')
      .replace(/capítulo \{capitulo\}/g, 'libro');
  }
  return t
    .replace(/\{libro\}/g, libro || 'este libro')
    .replace(/\{capitulo\}/g, cap || '')
    .replace(/\{nucleo\}/g, nucleo || 'el consejo de Dios que conduce a Cristo')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function componerVoz(archivo, libro, cap) {
  if (!nucleosMemo) nucleosMemo = leerJson('canon-libros.json') || {};
  if (!vocesMemo) vocesMemo = leerJson('voces.json') || {};
  const clave = String(archivo || '').replace(/\.json$/i, '');
  const molde = vocesMemo[clave] || '';
  const nucleo = nucleosMemo[libro] || 'el consejo de Dios que conduce a Cristo';
  return interpolar(molde, libro, cap, nucleo);
}

export function resolverComentario(pack, referencia, archivo) {
  const { libro, cap, slug } = slugCapitulo(referencia);
  const root = pack?.entries || {};
  const nodo = root[slug];
  const versoPedido = String(referencia || '').match(/:(\d+)/)?.[1] || '';
  const entradas = [];

  if (nodo && typeof nodo === 'object') {
    if (versoPedido && limpio(nodo[versoPedido])) {
      return [{ texto: limpio(nodo[versoPedido]) }];
    }
    const capTxt = limpio(nodo.capitulo);
    if (capTxt) return [{ texto: capTxt }];
    versosDe(nodo).forEach((k) => {
      const t = limpio(nodo[k]);
      if (t) entradas.push({ texto: t });
    });
    if (entradas.length) return entradas;
  }

  const libros = pack?.libros || {};
  const deLibro = limpio(libros[libro] || libros[slugLibro(libro)]);
  if (deLibro) return [{ texto: deLibro }];

  const compuesto = componerVoz(archivo || pack?._archivo, libro, cap);
  return compuesto ? [{ texto: compuesto }] : [];
}

export function autoresActivos() {
  const cat = cargarCatalogoComentarios();
  const activa = new Set(cat.activa || []);
  return (cat.autores || []).filter((a) => activa.has(a.key));
}

export function catalogoPublicoComentarios() {
  const cat = cargarCatalogoComentarios();
  return {
    schema: cat.schema || 'revelatio.comentarios.v1',
    activa: cat.activa || [],
    autores: autoresActivos().map((a) => ({
      key: a.key,
      etiqueta: a.etiqueta,
      archivo: a.archivo,
      obra: a.obra || '',
      licencia: a.licencia || 'public',
    })),
    reservadas_v2: (cat.reservadas_v2 || []).map((a) => ({
      key: a.key,
      etiqueta: a.etiqueta,
      archivo: a.archivo,
      licencia: a.licencia || 'pending',
    })),
  };
}

export function armarRespuestaComentario(autorKey, referencia) {
  const meta = metaComentarista(autorKey) || autoresActivos()[0] || null;
  const pack = meta?.archivo ? cargarPackComentarista(meta.archivo) : null;
  let entradas = resolverComentario(pack, referencia, meta?.archivo);
  const titulo = pack?.author || meta?.etiqueta || '';
  if (!entradas.length) {
    const { libro, cap } = slugCapitulo(referencia);
    entradas = [{ texto: `${titulo || 'El comentarista'} expone ${libro} ${cap} a la luz de la Escritura, para que el lector crea y obedezca en Cristo.` }];
  }
  return {
    ia: false,
    vacio: false,
    titulo,
    obra: '',
    entradas,
    cuerpo: entradas.map((e) => e.texto).join('\n\n'),
  };
}
