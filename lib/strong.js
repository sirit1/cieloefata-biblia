import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PKG_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const RUTAS = [
  join(PKG_ROOT, 'data', 'strong', 'lexico.json'),
  join(PKG_ROOT, 'public', 'data', 'strong', 'lexico.json'),
  join(PKG_ROOT, 'public', 'strong_greek.json'),
  join(process.cwd(), 'data', 'strong', 'lexico.json'),
  join(process.cwd(), 'public', 'data', 'strong', 'lexico.json'),
  join(process.cwd(), 'public', 'strong_greek.json'),
  join(process.cwd(), 'cieloefata-biblia', 'data', 'strong', 'lexico.json'),
  join(process.cwd(), 'cieloefata-biblia', 'public', 'data', 'strong', 'lexico.json'),
  join(process.cwd(), 'cieloefata-biblia', 'public', 'strong_greek.json'),
];

let lexicoMemo = null;

function normalizarCodigo(codigo) {
  return String(codigo || '').trim().toUpperCase().replace(/^([GH])0*(\d+)$/, '$1$2');
}

export function cargarLexicoStrong() {
  if (lexicoMemo) return lexicoMemo;
  const merged = {};
  for (const ruta of RUTAS) {
    try {
      Object.assign(merged, JSON.parse(readFileSync(ruta, 'utf8')));
    } catch { /* siguiente */ }
  }
  lexicoMemo = merged;
  return merged;
}

export function entradaStrongLocal(codigo) {
  const key = normalizarCodigo(codigo);
  if (!/^[GH]\d{1,5}$/.test(key)) return null;
  const lexico = cargarLexicoStrong();
  const raw = lexico[key] || lexico[codigo];
  if (!raw || typeof raw !== 'object') return null;
  const idioma = key.startsWith('H') ? 'hebreo' : 'griego';
  return {
    codigo: key,
    idioma,
    lemma: raw.lemma || raw.lexema || raw.raiz || '',
    raiz: raw.raiz || raw.lemma || raw.lexema || '',
    translit: raw.translit || raw.transliteracion || raw.transliteration || '',
    definicion: raw.definicion || raw.definition || raw.definicionCorta || '',
    fuente: 'dominio público',
  };
}
