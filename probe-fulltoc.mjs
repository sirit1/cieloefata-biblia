import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import fs from 'node:fs';
const data = new Uint8Array(fs.readFileSync('/tmp/peshitta-real.pdf'));
const doc = await getDocument({ data, useSystemFonts: true }).promise;
console.log('TOTAL PAGES:', doc.numPages);

const BOOKS = ['GÉNESIS','ÉXODO','LEVÍTICO','NÚMEROS','DEUTERONOMIO','JOSUÉ','JUECES','RUT','1 SAMUEL','2 SAMUEL','1 REYES','2 REYES','1 CRÓNICAS','2 CRÓNICAS','EZRA','ESDRAS','NEHEMÍAS','ESTER','JOB','SALMOS','PROVERBIOS','ECLESIASTÉS','CANTAR DE LOS CANTARES','ISAÍAS','JEREMÍAS','LAMENTACIONES','EZEQUIEL','DANIEL','OSEAS','JOEL','AMÓS','ABDÍAS','JONÁS','MIQUEAS','NAHÚM','HABACUC','SOFONÍAS','HAGEO','ZACARÍAS','MALAQUÍAS','MATEO','MARCOS','LUCAS','JUAN','HECHOS','ROMANOS','1 CORINTIOS','2 CORINTIOS','GÁLATAS','EFESIOS','FILIPENSES','COLOSENSES','1 TESALONICENSES','2 TESALONICENSES','1 TIMOTEO','2 TIMOTEO','TITO','FILEMÓN','HEBREOS','SANTIAGO','1 PEDRO','2 PEDRO','1 JUAN','2 JUAN','3 JUAN','JUDAS','APOCALIPSIS'];
const bookSet = new Set(BOOKS);
const found = [];
for (let p = 1; p <= doc.numPages; p++) {
  const pg = await doc.getPage(p);
  const c = await pg.getTextContent();
  for (const it of c.items) {
    const s = it.str.trim();
    if (bookSet.has(s) && it.height > 12) {
      found.push({ page: p, book: s, h: Math.round(it.height*10)/10 });
    }
  }
}
console.log('CANDIDATE TITLE HITS:', found.length);
console.log(JSON.stringify(found, null, 0));
