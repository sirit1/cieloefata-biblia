import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import fs from 'node:fs';
const data = new Uint8Array(fs.readFileSync('/tmp/peshitta-real.pdf'));
const doc = await getDocument({ data, useSystemFonts: true }).promise;

async function scanFor(needle, guess, range, label) {
  for (let p = Math.max(1, guess-range); p <= guess+range; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    const full = content.items.map(i=>i.str).join('');
    if (full.includes(needle)) {
      const vp = page.getViewport({scale:1});
      console.log('###', label, '=== PAGE', p, 'height', vp.height, '===');
      const items = content.items.filter(i=>i.str.trim()).map(i=>({str:i.str, font:i.fontName, h:Math.round(i.height*10)/10, y:Math.round(i.transform[5])}));
      items.sort((a,b)=>b.y-a.y);
      for (const it of items.slice(0,25)) console.log(JSON.stringify(it));
      return p;
    }
  }
  console.log('###', label, 'NOT FOUND near', guess);
  return null;
}

await scanFor('En el principio', 26, 15, 'GENESIS 1');
await scanFor('todos fueron llenos', 1690, 40, 'HECHOS 2:4 area');
await scanFor('Al principio era el Verbo', 1660, 40, 'JUAN 1:1');
