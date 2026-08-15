import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import fs from 'node:fs';
const data = new Uint8Array(fs.readFileSync('/tmp/peshitta-real.pdf'));
const doc = await getDocument({ data, useSystemFonts: true }).promise;

// full page dump for genesis page 27 to see header/footer at extremes
const page = await doc.getPage(27);
const content = await page.getTextContent();
const vp = page.getViewport({scale:1});
console.log('page height', vp.height, 'width', vp.width);
const items = content.items.filter(i=>i.str.trim()).map(i=>({str:i.str, font:i.fontName, h:Math.round(i.height*10)/10, y:Math.round(i.transform[5]), x:Math.round(i.transform[4])}));
items.sort((a,b)=>b.y-a.y);
console.log('--- TOP 5 (header) ---');
for (const it of items.slice(0,5)) console.log(JSON.stringify(it));
console.log('--- BOTTOM 5 (footer) ---');
for (const it of items.slice(-5)) console.log(JSON.stringify(it));

// find HECHOS title page by scanning for isolated "HECHOS" all-caps line
for (let p = 1650; p <= 1750; p++) {
  const pg = await doc.getPage(p);
  const c = await pg.getTextContent();
  const its = c.items.filter(i=>i.str.trim());
  if (its.some(i => i.str.trim() === 'HECHOS')) {
    console.log('=== Found HECHOS title candidate on page', p, '===');
    const sorted = its.map(i=>({str:i.str, font:i.fontName, h:Math.round(i.height*10)/10, y:Math.round(i.transform[5])})).sort((a,b)=>b.y-a.y);
    for (const it of sorted.slice(0,15)) console.log(JSON.stringify(it));
    break;
  }
}
