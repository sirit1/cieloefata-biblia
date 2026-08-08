import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

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
    titulo: 'Hermenéutica',
    instruccion:
      'Aplica principios de interpretación bíblica: género literario, contexto histórico y cultural, contexto inmediato y canónico, la intención del autor, y cómo evitar malas interpretaciones. Explica cómo se debe leer correctamente el pasaje o tema.',
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

export default async function handler(req, res) {
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
  if (!process.env.GEMINI_API_KEY) {
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
  const instruccion = esAutor
    ? `Redacta un comentario bíblico sobre la consulta SIGUIENDO FIELMENTE la línea teológica, el énfasis y el estilo documentado de ${nombreAutor}. No inventes citas textuales entrecomilladas ni números de página; expón la interpretación en la voz y perspectiva conocida de este autor. Debe ser exegético, fiel a su tradición y edificante.`
    : LENTES[lente].instruccion;

  const titulo = esAutor ? `Comentario · ${nombreAutor}` : LENTES[lente].titulo;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Eres RevelatiO IA, el motor de estudio bíblico de la plataforma RevelatiO by Efata (ministerio en español). Tu autoridad final SIEMPRE es la Escritura. La consulta del usuario es un pasaje o un tema.

TAREA (lente "${titulo}"): ${instruccion}

Responde ÚNICAMENTE con JSON válido y esta estructura exacta:
{"titulo":"","cuerpo":"","destacado":""}

Reglas:
- "titulo": un título breve y atractivo para esta lente aplicada a la consulta.
- "cuerpo": el desarrollo, en español claro y pastoral. Usa 2 a 4 párrafos separados por un salto de línea doble. Incluye referencias bíblicas concretas cuando aporten.
- "destacado": una sola frase memorable que resuma la enseñanza clave (para resaltar en pantalla).
- No inventes datos que no puedas sostener. Sé riguroso, cálido y edificante.
- PROHIBIDO usar LaTeX o notación matemática (nada de \\rightarrow, $...$, \\text). Usa palabras y flechas simples como "->".

Consulta: ${consulta}`,
      config: { responseMimeType: 'application/json' },
    });

    const data = JSON.parse(response.text);
    return res.status(200).json({
      success: true,
      data: {
        titulo: data.titulo || titulo,
        cuerpo: data.cuerpo || '',
        destacado: data.destacado || '',
        autor: nombreAutor || null,
      },
    });
  } catch (error) {
    console.error('Error en el motor de lentes:', error?.message);
    return res.status(502).json({ error: 'No fue posible generar esta lente. Intenta nuevamente.' });
  }
}
