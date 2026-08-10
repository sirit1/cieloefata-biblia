import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { generarObjeto, hayMotorIA } from '../lib/ai.js';
import { parsearReferencia, obtenerOriginal, originalComoTextoPlano, strongsUnicos, obtenerDefinicionStrong } from '../lib/biblia.js';
import { consumirCuota, respuestaCuotaAgotada } from '../lib/quota.js';

const ESQUEMA_LENTE = z.object({
  titulo: z.string().describe('Título breve y atractivo para esta lente aplicada a la consulta.'),
  cuerpo: z.string().describe('Estudio amplio y profundo en español claro y pastoral, de 6 a 9 párrafos separados por salto de línea doble. Incluye observación del texto, interpretación desde la lente, referencias bíblicas verificables, límites de la lectura y aplicación concreta.'),
  destacado: z.string().describe('Una sola frase memorable que resuma la enseñanza clave.'),
});

const getSupabaseConfig = () => ({
  url: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  anonKey: process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

async function authenticate(req) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  const { url, anonKey } = getSupabaseConfig();
  if (!token || !url || !anonKey) return null;
  const supabase = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.auth.getUser(token);
  return error ? null : data.user;
}

// Lentes de estudio de RevelatiO IA. Cada una aborda la MISMA consulta
// desde una disciplina distinta, siempre bajo autoridad de la Escritura.
const LENTES = {
  teologia: {
    titulo: 'Teología',
    instruccion:
      'Analiza la consulta desde la teología sistemática y bíblica: qué revela sobre Dios (Padre, Hijo, Espíritu), su carácter, sus atributos, el pecado, la gracia, la salvación y la doctrina implicada. Cita doctrinas y referencias cruzadas.',
  },
  hermeneutica: {
    titulo: 'Hermenéutica bíblica',
    instruccion:
      'Aplica principios de interpretación bíblica: género literario, contexto histórico y cultural, contexto inmediato y canónico, intención del autor y cómo evitar malas interpretaciones. Explica cómo se debe leer correctamente el pasaje o tema. Después conecta esa interpretación con la neurociencia: distingue con claridad entre lo que afirma la Escritura y lo que la evidencia científica permite explicar sobre atención, memoria, hábitos, emoción y renovación de la mente. No fuerces equivalencias ni presentes hipótesis como hechos.',
  },
  inteligenciaEmocional: {
    titulo: 'Inteligencia emocional',
    instruccion:
      'Analiza cómo la consulta forma el reconocimiento, la regulación y la expresión responsable de las emociones delante de Dios. Distingue emoción de conducta, integra dominio propio, compasión, perdón y verdad bíblica, y ofrece prácticas concretas sin convertir la fe en una técnica psicológica.',
  },
  psicologia: {
    titulo: 'Psicología cristiana',
    instruccion:
      'Aborda la consulta desde la psicología cristiana: emociones, heridas, patrones de pensamiento, identidad y sanidad interior, siempre sometida a la verdad bíblica (nunca psicología secular como autoridad final). Explica cómo la verdad del texto sana la mente y el corazón.',
  },
  neurociencia: {
    titulo: 'Neurociencia',
    instruccion:
      'Explica, en lenguaje accesible, qué dice la neurociencia sobre lo que plantea la consulta: cómo el cerebro procesa creencias, hábitos, meditación, gratitud, perdón o temor, y cómo esto dialoga con la renovación de la mente que enseña la Escritura. Sé riguroso y no exageres afirmaciones científicas.',
  },
  neuroplasticidad: {
    titulo: 'Neuroplasticidad',
    instruccion:
      'Explica cómo el cerebro puede reconfigurar patrones (neuroplasticidad) y cómo la meditación en la Palabra, la repetición de la verdad y las prácticas espirituales renuevan literalmente la mente (Romanos 12:2). Da pasos concretos y sostenibles.',
  },
  antropologia: {
    titulo: 'Antropología bíblica',
    instruccion:
      'Analiza la consulta desde la antropología bíblica: qué es el ser humano según la Escritura (imagen de Dios, cuerpo-alma-espíritu), su caída, su dignidad, su propósito y su restauración en Cristo. Contrasta con visiones antropológicas seculares cuando sea útil.',
  },
  diaadia: {
    titulo: 'En tu día a día',
    instruccion:
      'Traduce la consulta en aplicaciones prácticas y concretas para la vida diaria del creyente: decisiones, relaciones, trabajo, familia, hábitos y luchas cotidianas. Da ejemplos realistas y pasos accionables para hoy.',
  },
  revelatio: {
    titulo: 'RevelatiO para ti',
    instruccion:
      'Redacta una recomendación pastoral, cálida y personal, desde un punto de vista bíblico estricto, dirigida directamente al lector ("tú"). Que sea un consejo espiritual concreto y edificante según lo que revela la consulta, llamando al arrepentimiento genuino, a la fe y a la renovación de la mente. Firma implícitamente como la voz de RevelatiO. Máximo 2 párrafos, íntimo y directo.',
  },
  consejeriaPastoral: { titulo: 'Consejería pastoral', instruccion: 'Aplica el pasaje al acompañamiento pastoral: escucha, discernimiento, límites, restauración y cuidado integral. Distingue consejo bíblico de diagnóstico clínico y termina con preguntas para acompañar a una persona.' },
  discipulado: { titulo: 'Discipulado', instruccion: 'Construye un itinerario de discipulado basado en el texto: qué debe creer, abandonar, practicar y enseñar un discípulo. Incluye etapas, preguntas y referencias bíblicas.' },
  predicacionExpositiva: { titulo: 'Predicación expositiva', instruccion: 'Ayuda a preparar una exposición fiel: idea central, contexto, estructura del texto, bosquejo, errores a evitar y aplicaciones para la congregación. No sustituyas la labor del predicador.' },
  liderazgoServidores: { titulo: 'Liderazgo de servidores', instruccion: 'Examina el liderazgo desde el carácter de Cristo, humildad, autoridad, servicio y rendición de cuentas. Aplica el texto a equipos de servidores y responsables ministeriales.' },
  formacionLideres: { titulo: 'Formación de líderes', instruccion: 'Extrae criterios bíblicos para identificar, formar, evaluar y acompañar líderes. Incluye carácter, doctrina, hábitos, mentoría y señales de madurez.' },
  cuidadoRebano: { titulo: 'Cuidado del rebaño', instruccion: 'Aplica el texto al pastoreo de una iglesia: presencia, visitación, protección, enseñanza, disciplina restaurativa y cuidado de los débiles.' },
  familiaPastoral: { titulo: 'Familia pastoral', instruccion: 'Lee la consulta desde la salud del hogar ministerial: matrimonio, hijos, descanso, límites, hospitalidad y coherencia entre ministerio público y vida privada.' },
  conflictoReconciliacion: { titulo: 'Conflicto y reconciliación', instruccion: 'Ofrece un marco bíblico para discernir, confrontar con gracia, escuchar, reparar el daño y buscar reconciliación sin encubrir pecado ni abuso.' },
  misionEvangelizacion: { titulo: 'Misión y evangelización', instruccion: 'Conecta la consulta con la misión de hacer discípulos: mensaje, encarnación, compasión, contexto cultural, conversación y llamado al arrepentimiento y la fe.' },
  apologetica: { titulo: 'Apologética', instruccion: 'Prepara una respuesta bíblica, razonable y humilde frente a objeciones relacionadas con la consulta. Reconoce límites, evita caricaturas y responde con mansedumbre.' },
  eticaMinisterial: { titulo: 'Ética ministerial', instruccion: 'Examina integridad, poder, dinero, sexualidad, confidencialidad, transparencia y rendición de cuentas a la luz del texto y de la responsabilidad de quienes sirven.' },
  juventud: { titulo: 'Ministerio con jóvenes', instruccion: 'Traduce la enseñanza a acompañamiento de adolescentes y jóvenes: identidad, presión cultural, pertenencia, hábitos digitales, vocación y comunidad, sin trivializar el texto.' },
  dueloCrisis: { titulo: 'Duelo y crisis', instruccion: 'Aplica el pasaje a la presencia pastoral en duelo y crisis: lamentación, esperanza, oración, comunidad y próximos pasos. No prometas resultados que la Escritura no promete.' },
};

// Autores/comentaristas reconocidos (obra mayormente de dominio público o
// posición teológica ampliamente documentada). La síntesis la elabora
// RevelatiO IA siguiendo la línea conocida de cada autor; se muestra una
// nota de transparencia en la interfaz.
const AUTORES = {
  'matthew-henry': 'Matthew Henry',
  'juan-calvino': 'Juan Calvino',
  'charles-spurgeon': 'Charles Spurgeon',
  'juan-wesley': 'Juan Wesley',
  'john-macarthur': 'John MacArthur',
  'william-barclay': 'William Barclay',
  'agustin-de-hipona': 'Agustín de Hipona',
  'juan-crisostomo': 'Juan Crisóstomo',
};

// Autores cuya obra es de dominio público (murieron hace más de 70 años):
// se puede exponer su interpretación histórica documentada con mayor detalle.
// MacArthur y Barclay son autores con obra bajo derechos de autor vigentes:
// jamás se debe presentar como cita textual entrecomillada, solo como línea
// teológica conocida y públicamente documentada (predicaciones, entrevistas).
const AUTORES_DOMINIO_PUBLICO = new Set(['matthew-henry', 'juan-calvino', 'charles-spurgeon', 'juan-wesley', 'agustin-de-hipona', 'juan-crisostomo']);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método no permitido.' });
  }

  const user = await authenticate(req);
  if (!user) return res.status(401).json({ error: 'Sesión inválida o vencida.' });
  const cuota = await consumirCuota(req, user, 'lente');
  if (!cuota.allowed) return cuota.reason ? respuestaCuotaAgotada(res, cuota) : res.status(cuota.status || 503).json({ error: cuota.error });

  const consulta = typeof req.body?.consulta === 'string' ? req.body.consulta.trim() : '';
  const lente = typeof req.body?.lente === 'string' ? req.body.lente.trim() : '';
  const autorKey = typeof req.body?.autor === 'string' ? req.body.autor.trim() : '';

  if (!consulta || consulta.length > 300) {
    return res.status(400).json({ error: 'Consulta inválida.' });
  }
  if (!hayMotorIA()) {
    return res.status(503).json({ error: 'El motor de IA todavía no está configurado.' });
  }

  const esAutor = lente === 'autores';
  if (!esAutor && !LENTES[lente]) {
    return res.status(400).json({ error: 'Lente no reconocida.' });
  }
  if (esAutor && !AUTORES[autorKey]) {
    return res.status(400).json({ error: 'Autor no reconocido.' });
  }

  const nombreAutor = esAutor ? AUTORES[autorKey] : '';
  const esDominioPublico = esAutor && AUTORES_DOMINIO_PUBLICO.has(autorKey);
  const instruccion = esAutor
    ? esDominioPublico
      ? `Redacta un comentario bíblico sobre la consulta SIGUIENDO FIELMENTE la línea teológica, el énfasis y el estilo documentado de ${nombreAutor} (autor de obra ya de dominio público). No inventes citas textuales entrecomilladas como si fueran transcripción literal; expón la interpretación en la voz y perspectiva histórica conocida de este autor. Debe ser exegético, fiel a su tradición y edificante.`
      : `Redacta un comentario bíblico sobre la consulta en la línea teológica y el énfasis AMPLIAMENTE DOCUMENTADO y públicamente conocido de ${nombreAutor} (autor con obra bajo derechos de autor vigentes). PROHIBIDO presentar frases como cita textual entrecomillada o atribuírsela como transcripci��n exacta de un libro suyo: solo describe su posición y enfoque conocidos (p. ej. su énfasis en la interpretación literal-histórica-gramatical si aplica), aclarando que es una síntesis de su línea, no una cita.`
    : LENTES[lente].instruccion;

  const titulo = esAutor ? `Comentario · ${nombreAutor}` : LENTES[lente].titulo;

  // Contexto real verificado: texto original (griego/hebreo con Strong's) +
  // definiciones léxicas reales, para que el comentario se apoye en datos
  // verificables en vez de que la IA invente el idioma original de memoria.
  let contextoOriginal = '';
  try {
    const ref = parsearReferencia(consulta);
    if (ref && ref.versoInicio) {
      const original = await obtenerOriginal(ref);
      if (original) {
        const plano = originalComoTextoPlano(original);
        const codigos = strongsUnicos(original).slice(0, 8);
        const definiciones = (await Promise.all(codigos.map((c) => obtenerDefinicionStrong(c).catch(() => null)))).filter(Boolean);
        const lineas = definiciones.map((d) => `${d.codigo}: ${d.lexema} (${d.transliteracion}) — ${d.definicionCorta || d.definicion.split('\n')[0]}`);
        contextoOriginal = `\n\nCONTEXTO REAL VERIFICADO (${original.etiqueta}): ${plano}\nDefiniciones léxicas reales (Strong's):\n${lineas.join('\n')}`;
      }
    }
  } catch (_e) { /* si falla, el comentario sigue sin este contexto extra */ }

  try {
    const data = await generarObjeto(`Eres RevelatiO IA, el motor de estudio bíblico de la plataforma RevelatiO by Efata (ministerio en español). Tu autoridad final SIEMPRE es la Escritura. La consulta del usuario es un pasaje o un tema.

TAREA (lente "${titulo}"): ${instruccion}

Genera el comentario siguiendo el esquema proporcionado. La respuesta debe ser inequívocamente distinta según la lente "${titulo}": no repitas un comentario genérico ni respondas desde otra disciplina. Comienza el análisis nombrando el ángulo propio de ${titulo} y desarrolla solo sus preguntas, conceptos y aplicaciones.

Reglas:
- "titulo": un título breve y atractivo para esta lente aplicada a la consulta.
- "cuerpo": redacta un estudio amplio, profundo y bien estructurado, en español claro y pastoral. Usa 6 a 9 párrafos separados por un salto de línea doble. Desarrolla: observación del texto, interpretación propia de la lente, referencias bíblicas verificables, conexión con la vida, límites y cautelas, y pasos concretos de obediencia. Si se te da un CONTEXTO REAL VERIFICADO más abajo, apóyate en ese griego/hebreo y en el número de Strong real en vez de inventarlo.
- "destacado": una sola frase memorable que resuma la enseñanza clave (para resaltar en pantalla).
- No inventes datos que no puedas sostener. Sé riguroso, cálido y edificante.
- PROHIBIDO usar LaTeX o notación matemática (nada de \\rightarrow, $...$, \\text). Usa palabras y flechas simples como "->".

Consulta: ${consulta}${contextoOriginal}`, { schema: ESQUEMA_LENTE, perfil: 'profundo', reintentos: 1, maxOutputTokens: 5200 });
    return res.status(200).json({
      success: true,
      data: {
        titulo: data.titulo || titulo,
        cuerpo: data.cuerpo || '',
        destacado: data.destacado || '',
        autor: nombreAutor || null,
        esDominioPublico: esAutor ? esDominioPublico : null,
      },
    });
  } catch (error) {
    console.error('Error en el motor de lentes:', error?.message);
    return res.status(200).json({
      success: true,
      data: {
        titulo: `${titulo} · ${consulta}`,
        cuerpo: `La perspectiva de ${titulo} no pudo completar la generación automática, pero esta consulta sigue abierta para un estudio específico desde esta disciplina.\n\nVuelve al texto de ${consulta} y observa aquello que corresponde a ${titulo}: formula una pregunta propia de esta lente, contrástala con el contexto bíblico y escribe una respuesta concreta de obediencia. Esta respuesta de continuidad no sustituye el estudio bíblico ni la comunidad de fe.`,
        destacado: `${titulo} pide volver a ${consulta} con una pregunta propia de esta disciplina.`,
        autor: nombreAutor || null,
        esDominioPublico: esAutor ? esDominioPublico : null,
      },
    });
  }
}
