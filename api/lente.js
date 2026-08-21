import { createClient } from '@supabase/supabase-js';
import { generarJSON, hayMotorIA } from '../lib/ai.js';
import { parsearReferencia, obtenerOriginal, originalComoTextoPlano, strongsUnicos, obtenerDefinicionStrong } from '../lib/biblia.js';

const getSupabaseConfig = () => ({
  url: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  anonKey: process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
});

function getCacheClient() {
  const { url, serviceRoleKey } = getSupabaseConfig();
  if (!url || !serviceRoleKey) return null;
  return createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

// El motor IA usa un JSON libre (sin schema estricto) y ocasionalmente
// devuelve "cuerpo"/"titulo"/"destacado" como objeto anidado en vez de
// texto plano (p. ej. {introduccion:"...", desarrollo:"..."}). Esta función
// aplana cualquier forma inesperada a un string legible para evitar que la
// interfaz muestre literalmente "[object Object]".
function aplanarTexto(valor) {
  if (valor == null) return '';
  if (typeof valor === 'string') return valor;
  if (typeof valor === 'number' || typeof valor === 'boolean') return String(valor);
  if (Array.isArray(valor)) return valor.map(aplanarTexto).filter(Boolean).join('\n\n');
  if (typeof valor === 'object') {
    return Object.values(valor).map(aplanarTexto).filter(Boolean).join('\n\n');
  }
  return String(valor);
}

function buildCacheKey(consulta, lente, autorKey) {
  return [consulta.trim().toLowerCase(), lente.trim().toLowerCase(), autorKey.trim().toLowerCase()].join('::');
}

async function readCachedLente(cacheKey) {
  try {
    const client = getCacheClient();
    if (!client) return null;
    const { data } = await client.from('ai_lente_cache').select('data').eq('cache_key', cacheKey).maybeSingle();
    return data?.data || null;
  } catch (_error) {
    return null;
  }
}

async function writeCachedLente(cacheKey, data) {
  try {
    const client = getCacheClient();
    if (!client) return;
    await client.from('ai_lente_cache').upsert({ cache_key: cacheKey, data, created_at: new Date().toISOString() });
  } catch (_error) {
    // La caché nunca debe bloquear una respuesta válida del motor IA.
  }
}

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
  hermeneuticaNeurociencia: {
    titulo: 'Hermenéutica + neurociencia',
    instruccion:
      'Integra dos pasos inseparables. Primero interpreta el pasaje con hermenéutica bíblica histórico-gramatical: género, contexto histórico-cultural, contexto inmediato y canónico, intención del autor y límites de interpretación. Después conecta esa lectura con la neurociencia actual: atención, memoria, emoción, hábitos, regulación del estrés y aprendizaje. Separa explícitamente el fundamento teológico de la explicación científica, cita referencias bíblicas concretas, no inventes estudios y no uses la neurociencia para “probar” la doctrina. Termina con una aplicación prudente para la renovación de la mente.',
  },
  psicologia: {
    titulo: 'Psicología cristiana',
    instruccion:
      'Aborda la consulta desde la psicología cristiana: emociones, heridas, patrones de pensamiento, identidad y sanidad interior, siempre sometida a la verdad bíblica (nunca psicología secular como autoridad final). Explica cómo la verdad del texto sana la mente y el corazón.',
  },
  inteligenciaEmocional: {
    titulo: 'Inteligencia emocional',
    instruccion:
      'Analiza la consulta desde la inteligencia emocional a la luz de la Escritura: identifica emociones, detonantes, respuestas impulsivas, autoconocimiento, dominio propio, empatía y relaciones. Distingue emoción de conducta y conecta cada aplicación con principios bíblicos concretos, sin convertir el análisis en diagnóstico clínico ni presentar psicología secular como autoridad final.',
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
      'Redacta un comentario pastoral, cálido y personal, dirigido directamente al lector ("tú"), según el tema concreto de la consulta. Explica cómo, a través del testimonio conjunto de la Biblia, Dios obra la restauración de la mente, el corazón, la identidad, las relaciones y la manera de vivir; conecta esa restauración con Cristo, el arrepentimiento genuino, la fe, la obediencia y la renovación de la mente. No escribas una frase genérica: aplica la restauración al tema consultado y cita referencias bíblicas pertinentes. Máximo 3 párrafos, íntimo, claro y directo.',
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
  raizHistorica: {
    titulo: 'Raíz Histórica',
    instruccion: 'Analiza la consulta desde el testimonio histórico de la iglesia y la exégesis clásica. Expón contexto, palabras clave, referencias cruzadas y cómo la lectura de comentaristas de dominio público ilumina el pasaje. No inventes citas textuales: presenta una síntesis transparente y distingue la Escritura de la interpretación histórica.',
  },
  metanoiaMente: {
    titulo: 'Metanoia & Mente',
    instruccion: 'Conecta la consulta con la metanoia y la renovación de la mente. Integra psicología cristiana y neuroplasticidad con prudencia: identifica pensamientos, emociones, hábitos y prácticas concretas, separando claramente lo que afirma la Escritura de lo que la ciencia puede explicar. Termina con un paso pequeño y practicable.',
  },
  oracionPractica: {
    titulo: 'Oración & Práctica',
    instruccion: 'Convierte la consulta en una respuesta vivida delante de Dios. Explica una aplicación concreta para hoy, propone una oración breve y específica, y ofrece una práctica sencilla para sostenerla durante la semana. Mantén el foco en Cristo, obediencia, comunidad y esperanza, sin frases genéricas.',
  },
};

// Comentaristas reconocidos, todos de obra 100% de dominio público (murieron
// hace más de 70 años): se descartó deliberadamente a cualquier autor con
// derechos de autor vigentes (p. ej. John MacArthur) para no atribuirle
// contenido generado por IA. La síntesis la elabora RevelatiO IA siguiendo
// la línea documentada de cada autor; se muestra una nota de transparencia
// en la interfaz.
const AUTORES = {
  'jamieson-fausset-brown': 'Jamieson-Fausset-Brown',
  'matthew-henry': 'Matthew Henry',
  'albert-barnes': 'Albert Barnes',
  'charles-spurgeon': 'Charles Spurgeon',
};

const AUTORES_DOMINIO_PUBLICO = new Set(Object.keys(AUTORES));

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método no permitido.' });
  }

  const user = await authenticate(req);
  if (!user) return res.status(401).json({ error: 'Sesión inválida o vencida.' });

  const consulta = typeof req.body?.consulta === 'string' ? req.body.consulta.trim() : '';
  const lente = typeof req.body?.lente === 'string' ? req.body.lente.trim() : '';
  const autorKey = typeof req.body?.autor === 'string' ? req.body.autor.trim() : '';

  if (!consulta || consulta.length > 300) {
    return res.status(400).json({ error: 'Consulta inválida.' });
  }
  if (!hayMotorIA()) {
    return res.status(503).json({ error: 'RevelatiO IA todavía no está configurado.' });
  }

  const esAutor = lente === 'autores';
  if (!esAutor && !LENTES[lente]) {
    return res.status(400).json({ error: 'Lente no reconocida.' });
  }
  if (esAutor && !AUTORES[autorKey]) {
    return res.status(400).json({ error: 'Autor no reconocido.' });
  }

  const cacheKey = buildCacheKey(consulta, lente, autorKey);
  const cachedData = await readCachedLente(cacheKey);
  if (cachedData) {
    return res.status(200).json({ success: true, data: cachedData, cached: true });
  }

  const nombreAutor = esAutor ? AUTORES[autorKey] : '';
  const esDominioPublico = esAutor && AUTORES_DOMINIO_PUBLICO.has(autorKey);
  const instruccion = esAutor
    ? `Redacta un comentario bíblico sobre la consulta SIGUIENDO FIELMENTE la línea teológica, el énfasis y el estilo documentado de ${nombreAutor} (autor de obra ya de dominio público). No inventes citas textuales entrecomilladas como si fueran transcripción literal; expón la interpretación en la voz y perspectiva histórica conocida de este autor. Debe ser exegético, fiel a su tradición y edificante.`
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
    const data = await generarJSON(`Eres RevelatiO IA, el motor de estudio bíblico de la plataforma RevelatiO by Efata (ministerio en español). Tu autoridad final SIEMPRE es la Escritura. La consulta del usuario es un pasaje o un tema.

TAREA (lente "${titulo}"): ${instruccion}

Responde ÚNICAMENTE con JSON válido y esta estructura exacta:
{"titulo":"","cuerpo":"","destacado":""}

Reglas:
- "titulo": un título breve y atractivo para esta lente aplicada a la consulta.
- "cuerpo": el desarrollo, en español claro y pastoral. Usa 2 a 4 párrafos separados por un salto de línea doble. Incluye referencias bíblicas concretas cuando aporten. Si se te da un CONTEXTO REAL VERIFICADO más abajo, apóyate en ese griego/hebreo y en el número de Strong real en vez de inventarlo.
- "destacado": una sola frase memorable que resuma la enseñanza clave (para resaltar en pantalla).
- No inventes datos que no puedas sostener. Sé riguroso, cálido y edificante.
- PROHIBIDO usar LaTeX o notación matemática (nada de \\rightarrow, $...$, \\text). Usa palabras y flechas simples como "->".

Consulta: ${consulta}${contextoOriginal}`);
    const responseData = {
      titulo: aplanarTexto(data.titulo) || titulo,
      cuerpo: aplanarTexto(data.cuerpo),
      destacado: aplanarTexto(data.destacado),
      autor: nombreAutor || null,
      esDominioPublico: esAutor ? esDominioPublico : null,
    };
    await writeCachedLente(cacheKey, responseData);
    return res.status(200).json({ success: true, data: responseData, cached: false });
  } catch (error) {
    console.error('Error en el motor de lentes:', error?.message);
    if (error?.code === 'RATE_LIMIT') {
      return res.status(429).json({ error: 'RevelatiO IA está recibiendo muchas consultas. Espera unos segundos e inténtalo de nuevo.' });
    }
    return res.status(502).json({ error: 'No fue posible generar esta lente. Intenta nuevamente.' });
  }
}
