import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PKG_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIRS = [
  join(PKG_ROOT, 'data', 'versiones'),
  join(PKG_ROOT, 'public', 'data', 'versiones'),
  join(process.cwd(), 'data', 'versiones'),
  join(process.cwd(), 'public', 'data', 'versiones'),
  join(process.cwd(), 'cieloefata-biblia', 'data', 'versiones'),
  join(process.cwd(), 'cieloefata-biblia', 'public', 'data', 'versiones'),
];

let catalogoMemo = null;
const packMemo = new Map();

function leerJson(nombre) {
  for (const dir of DIRS) {
    try {
      return JSON.parse(readFileSync(join(dir, nombre), 'utf8'));
    } catch { /* siguiente ruta */ }
  }
  return null;
}

export function cargarCatalogo() {
  if (catalogoMemo) return catalogoMemo;
  catalogoMemo = leerJson('catalogo.json') || {
    schema: 'revelatio.versiones.v1',
    activa: ['rv1960', 'tla', 'dhh', 'septuaginta'],
    versiones: [],
    reservadas_v2: [],
  };
  return catalogoMemo;
}

export function versionesActivas() {
  const cat = cargarCatalogo();
  const activa = new Set(cat.activa || []);
  return (cat.versiones || []).filter((v) => activa.has(v.key));
}

export function metaVersion(key) {
  const cat = cargarCatalogo();
  return (cat.versiones || []).find((v) => v.key === key)
    || (cat.reservadas_v2 || []).find((v) => v.key === key)
    || null;
}

export function cargarPack(key) {
  if (packMemo.has(key)) return packMemo.get(key);
  const meta = metaVersion(key);
  const archivo = meta?.archivo || `${key}.json`;
  const pack = leerJson(archivo);
  packMemo.set(key, pack);
  return pack;
}

export function versosDesdePack(pack, libro, capitulo, versoInicio, versoFin) {
  const cap = pack?.libros?.[libro]?.[String(capitulo)];
  if (!cap || typeof cap !== 'object') return [];
  const nums = Object.keys(cap)
    .map(Number)
    .filter((n) => n > 0)
    .sort((a, b) => a - b);
  const filtrados = nums.filter((n) => {
    if (!versoInicio) return true;
    return n >= versoInicio && n <= (versoFin || versoInicio);
  });
  return filtrados
    .map((n) => ({ n, texto: String(cap[n] || '').trim() }))
    .filter((v) => v.texto);
}

export function catalogoPublico() {
  const cat = cargarCatalogo();
  return {
    schema: cat.schema,
    activa: cat.activa,
    versiones: (cat.versiones || []).map((v) => ({
      key: v.key,
      etiqueta: v.etiqueta,
      nombre: v.nombre,
      licencia: v.licencia,
      titular: v.titular || '',
      aviso: v.aviso || null,
    })),
    reservadas_v2: (cat.reservadas_v2 || []).map((v) => ({
      key: v.key,
      etiqueta: v.etiqueta,
      nombre: v.nombre,
      licencia: 'pending',
    })),
  };
}
