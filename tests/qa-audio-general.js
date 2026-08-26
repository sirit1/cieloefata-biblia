/**
 * PRODUCT LAW: audio/UI is general — any book, chapter, verse, version.
 * No Romanos 12 special cases. TTS body is { verseText } only.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { resolveSpeakText } from '../api/tts.js';

const results = [];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function run(name, fn) {
  const t0 = Date.now();
  try {
    await fn();
    results.push({ name, status: 'PASS' });
    console.log(`✔ PASS [${Date.now() - t0}ms] - ${name}`);
  } catch (err) {
    results.push({ name, status: 'FAIL', error: err.message });
    console.log(`✖ FAIL [${Date.now() - t0}ms] - ${name}`);
    console.log(`  └─> ${err.message}`);
  }
}

function src(rel) {
  return readFileSync(resolve(rel), 'utf8');
}

await run('audio-engine no hardcodea Romanos 12 ni un libro', () => {
  const engine = src('js/audio-engine.js');
  assert(!/Romanos/i.test(engine), 'audio-engine no debe nombrar Romanos');
  assert(!/romanos_12/i.test(engine), 'audio-engine no debe anclarse a romanos_12');
  assert(engine.includes('PRODUCT LAW'), 'debe declarar la ley de producto');
});

await run('TTS client envía solo { verseText }', () => {
  const engine = src('js/audio-engine.js');
  assert(/const payload = \{ verseText: text \}/.test(engine), 'fetchTtsChunk debe enviar solo verseText');
  assert(!/JSON\.stringify\(\{[^}]*passage/.test(engine), 'no debe mandar passage al TTS');
});

await run('narrar capítulo relee el DOM vivo, no un snapshot de texto', () => {
  const engine = src('js/audio-engine.js');
  const speak = engine.slice(engine.indexOf('const speakChapter'), engine.indexOf('const pauseVoice'));
  assert(speak.includes('findVerseElByNum'), 'debe reconsultar el verso en pantalla');
  assert(speak.includes('verseTextFromEl(el)'), 'el texto debe salir del DOM en cada verso');
  assert(speak.includes('chapterLocationKey'), 'debe abortar si cambia libro/capítulo/versión');
  assert(!/verses\.map\(\(el\) => \(\{ el, text:/.test(speak), 'no debe congelar el texto al inicio');
});

await run('currentVerseText prefiere el DOM en pantalla', () => {
  const engine = src('js/audio-engine.js');
  const fn = engine.slice(engine.indexOf('function currentVerseText'), engine.indexOf('function currentPassage'));
  assert(fn.indexOf('verseTextFromEl') < fn.indexOf('currentSelectedText'), 'DOM antes que globales');
});

await run('selector de estudio incluye RVR1960 NVI DHH TLA', () => {
  const app = src('js/estudio-app.js');
  const block = app.slice(app.indexOf('const VERSIONES_FIJAS'), app.indexOf('const fillVersionSelect'));
  assert(block.includes("key: 'rv1960'"), 'falta RVR1960');
  assert(block.includes("key: 'nvi'"), 'falta NVI');
  assert(block.includes("key: 'dhh'"), 'falta DHH');
  assert(block.includes("key: 'tla'"), 'falta TLA');
});

await run('claveMotor normaliza NVI/RVR1960 de cualquier casing', () => {
  const app = src('js/estudio-app.js');
  const fn = app.slice(app.indexOf('function claveMotor'), app.indexOf('function etiquetaVersion'));
  assert(fn.includes("v === 'nvi'"), 'NVI debe mapear a nvi');
  assert(fn.includes("v === 'rvr1960'"), 'RVR1960 debe mapear a rv1960');
  assert(fn.includes('.toLowerCase()'), 'la clave no puede depender del casing del <select>');
});

await run('estudio pide la versión seleccionada a /api/bible si falta en packs', () => {
  const app = src('js/estudio-app.js');
  assert(app.includes('async function asegurarVersionSeleccionada'), 'falta asegurarVersionSeleccionada');
  assert(app.includes('/api/bible?book='), 'debe cargar la versión pedida, no solo el catálogo local');
});

await run('oír verso ignora data-listen-text y lee la pantalla', () => {
  const engine = src('js/audio-engine.js');
  const bind = engine.slice(engine.indexOf('dataset.rvListenBound'), engine.indexOf('engine.mount'));
  assert(bind.includes('btn.dataset.listen === "verse"'), 'verse debe tener rama propia');
  const verseBranch = bind.slice(bind.indexOf('listen === "verse"'), bind.indexOf('} else {'));
  assert(verseBranch.includes('currentVerseText()'), 'verse debe leer el DOM vivo');
  assert(!verseBranch.includes('data-listen-text'), 'no usar snapshot de data-listen-text');
});

await run('vida chips no están en la puerta de estudio', () => {
  const estudio = src('views/estudio.html');
  assert(!/Ansiedad|Matrimonio|Laboral|Hábitos/.test(estudio), 'chips de vida no deben estar en estudio');
  const overlays = src('views/shared-overlays.html');
  assert(/Ansiedad/.test(overlays) && /Matrimonio/.test(overlays), 'chips de vida siguen en IA');
});

await run('resolveSpeakText es ciego al libro y a la versión', () => {
  const samples = [
    { verseText: 'En el principio creó Dios los cielos y la tierra.', passage: 'Génesis 1:1', version: 'RVR1960' },
    { verseText: 'Porque de tal manera amó Dios al mundo.', passage: 'Juan 3:16', version: 'NVI' },
    { verseText: 'Jehová es mi pastor; nada me faltará.', passage: 'Salmos 23:1', version: 'DHH' },
    { verseText: 'No os conforméis a este siglo.', passage: 'Romanos 12:2', version: 'TLA' },
    { verseText: 'Los sanos no tienen necesidad de médico, sino los enfermos.', passage: 'Mateo 9:12', version: 'RVR1960' },
  ];
  for (const s of samples) {
    assert(
      resolveSpeakText(s) === s.verseText,
      `debió narrar el texto en pantalla de ${s.passage} (${s.version})`
    );
    assert(resolveSpeakText({ passage: s.passage, version: s.version }) === '', 'passage/version no inventan texto');
  }
});

const failed = results.filter((r) => r.status === 'FAIL');
console.log(`\n${results.length - failed.length}/${results.length} tests ok`);
if (failed.length) process.exit(1);
