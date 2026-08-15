import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import fs from 'node:fs';

const data = new Uint8Array(fs.readFileSync('/tmp/peshitta-real.pdf'));
const doc = await getDocument({ data, useSystemFonts: true }).promise;

for (let p = 1600; p <= 1620; p++) {
  const page = await doc.getPage(p);
  const content = await page.getTextContent();
  const items = content.items.filter(i => i.str.trim());
  const full = items.map(i=>i.str).join(' ');
  if (/EVANGELIO|MATEO|LIBRO DE/i.test(full)) {
    console.log('=== PAGE', p, '===');
    for (const it of items.slice(0,10)) console.log(JSON.stringify({str: it.str, font: it.fontName, h: it.height, y: Math.round(it.transform[5])}));
  }
}
