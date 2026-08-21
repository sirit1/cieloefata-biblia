import { obtenerDefinicionStrong } from './biblia.js';
import { entradaStrongLocal } from './strong.js';

const cache = new Map();

const CONTEXTO = {
  G: {
    categoria: 'Griego koiné',
    contexto: 'En el mundo grecorromano del Nuevo Testamento, el sentido se determina por el uso del término en su contexto literario, social y teológico, no por una sola definición aislada.',
  },
  H: {
    categoria: 'Hebreo bíblico',
    contexto: 'En la cultura hebrea de la Biblia, el significado se comprende dentro de la alianza, la vida comunitaria, la adoración y el uso concreto del término en su pasaje.',
  },
};

function claveStrong(codigo) {
  return String(codigo || '').trim().toUpperCase().replace(/^([GH])0*(\d+)$/, '$1$2');
}

function desdeLocal(local, codigo) {
  return {
    codigo,
    lexema: local.lemma || '',
    lemma: local.lemma || '',
    raiz: local.raiz || local.lemma || '',
    transliteracion: local.translit || '',
    translit: local.translit || '',
    pronunciacion: '',
    definicionCorta: local.definicion || '',
    definicion: local.definicion || '',
    definicionEs: local.definicion || '',
    traduccionEstricta: local.definicion || '',
    idioma: local.idioma || (codigo.startsWith('H') ? 'hebreo' : 'griego'),
    fuente: 'Strong · dominio público',
  };
}

function normalizar(definicion, codigo) {
  const prefijo = codigo[0].toUpperCase();
  const base = CONTEXTO[prefijo] || CONTEXTO.G;
  return {
    ...definicion,
    codigo,
    categoria: base.categoria,
    contextoHistorico: base.contexto,
    referencias: [],
    concordancia: `Buscar ${codigo} en todas las apariciones bíblicas`,
  };
}

export async function consultarDiccionario(codigo) {
  const key = claveStrong(codigo);
  if (!/^[GH]\d{1,5}$/.test(key)) return null;
  if (cache.has(key)) return cache.get(key);

  const local = entradaStrongLocal(key);
  if (local?.definicion) {
    const resultado = normalizar(desdeLocal(local, key), key);
    cache.set(key, resultado);
    return resultado;
  }

  const definicion = await obtenerDefinicionStrong(key);
  if (!definicion) return null;
  const resultado = normalizar(definicion, key);
  cache.set(key, resultado);
  return resultado;
}
