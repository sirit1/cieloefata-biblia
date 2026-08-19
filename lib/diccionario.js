import { obtenerDefinicionStrong } from './biblia.js';

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
  const key = String(codigo || '').toUpperCase();
  if (cache.has(key)) return cache.get(key);
  const definicion = await obtenerDefinicionStrong(key);
  if (!definicion) return null;
  const resultado = normalizar(definicion, key);
  cache.set(key, resultado);
  return resultado;
}
