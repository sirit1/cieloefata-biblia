import { officeOf, OFICIOS, fallbackOficio, generarTodosLosOficios } from '../lib/lentes-oficios.js';

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const herm = officeOf('palabra');
assert(herm && herm.topics.includes('Hermenéutica'), 'Palabra debe ofertar Hermenéutica exacta');
assert(herm.topics.includes('Exégesis') && herm.topics.includes('Lenguas'), 'Palabra: exégesis y lenguas');

const mente = officeOf('bucle');
assert(mente.titulo === 'Ciencia y mente', 'Título exacto Ciencia y mente');
assert(mente.topics.includes('Metanoia'), 'Bucle ofertar metanoia');
assert(mente.henry === false, 'Ciencia y mente no lleva Henry');

const pacto = officeOf('hilo');
assert(pacto.tsk === true && pacto.titulo === 'El pacto', 'TSK solo en El pacto');
assert(officeOf('palabra').tsk === false, 'Texto abierto no lleva TSK');
assert(officeOf('evangelio').strong === false, 'Cristo y la gracia no lleva Strong');

const ctx = {
  etiqueta: 'Romanos 12:2',
  texto: 'No os conforméis a este siglo, sino transformaos por medio de la renovación de vuestro entendimiento.',
  strongs: [
    {
      codigo: 'G3339',
      lexema: 'μεταμορφόω',
      transliteracion: 'metamorphoō',
      traduccionEstricta: 'transformarse',
    },
  ],
};

const palabra = fallbackOficio(herm, ctx);
assert(palabra.titulo === 'Texto abierto', 'Ficha Palabra se titula Texto abierto');
assert(palabra.topics.find((t) => t.title === 'Hermenéutica')?.analysis.includes('Hermenéutica'), 'Cuerpo de Hermenéutica nombra Hermenéutica');
assert(palabra.beats.glosa && /G3339|Glosa/i.test(palabra.beats.glosa), 'Glosa Strong presente, no timeout');
assert(!/no llegó a tiempo/i.test(palabra.beats.glosa), 'Glosa no es timeout');
assert(palabra.conclusion.startsWith('Conclusión Revelatio'), 'Cierre Palabra');
assert(palabra.citation && /Matthew Henry/i.test(palabra.citation.autor), 'Henry es cita de corpus en Ro 12:2');
assert(!palabra.topics.some((t) => /matthew henry/i.test(t.analysis)), 'Henry no es el cuerpo');

const ciencia = fallbackOficio(mente, ctx);
assert(ciencia.titulo === 'Ciencia y mente', 'título Ciencia y mente');
assert(ciencia.citation == null && ciencia.henryClip == null, 'sin Henry en mente');
assert(ciencia.topics.some((t) => t.title === 'Neurociencia'), 'neurociencia ofertada');
assert(!ciencia.topics.some((t) => /\bDr\./.test(t.analysis)), 'sin autores clínicos falsos');
assert(ciencia.conclusion.startsWith('Conclusión Revelatio'), 'cierre mente');

const hilo = fallbackOficio(pacto, ctx);
assert(hilo.beats.tsk && /Jr 31|Jeremías 31|nuevo pacto/i.test(hilo.beats.tsk), 'TSK en El pacto');

const pack = await generarTodosLosOficios({
  passage: 'Romanos 12:2',
  verseText: ctx.texto,
  localOnly: true,
});
assert(pack.oficios.length === 5, 'cinco oficios');
for (const o of OFICIOS) {
  const got = pack.oficios.find((x) => x.id === o.id);
  assert(got, `falta ${o.id}`);
  assert(got.titulo === o.titulo, `título ${o.titulo}`);
  for (const title of o.topics) {
    const t = got.topics.find((x) => x.title === title);
    assert(t && t.analysis.length > 40, `${o.titulo} debe analizar «${title}»`);
  }
  assert(/^Conclusión Revelatio/.test(got.conclusion), `${o.titulo} cierra con Conclusión Revelatio`);
}

console.log('✔ oficios locales: títulos, Glosa, TSK, Henry-cita, Conclusión Revelatio');
