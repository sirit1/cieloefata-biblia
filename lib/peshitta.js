import fs from 'node:fs';
import path from 'node:path';

const PDF_SOURCE = 'https://blobs.vusercontent.net/blob/Biblia%20Peshita-SY1zKvCA8u5tOjIOAQV90EDh1BD4Sc.pdf';
const LOCAL_INDEX = path.join(process.cwd(), 'public', 'peshitta-index.json');

function normalize(value = '') {
  return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9:\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function loadRows() {
  try {
    return JSON.parse(fs.readFileSync(LOCAL_INDEX, 'utf8')).map((row) => ({ ...row, referencia: `${row.libro} ${row.capitulo}:${row.versiculo}` }));
  } catch {
    return [];
  }
}

const ALIASES = {
  juan: 'JUAN', 'san juan': 'JUAN', mateo: 'MATEO', marcos: 'MARCOS', lucas: 'LUCAS', hechos: 'HECHOS',
  romanos: 'ROMANOS', genesis: 'GÉNESIS', génesis: 'GÉNESIS', salmos: 'SALMOS', salmo: 'SALMOS',
  proverbios: 'PROVERBIOS', hebreos: 'HEBREOS', santiago: 'SANTIAGO', apocalipsis: 'APOCALIPSIS'
};

function canonicalBook(value = '') {
  const clean = String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[ª°]/g, '').replace(/\s+/g, ' ').trim();
  return ALIASES[clean] || clean.toUpperCase();
}

export function buscarPeshitta(consulta) {
  const rows = loadRows();
  const q = normalize(consulta);
  if (!q || !rows.length) return { texto: '', versos: [], fuente: PDF_SOURCE };
  const reference = q.match(/^(.+?)\s+(\d+)(?::(\d+))?$/);
  let resultados = reference
    ? rows.filter((row) => canonicalBook(row.libro) === canonicalBook(reference[1]) && row.capitulo === Number(reference[2]) && (!reference[3] || row.versiculo === Number(reference[3])))
    : rows.filter((row) => normalize(row.texto).includes(q) || q.split(' ').filter(Boolean).every((word) => normalize(row.texto).includes(word))).slice(0, 20);
  const unidos = [...new Map(resultados.map((row) => [row.referencia, row])).values()];
  const completos = reference ? [{ ...unidos[unidos.length - 1], texto: resultados.map((row) => row.texto).join(' ') }] : unidos;
  return { texto: completos.map((row) => `${row.referencia} ${row.texto}`).join(' '), versos: completos, fuente: PDF_SOURCE };
}

export { PDF_SOURCE };
