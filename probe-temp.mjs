import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import fs from 'node:fs';

const data = new Uint8Array(fs.readFileSync('/tmp/peshitta-real.pdf'));
const doc = await getDocument({ data, useSystemFonts: true }).promise;
console.log('num pages:', doc.numPages);

// find the page with "En el principio creó Dios" (Genesis 1:1)
for (let p = 20; p <= 40; p++) {
  const page = await doc.getPage(p);
  const content = await page.getTextContent();
  const full = content.items.map(i => i.str).join('');
  if (full.includes('En el principio')) {
    console.log('FOUND on page', p);
    for (const item of content.items) {
      console.log(JSON.stringify({ str: item.str, fontName: item.fontName, height: item.height, x: item.transform[4], y: item.transform[5] }));
    }
    break;
  }
}
