import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import fs from 'node:fs';
const data = new Uint8Array(fs.readFileSync('/tmp/peshitta-real.pdf'));
const doc = await getDocument({ data, useSystemFonts: true }).promise;
const t0 = Date.now();
for (let p = 1; p <= 200; p++) {
  const page = await doc.getPage(p);
  await page.getTextContent();
}
console.log('200 pages took', Date.now()-t0, 'ms => est total for', doc.numPages, 'pages:', Math.round((Date.now()-t0)/200*doc.numPages/1000), 's');
