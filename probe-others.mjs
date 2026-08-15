import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import fs from 'node:fs';
const data = new Uint8Array(fs.readFileSync('/tmp/peshitta-real.pdf'));
const doc = await getDocument({ data, useSystemFonts: true }).promise;
// Search for Proverbios chapter 1 and Romans chapter 1 by scanning pages near estimated ratios
async function findPageWithText(needle, startGuess, range) {
  for (let p = Math.max(1, startGuess-range); p <= startGuess+range; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    const full = content.items.map(i=>i.str).join(' ');
    if (full.includes(needle)) return { page: p, items: content.items.filter(i=>i.str.trim()) };
  }
  return null;
}
const prov = await findPageWithText('Al que peca le atraen', 1150, 60) || await findPageWithText('los que aborrecen la instrucción', 1150, 80);
console.log('Proverbios guess result:', prov ? prov.page : 'not found via text guess');
