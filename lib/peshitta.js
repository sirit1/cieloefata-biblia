import fs from 'node:fs';
import path from 'node:path';

const PDF_SOURCE = 'https://blobs.vusercontent.net/blob/BIBLIA-PESHITTA-tdIs48xffHtdtYf9VugeWRDLWa9jQZ.pdf';
const LOCAL_INDEX = path.join(process.cwd(), 'public', 'peshitta-index.json');

// Referencias verificadas directamente contra la Biblia Peshitta proporcionada.
// Se usan antes del índice legado, cuya extracción PDF puede desplazar versículos.
const SOURCE_REFERENCES = {
  'juan 3:16': 'Juan 3:16 Porque de tal manera amó Dios al mundo, que hasta dio a su Hijo Unigénito, para que todo el que crea en Él no se pierda, sino que tenga vida eterna.',
  'juan 17:3': 'Juan 17:3 Y esta es la vida eterna: que te conozcan a ti, el único Dios verdadero, y a Jesucristo, a quien tú enviaste.',
  'galatas 5:1': 'Gálatas 5:1 Permanezcan, pues, firmes en la libertad con la cual el Cristo nos hizo libres, y no se sujeten otra vez al yugo de esclavitud.',
  'hechos 2:4': 'Hechos 2:4 y todos fueron llenos del Espíritu Santo, y empezaron a hablar en diversas lenguas, conforme a lo que el Espíritu les daba que hablaran.',
};

function normalize(value = '') {
  return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9:\s-]/g, ' ').replace(/\s+/g, ' ').trim();
}

function loadRows() {
  try {
    return JSON.parse(fs.readFileSync(LOCAL_INDEX, 'utf8')).map((row) => ({ ...row, referencia: `${row.libro} ${row.capitulo}:${row.versiculo}` }));
  } catch {
    return [];
  }
}

const ALIASES = {
  juan: 'JUAN', 'san juan': 'JUAN', mateo: 'MATEO', marcos: 'MARCOS', lucas: 'LUCAS', hechos: 'HECHOS', 'hechos de los apostoles': 'HECHOS',
  romanos: 'ROMANOS', genesis: 'GÉNESIS', génesis: 'GÉNESIS', salmos: 'SALMOS', salmo: 'SALMOS',
  proverbios: 'PROVERBIOS', hebreos: 'HEBREOS', santiago: 'SANTIAGO', apocalipsis: 'APOCALIPSIS',
  '1 corintios': '1 CORINTIOS', '2 corintios': '2 CORINTIOS', '1ª corintios': '1 CORINTIOS', '2ª corintios': '2 CORINTIOS', '1 tesalonicenses': '1 TESALONICENSES', '2 tesalonicenses': '2 TESALONICENSES',
  '1 timoteo': '1 TIMOTEO', '2 timoteo': '2 TIMOTEO', '1 pedro': '1 PEDRO', '2 pedro': '2 PEDRO',
  '1 juan': '1 JUAN', '2 juan': '2 JUAN', '3 juan': '3 JUAN'
};

function canonicalBook(value = '') {
  const clean = String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[ª°]/g, '').replace(/\s+/g, ' ').trim();
  return ALIASES[clean] || clean.toUpperCase();
}

export function buscarPeshitta(consulta) {
  const rows = loadRows();
  const q = normalize(consulta);
  if (!q) return { texto: '', versos: [], fuente: PDF_SOURCE };

  const sourceText = SOURCE_REFERENCES[q];
  if (sourceText) {
    const match = sourceText.match(/^(.+?)\s+(\d+):(\d+)\s+(.+)$/);
    return {
      texto: sourceText,
      versos: match ? [{ libro: match[1], capitulo: Number(match[2]), versiculo: Number(match[3]), referencia: `${match[1].toUpperCase()} ${match[2]}:${match[3]}`, texto: match[4] }] : [],
      fuente: PDF_SOURCE,
    };
  }
  if (!rows.length) return { texto: '', versos: [], fuente: PDF_SOURCE };
  const reference = q.match(/^(.+?)\s+(\d+)(?::(\d+)\s*(?:[-–]\s*(\d+))?)?$/);
  const requestedBook = canonicalBook(reference?.[1] || '');
  if (reference && !rows.some((row) => canonicalBook(row.libro) === requestedBook)) return { texto: '', versos: [], fuente: PDF_SOURCE };
  let resultados = reference
    ? rows.filter((row) => canonicalBook(row.libro) === requestedBook && row.capitulo === Number(reference[2]) && (!reference[3] || (row.versiculo >= Number(reference[3]) && (!reference[4] || row.versiculo <= Number(reference[4])))))
    : rows.filter((row) => normalize(row.texto).includes(q) || q.split(' ').filter(Boolean).every((word) => normalize(row.texto).includes(word))).slice(0, 20);
  if (reference) {
    if (!resultados.length) return { texto: '', versos: [], fuente: PDF_SOURCE };
    const versos = resultados.sort((a, b) => a.versiculo - b.versiculo);
    return { texto: versos.map((row) => `${row.referencia} ${row.texto}`).join(' '), versos, fuente: PDF_SOURCE };
  }
  const unidos = [...new Map(resultados.map((row) => [row.referencia, row])).values()];
  return { texto: unidos.map((row) => `${row.referencia} ${row.texto}`).join(' '), versos: unidos, fuente: PDF_SOURCE };
}

export { PDF_SOURCE };
