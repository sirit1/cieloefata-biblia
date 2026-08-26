#!/usr/bin/env node
/**
 * One-command mirror: canonical js/, views/, css/ → public/ for Next/Vercel.
 * Edit the root trees only. Do not hand-edit public/js, public/views, public/css.
 */
import { copyFileSync, cpSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pub = join(root, 'public');

export function syncPublicStatic() {
  if (!existsSync(pub)) mkdirSync(pub, { recursive: true });

  const dirs = [
    ['js', 'js'],
    ['views', 'views'],
    ['css', 'css'],
  ];
  for (const [from, to] of dirs) {
    const src = join(root, from);
    if (!existsSync(src)) continue;
    cpSync(src, join(pub, to), { recursive: true });
  }

  const files = [
    ['index.html', 'index.html'],
    ['index.html', 'efata.html'],
    ['revelatio-modulos.js', 'revelatio-modulos.js'],
    ['script-principal.js', 'script-principal.js'],
    ['sw.js', 'sw.js'],
  ];
  for (const [from, to] of files) {
    const src = join(root, from);
    if (existsSync(src)) copyFileSync(src, join(pub, to));
  }
}

const isCli = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isCli) {
  syncPublicStatic();
  console.log('[sync-public-static] public/js, public/views, public/css copiados desde las raíces canónicas.');
}
