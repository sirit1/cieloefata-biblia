/**
 * Cinco oficios de Lentes RevelatiO.
 * El cuerpo es análisis estricto por título ofertado. Matthew Henry
 * solo entra como cita de corpus si el versículo está en el pack.
 * Strong/Glosa solo en Texto abierto. TSK solo en El pacto.
 */
import { hayMotorIA, generarJSON } from './ai.js';
import { contextoConsulta, formatearLexico, formatearTsk } from './consulta-contexto.js';
import { armarRespuestaComentario } from './comentarios.js';
import { glosaEspanol } from './glosa-es.js';

export const OFICIOS = [
  {
    id: 'palabra',
    oficio: 'Palabra',
    titulo: 'Texto abierto',
    tags: ['exégesis', 'hermenéutica', 'lenguas'],
    topics: ['Exégesis', 'Hermenéutica', 'Lenguas'],
    beats: ['glosa'],
    strong: true,
    tsk: false,
    henry: true,
  },
  {
    id: 'evangelio',
    oficio: 'Evangelio',
    titulo: 'Cristo y la gracia',
    tags: ['cristología', 'soteriología'],
    topics: ['Cristología', 'Soteriología'],
    beats: [],
    strong: false,
    tsk: false,
    henry: true,
  },
  {
    id: 'hilo',
    oficio: 'Hilo',
    titulo: 'El pacto',
    tags: ['teología bíblica', 'alianzas'],
    topics: ['Teología bíblica', 'Alianzas'],
    beats: ['tsk'],
    strong: false,
    tsk: true,
    henry: true,
  },
  {
    id: 'objecion',
    oficio: 'Objeción',
    titulo: 'Apologética',
    tags: ['defensa de la fe', 'cosmovisión'],
    topics: ['Defensa de la fe', 'Cosmovisión'],
    beats: [],
    strong: false,
    tsk: false,
    henry: true,
  },
  {
    id: 'bucle',
    oficio: 'Bucle',
    titulo: 'Ciencia y mente',
    tags: ['neurociencia', 'psicología', 'inteligencia emocional', 'neuroplasticidad', 'metanoia'],
    topics: ['Neurociencia', 'Psicología', 'Inteligencia emocional', 'Neuroplasticidad', 'Metanoia'],
    beats: [],
    strong: false,
    tsk: false,
    henry: false,
  },
];

export function officeOf(idOrTitle) {
  const s = String(idOrTitle || '').trim().toLowerCase();
  if (!s) return null;
  return (
    OFICIOS.find(
      (o) =>
        o.id === s ||
        o.oficio.toLowerCase() === s ||
        o.titulo.toLowerCase() === s
    ) || null
  );
}

function textoPlano(valor) {
  if (valor == null) return '';
  if (typeof valor === 'string') return valor.trim();
  if (typeof valor === 'number' || typeof valor === 'boolean') return String(valor);
  if (Array.isArray(valor)) return valor.map(textoPlano).filter(Boolean).join('\n\n');
  if (typeof valor === 'object') return Object.values(valor).map(textoPlano).filter(Boolean).join('\n\n');
  return String(valor).trim();
}

function citaVerso(texto, ref) {
  const t = textoPlano(texto);
  return t ? `«${t}»` : `el testimonio de ${ref}`;
}

function recortarCita(texto, max = 280) {
  const t = textoPlano(texto).replace(/\s+/g, ' ');
  if (!t) return '';
  if (t.length <= max) return t;
  return `${t.slice(0, max).replace(/\s+\S*$/, '')}…`;
}

function pareceHenryDump(texto) {
  return /exposición completa|matthew henry|henry lee |este libro se medita|comentario devocional/i.test(
    String(texto || '')
  );
}

function pareceAutorClinicoFalso(texto) {
  return /\b(dr\.|dra\.|doctor|doctora)\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+/u.test(String(texto || ''));
}

const TSK_LOCAL = (ref, texto) =>
  `Paralelos canónicos de ${ref}${texto ? ` («${texto}»)` : ''}:\n` +
  `- Génesis 12:1-3 — promesa a Abram; la simiente y la bendición de las naciones.\n` +
  `- Éxodo 19:4-6 — pueblo de posesión: el pacto en el Sinaí no anula la promesa.\n` +
  `- 2 Samuel 7:12-16 — pacto davídico: trono y linaje que apuntan al Mesías.\n` +
  `- Jeremías 31:31-34 — nuevo pacto: ley en el corazón, perdón de iniquidad.\n` +
  `- Lucas 22:20 — la copa del nuevo pacto en la sangre de Cristo.\n` +
  `- Hebreos 8:6-13 — mediador de un pacto mejor, fundado en mejores promesas.`;

function analisisFallback(office, topic, { ref, texto }) {
  const cita = citaVerso(texto, ref);
  const map = {
    Exégesis: `La exégesis de ${ref} parte del texto inspirado, no de la experiencia contemporánea. ${cita} se lee en su género, argumento y marco histórico-gramatical: qué dijo el autor humano bajo el Espíritu (2 P 1:20-21), a quién, y con qué contraste. El sentido no se fabrica por relevancias posteriores; se pesa en el contexto inmediato y en el uso canónico de las palabras. Toda observación gramatical sirve a la adoración: el Padre habla, el Hijo cumple, el Espíritu ilumina.`,
    Hermenéutica: `Hermenéutica: la Escritura interpreta la Escritura. ${cita} en ${ref} no se aísla; se lee en la analogía de la fe —promesa, cumplimiento y teología de la gracia en Cristo (Lc 24:27, 44-47). Distingue indicativo e imperativo: primero lo que Dios ha hecho; luego lo que el Espíritu produce. Invertir el orden es legalismo o desesperación. Hermenéutica sin Trinidad es técnica; con Trinidad es adoración inteligente.`,
    Lenguas: `Las lenguas originales de ${ref} no son adorno. ${cita} se pesa en hebreo o griego según el testamento: campo semántico, voz, tiempo y partículas, sin etimologías curiosas que ignoren el contexto. El léxico Strong, cuando está verificado, afina el sentido; jamás sustituye el argumento del pasaje. La traducción fiel sirve a la iglesia de habla hispana, no a la erudición vanagloriosa.`,
    Cristología: `Cristología de ${ref}: ${cita} testifica de la persona y obra del Hijo. Toda la Escritura converge en Cristo (Lc 24:27). Aquí no hay un héroe moral aislado: hay tipología, cumplimiento o aplicación de la cruz. El pasaje desmantela el mérito humano y anuncia al mediador único (1 Ti 2:5). Sin el Hijo, el texto queda ético; con el Hijo, es evangelio.`,
    Soteriología: `Soteriología de ${ref}: ${cita} anuncia salvación por gracia mediante la fe, no por obras (Ef 2:8-9). Justificación, adopción y vida nueva se reciben en Cristo. Lo que el texto manda, la cruz capacita (Ro 8:1-4). La soteriología no es técnica de mejora: es el don del Padre, la sangre del Hijo y la aplicación del Espíritu.`,
    'Teología bíblica': `Teología bíblica de ${ref}: ${cita} se engarza en el arco canónico —creación, caída, promesa, Israel, Cristo, iglesia, consumación. Ningún versículo es aforismo suelto. La unidad de la Escritura muestra un solo Dios que guarda su palabra. Este pasaje aporta un eslabón: qué revela de la fidelidad divina y cómo adelanta o aplica la redención.`,
    Alianzas: `Alianzas en ${ref}: ${cita} se lee a la luz de los pactos —adámico, noáico, abrahámico, sinaítico, davídico y el nuevo pacto en la sangre de Cristo (Lc 22:20; Heb 8). Continuidad: un solo pueblo de la promesa. Discontinuidad: sombras que hallan cuerpo en el Hijo. El pacto no es contrato simétrico; es juramento soberano de Dios (berit / diathēkē).`,
    'Defensa de la fe': `Defensa de la fe en ${ref}: ${cita} no es opinión privada. Dios ha hablado; Cristo resucitó según las Escrituras (1 Co 15:3-4). La apologética responde con mansedumbre y temor (1 P 3:15) sin ceder el terreno: pecado real, gracia real, juicio real. El escándalo de la cruz no se negocia. El Padre testifica del Hijo; el Espíritu convence (Jn 16:8-11).`,
    Cosmovisión: `Cosmovisión de ${ref}: ${cita} choca con el naturalismo, el relativismo y el yo autónomo. La Escritura afirma creación, caída, redención y consumación como marco de toda realidad. La dignidad humana (imago Dei), el orden moral y la esperanza no se derivan del azar. Este pasaje sostiene una visión del mundo teocéntrica: Cristo es Señor de la mente y de la cultura, no un complemento terapéutico.`,
    Neurociencia: `Neurociencia, con prudencia, describe correlatos de lo que ${ref} manda. ${cita} implica atención, memoria y hábito: redes prefrontales, reactividad límbica y repetición que consolida caminos. Eso no «prueba» la doctrina; ilustra el diseño creado. La Escritura tiene autoridad; la neurociencia describe. No se invocan autores clínicos inventados ni se medicaliza el texto.`,
    Psicología: `Psicología cristiana de ${ref}: ${cita} diagnostica pensamientos, afectos y defensas bajo la luz de la Palabra, no como autoridad rival. Identidad, herida y patrón se nombran para llevarlos a Cristo. Prohibido el coaching secular que excluya la cruz. La psique se pastorea en la iglesia y los medios de gracia; no se finge un consultorio con nombres de escuela que no están en el corpus.`,
    'Inteligencia emocional': `Inteligencia emocional bíblica en ${ref}: ${cita} nombra el afecto sin justificar el pecado. Dominio propio, empatía y verdad conviven (Gá 5:22-23). Sentir no es norma; el Espíritu ordena el corazón. La práctica: confesar la emoción, someterla al texto, responder hoy con una palabra, un límite o un servicio. No hay gurú clínico aquí: hay fruto del Espíritu.`,
    Neuroplasticidad: `Neuroplasticidad, como descripción del diseño, encaja con la renovación de ${ref}. ${cita} pide repetición de la verdad (Ro 12:2; Sal 1): atención sostenida reconfigura hábitos. La metanoia no es truco de bienestar; es obediencia ilustrada. Un paso: un pensamiento automático que este verso corrige, sustituido por el texto durante días, en oración y comunidad. Sin autores clínicos ficticios.`,
    Metanoia: `Metanoia en ${ref}: ${cita} llama a cambio de mente, no a remordimiento cosmética (Mr 1:15; Ro 12:2). Arrepentimiento y fe bajo la Palabra. El nous se renueva por el Espíritu, no por técnica. El siglo imprime un molde; el evangelio transforma la forma. Conclusión práctica: abandonar un esquema de este eón y asentir de nuevo a Cristo hoy.`,
  };
  return map[topic] || `Análisis RevelatiO de «${topic}» en ${ref}: ${cita} se lee bajo autoridad de la Escritura, centrado en Cristo, sin sustituir el texto por comentario histórico ni por psicología secular.`;
}

function conclusionFallback(office, { ref, texto }) {
  const cita = citaVerso(texto, ref);
  if (office.id === 'bucle') {
    return `Conclusión Revelatio: en ${ref}, ${cita} renueva la mente bajo la Palabra. Neurociencia y hábitos describen el diseño; la metanoia es arrepentimiento y fe. El Padre habla, el Hijo es la verdad, el Espíritu guía. Nada de autores clínicos inventados: obediencia gozosa hoy.`;
  }
  if (office.id === 'evangelio') {
    return `Conclusión Revelatio: ${ref} predica a Cristo y la gracia. ${cita} no produce mérito; revela necesidad y provee al Hijo. Cree de nuevo el evangelio que capacita lo que el texto manda.`;
  }
  if (office.id === 'hilo') {
    return `Conclusión Revelatio: ${ref} se sostiene en el hilo del pacto. ${cita} es eslabón de la fidelidad de Dios, cumplida en la sangre del nuevo pacto. Vive hoy como heredero, no como contratista.`;
  }
  if (office.id === 'objecion') {
    return `Conclusión Revelatio: ${ref} defiende la fe pública. ${cita} ancla veracidad y cosmovisión en el Dios que habla. Responde con mansedumbre; no cedas la cruz.`;
  }
  return `Conclusión Revelatio: ${ref} se abre por exégesis, hermenéutica y lenguas. ${cita} permanece. Lee, cree y obedece bajo el Padre, el Hijo y el Espíritu.`;
}

function glosaDesdeContexto(ctx) {
  const strongs = Array.isArray(ctx?.strongs) ? ctx.strongs : [];
  if (!strongs.length) {
    const plano = textoPlano(ctx?.planoOriginal);
    if (plano) {
      return `Glosa: texto original verificado — ${plano}. Aún no hay equivalentes españoles catalogados para estas raíces; el análisis de Lenguas pesa el contexto, no un lema inventado.`;
    }
    return `Glosa: no hay raíces Strong verificadas para este pasaje en el léxico local. El oficio Palabra no finge una glosa ni declara timeout: se espera el original y se lee el sentido en el contexto castellano del versículo.`;
  }
  const lineas = strongs.slice(0, 8).map((d) => {
    const glosa = glosaEspanol(
      d.traduccionEstricta || d.definicionEs || d.definicionCorta || (d.definicion || '').split('\n')[0] || '',
      d.codigo
    );
    return `${d.codigo} ${d.lexema || d.lemma || ''} (${d.transliteracion || d.translit || ''}): ${glosa}`;
  });
  return `Glosa (Strong, español):\n${lineas.join('\n')}`;
}

function henryCitaSiExiste(ref) {
  const pack = armarRespuestaComentario('matthew-henry', ref);
  const clip = recortarCita(pack?.cuerpo || pack?.entradas?.[0]?.texto || '');
  if (!clip || pack?.vacio) return null;
  return {
    autor: pack.titulo || 'Matthew Henry',
    obra: pack.obra || 'Exposition of the Old and New Testament',
    texto: clip,
  };
}

function ensamblarOficio(office, { ref, texto, ctx, iaTopics, iaConclusion }) {
  const topics = office.topics.map((title) => {
    const hit = (iaTopics || []).find((t) => textoPlano(t?.title) === title);
    let analysis = textoPlano(hit?.analysis);
    if (!analysis || pareceHenryDump(analysis) || (office.id === 'bucle' && pareceAutorClinicoFalso(analysis))) {
      analysis = analisisFallback(office, title, { ref, texto });
    }
    return { title, analysis };
  });

  let conclusion = textoPlano(iaConclusion);
  if (!conclusion || !/conclusi[oó]n revelatio/i.test(`Conclusión Revelatio ${conclusion}`)) {
    conclusion = conclusionFallback(office, { ref, texto });
  }
  if (!/^conclusi[oó]n revelatio/i.test(conclusion)) {
    conclusion = `Conclusión Revelatio: ${conclusion.replace(/^conclusi[oó]n[:\s]*/i, '')}`;
  }

  const beats = {};
  if (office.strong) {
    beats.glosa = glosaDesdeContexto(ctx) || formatearLexico(ctx || { etiqueta: ref });
  }
  if (office.tsk) {
    beats.tsk = TSK_LOCAL(ref, texto);
    if (ctx?.texto && Array.isArray(ctx.paralelos) && ctx.paralelos.length) {
      beats.tsk = formatearTsk(ctx, ctx.paralelos);
    }
  }

  const citation = office.henry ? henryCitaSiExiste(ref) : null;

  return {
    id: office.id,
    oficio: office.oficio,
    titulo: office.titulo,
    tags: office.tags,
    topics,
    conclusion,
    beats,
    citation,
    corpusLabel: citation ? citation.autor : null,
    henryClip: citation ? citation.texto : null,
    source: iaTopics?.length ? 'revelatio-ia' : 'revelatio-local',
  };
}

function pintarMarkdownOficio(data) {
  const partes = [`# ${data.titulo}`, `*${data.oficio} · ${data.tags.join(', ')}*`];
  for (const t of data.topics) {
    partes.push(`## ${t.title}`, t.analysis);
  }
  if (data.beats?.glosa) {
    partes.push('## Glosa', data.beats.glosa);
  }
  if (data.beats?.tsk) {
    partes.push('## TSK', data.beats.tsk);
  }
  partes.push('## Conclusión Revelatio', data.conclusion);
  if (data.citation?.texto) {
    partes.push(`Cita · ${data.citation.autor}: «${data.citation.texto}»`);
  }
  return partes.join('\n\n');
}

async function intentarIA(office, { ref, texto, ctx }) {
  if (!hayMotorIA()) return null;
  const temas = office.topics.map((t) => `"${t}"`).join(', ');
  const strongHint = office.strong && ctx?.strongs?.length
    ? `Léxico Strong verificado:\n${ctx.strongs
        .slice(0, 8)
        .map((s) => `${s.codigo} ${s.lexema || ''} = ${s.traduccionEstricta || s.definicionCorta || ''}`)
        .join('\n')}`
    : '';
  const prompt = `Eres RevelatiO IA (Éfata). Autoridad final: la Escritura.
Oficio: ${office.oficio}. Lente: ${office.titulo}.
Pasaje: ${ref}. Texto: ${texto || '(sin texto cargado)'}.
${strongHint}

Devuelve SOLO JSON:
{"topics":[{"title":"","analysis":""}],"conclusion":""}

Reglas inquebrantables:
- topics DEBE tener exactamente estos títulos, en este orden: ${temas}.
- El título "Hermenéutica" (si aparece) se escribe exactamente Hermenéutica.
- El título de la lente Ciencia y mente, si se nombra, se escribe exactamente Ciencia y mente.
- Bajo cada title, "analysis" es análisis RevelatiO estricto de ESE título aplicado a ${ref}. No volcar comentario de Estudio ni de Matthew Henry.
- conclusion: una sola pieza que empiece con las palabras Conclusión Revelatio.
- Prohibido autores clínicos inventados. Prohibido presentar a Henry como el cuerpo.
- Español pastoral, 1 párrafo por tema (80-140 palabras).`;

  try {
    const data = await Promise.race([
      generarJSON(prompt, { reintentos: 0, maxOutputTokens: 2200 }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('IA oficio timeout')), 14000)),
    ]);
    const topics = Array.isArray(data?.topics) ? data.topics : [];
    if (!topics.length) return null;
    return { topics, conclusion: textoPlano(data?.conclusion) };
  } catch (err) {
    console.warn(`[lentes-oficios] IA ${office.id}:`, err?.message || err);
    return null;
  }
}

export function fallbackOficio(office, ctx = {}) {
  const ref = ctx.etiqueta || ctx.ref || 'el pasaje';
  const texto = ctx.texto || '';
  return ensamblarOficio(office, { ref, texto, ctx, iaTopics: null, iaConclusion: null });
}

export async function generarOficioRevelatio({ passage, verseText, oficio, officeId, ctx: ctxIn, localOnly = false } = {}) {
  const office = officeOf(oficio || officeId) || OFICIOS[0];
  const ctx =
    ctxIn ||
    (await contextoConsulta(passage || 'Romanos 12:2').catch(() => ({
      etiqueta: String(passage || 'Romanos 12:2'),
      texto: String(verseText || ''),
      strongs: [],
    })));
  const ref = ctx.etiqueta || String(passage || '').trim() || 'el pasaje';
  const texto = String(verseText || ctx.texto || '').trim();
  const ia = localOnly ? null : await intentarIA(office, { ref, texto, ctx });
  return ensamblarOficio(office, {
    ref,
    texto,
    ctx,
    iaTopics: ia?.topics,
    iaConclusion: ia?.conclusion,
  });
}

export async function generarTodosLosOficios({ passage, verseText, localOnly = false } = {}) {
  const ctx = await contextoConsulta(passage || 'Romanos 12:2').catch(() => ({
    etiqueta: String(passage || 'Romanos 12:2'),
    texto: String(verseText || ''),
    strongs: [],
  }));
  if (verseText && !ctx.texto) ctx.texto = verseText;

  const oficios = await Promise.all(
    OFICIOS.map(async (office) => {
      const ia = localOnly ? null : await intentarIA(office, {
        ref: ctx.etiqueta,
        texto: ctx.texto,
        ctx,
      });
      return ensamblarOficio(office, {
        ref: ctx.etiqueta,
        texto: ctx.texto,
        ctx,
        iaTopics: ia?.topics,
        iaConclusion: ia?.conclusion,
      });
    })
  );
  return {
    passage: ctx.etiqueta,
    verseText: ctx.texto || '',
    oficios,
  };
}

export function oficioComoRespuestaHttp(data) {
  const answer = pintarMarkdownOficio(data);
  return {
    success: true,
    ok: true,
    oficio: data,
    data,
    answer,
    text: answer,
    result: answer,
    respuesta: answer,
    source: data.source,
    meta: {
      officeId: data.id,
      titulo: data.titulo,
      citation: data.citation || null,
      henryInjected: Boolean(data.citation?.texto),
    },
  };
}
