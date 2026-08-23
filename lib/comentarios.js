/**
 * Comentarios histórico-exegéticos (dominio público).
 * Solo versículo exacto. Sin plantillas de libro, sin voces, sin síntesis.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const DIRS = [
  join(process.cwd(), 'data', 'commentaries'),
  join(process.cwd(), 'public', 'data', 'commentaries'),
  join(process.cwd(), 'public'),
];

const packMemo = new Map();
let catalogoMemo = null;

function leerJson(nombre) {
  for (const dir of DIRS) {
    try {
      return JSON.parse(readFileSync(join(dir, nombre), 'utf8'));
    } catch {
      /* siguiente */
    }
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

function esRuido(texto) {
  return /no hay transcripci[oó]n|nota general del comentarista|este panel no admite|s[íi]ntesis de IA|texto hist[oó]rico de dominio público|sitúan .+ en su marco histórico-gramatical|predica .+ para llevar al pecador|Henry lee .+ como |Este libro se medita|El libro no es adorno doctrinal|expone .+ a la luz de la Escritura, para que el lector crea/i.test(
    String(texto || '')
  );
}

function limpio(texto) {
  const t = String(texto || '').trim();
  return t && !esRuido(t) ? t : '';
}

/** Solo el versículo pedido. Nunca capítulo genérico, libros[] ni plantillas. */
export function resolverComentario(pack, referencia) {
  const { slug } = slugCapitulo(referencia);
  const nodo = pack?.entries?.[slug];
  const versoPedido = String(referencia || '').match(/:(\d+)/)?.[1] || '';
  if (nodo && typeof nodo === 'object' && versoPedido && limpio(nodo[versoPedido])) {
    return [{ n: versoPedido, texto: limpio(nodo[versoPedido]) }];
  }
  return [];
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
  const entradas = resolverComentario(pack, referencia);
  const titulo = pack?.author || meta?.etiqueta || '';
  if (!entradas.length) {
    return {
      ia: false,
      vacio: true,
      generico: false,
      nivel: 'ninguno',
      titulo,
      obra: pack?.obra || '',
      entradas: [],
      cuerpo: '',
      paragraphs: [],
    };
  }
  const cuerpo = entradas.map((e) => e.texto).join('\n\n');
  return {
    ia: false,
    vacio: false,
    generico: false,
    nivel: 'versiculo',
    titulo,
    obra: pack?.obra || '',
    entradas,
    cuerpo,
    paragraphs: cuerpo.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean),
  };
}
