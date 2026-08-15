import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import fs from 'node:fs';

const data = new Uint8Array(fs.readFileSync('/tmp/peshitta-real.pdf'));
const doc = await getDocument({ data, useSystemFonts: true }).promise;

for (const p of [26, 27, 28, 29]) {
  const page = await doc.getPage(p);
  const content = await page.getTextContent();
  console.log('=== PAGE', p, '===');
  // sort by y descending (top to bottom), then x
  const items = content.items.filter(i => i.str.trim()).map(i => ({ str: i.str, font: i.fontName, h: i.height, x: Math.round(i.transform[4]), y: Math.round(i.transform[5]) }));
  items.sort((a,b) => b.y - a.y || a.x - b.x);
  for (const it of items.slice(0, 6)) console.log(JSON.stringify(it));
  console.log('...');
  for (const it of items.slice(-6)) console.log(JSON.stringify(it));
}
