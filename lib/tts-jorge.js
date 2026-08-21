/**
 * Voz canónica de Éfata RevelatiO: es-MX-JorgeNeural (Edge TTS).
 * Usada en bienvenida, narración y lecturas.
 */
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { readFile, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const VOZ_JORGE = {
  id: 'es-MX-JorgeNeural',
  motor: 'edge-tts',
  locale: 'es-MX',
  genero: 'varon',
  etiqueta: 'Jorge · México',
  rate: '+0%',
};

const PY = `import asyncio, edge_tts, sys
async def main():
    text, voice, rate, out = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
    await edge_tts.Communicate(text, voice, rate=rate).save(out)
asyncio.run(main())
`;

function runPython(args, inputText) {
  return new Promise((resolve, reject) => {
    const child = spawn('python3', ['-c', PY, inputText, ...args], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let err = '';
    child.stderr.on('data', (d) => { err += d.toString(); });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(err.trim() || `edge-tts exit ${code}`));
    });
  });
}

/**
 * @param {string} texto
 * @param {{ rate?: string }} [opts]
 * @returns {Promise<Buffer|null>}
 */
export async function sintetizarJorge(texto, opts = {}) {
  // Ellipsis inicial: Edge TTS inserta una micro-pausa real (anti-corte de la 1ª sílaba en <audio>).
  const plano = ('… ' + String(texto || '').replace(/\s+/g, ' ').trim()).trim();
  if (plano.length < 2) return null;
  const rate = opts.rate || VOZ_JORGE.rate;
  const out = join(tmpdir(), `revelatio-jorge-${randomBytes(8).toString('hex')}.mp3`);
  try {
    await runPython([VOZ_JORGE.id, rate, out], plano);
    const buf = await readFile(out);
    if (!buf?.length) return null;
    return buf;
  } catch (err) {
    console.warn('[tts-jorge]', err?.message || err);
    return null;
  } finally {
    try { await unlink(out); } catch { /* ignore */ }
  }
}

export async function jorgeDisponible() {
  try {
    const probe = await sintetizarJorge('Hola.', { rate: '+0%' });
    return Boolean(probe?.length);
  } catch {
    return false;
  }
}
