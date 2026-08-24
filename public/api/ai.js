/**
 * Éfata RevelatiO — api/ai.js
 * Motor universal dinámico: lentes, exégesis asistida, TSK y léxico.
 * Tipado por `type` | path. Gemini opcional; fallback estructurado garantizado.
 */

function foldType(raw, pathname = '') {
  const t = String(raw || '').toLowerCase().trim();
  if (t === 'commentary' || t === 'comentario' || t === 'classical') return 'commentary';
  if (t === 'tsk' || t === 'xref' || t === 'cross') return 'tsk';
  if (t === 'lexicon' || t === 'lexico' || t === 'strong' || t === 'strongs') return 'lexicon';
  if (t === 'lens' || t === 'lente' || t === 'vida') return 'lens';
  if (pathname.includes('tsk')) return 'tsk';
  if (pathname.includes('lexicon') || pathname.includes('lexico')) return 'lexicon';
  if (pathname.includes('exegesis') || pathname.includes('comentario')) return 'commentary';
  if (pathname.includes('lente')) return 'lens';
  return 'lens';
}

function buildSystemInstruction({ type, passage, author, lensTitle, prompt }) {
  const ref = passage || 'el pasaje indicado';
  if (type === 'commentary') {
    const voice = author || 'Matthew Henry';
    return `Eres un historiador y teólogo exegético al servicio de Éfata RevelatiO.
Redacta una exposición densa, versículo por versículo, en español, para ${ref}.
Inspírate en la tradición y énfasis de ${voice}, PERO:
- NO inventes citas textuales entrecomilladas atribuidas al autor.
- NO digas "Matthew Henry escribió…" como si fuera transcripción de una edición impresa.
- Preséntalo como exposición asistida al estilo histórico-exegético clásico.
Incluye: contexto histórico-literario, sentido del texto, hilos doctrinales (gracia/Cristo) y aplicaciones pastorales.
Prohibido relleno genérico de libro. Consulta: ${prompt || ref}`;
  }
  if (type === 'tsk') {
    return `Eres un motor de referencias cruzadas canónicas (Treasury of Scripture Knowledge).
Para el pasaje ${ref}, genera un árbol de 3 a 5 temas doctrinales con pasajes bíblicos paralelos exactos (AT y NT), explicando brevemente la conexión teológica en español.
Formato preferido:
### Tema
- Pasaje — conexión breve
Consulta: ${prompt || ref}`;
  }
  if (type === 'lexicon') {
    return `Eres un lexicógrafo bíblico experto en Hebreo y Griego (Concordancia Strong).
Para el pasaje ${ref}, extrae 3 a 5 términos originales clave con:
Código Strong (H#### o G####), palabra original, transliteración fonética, categoría gramatical y Traducción Estricta al Español (glosa).
Responde en español, claro y verificable. Si no estás seguro de un código Strong, indícalo.
Consulta: ${prompt || ref}`;
  }
  const title = lensTitle || 'Análisis Bíblico';
  return `Eres RevelatiO IA, mentor teológico y de transformación mental (Metanoia, Ro. 12:2).
Analiza ${ref} bajo el enfoque "${title}".
Estructura la respuesta en 3 bloques:
1. Exégesis y Gracia (sentido del original y centralidad de Cristo)
2. Metanoia y Renovación Mental (sesgos o patrones que desarma)
3. Criterio de Decisión (aplicación práctica intransigente)
Consulta: ${prompt || ref}`;
}

function structuredFallback(type, ref, title) {
  const passage = ref || 'Pasaje Seleccionado';
  if (type === 'tsk') {
    return (
      `### Paralelos canónicos de ${passage}\n\n` +
      `- **Santiago 3:14-18** — Contraste entre sabiduría terrenal y sabiduría de lo alto.\n` +
      `- **Gálatas 5:16-17** — La carne y el Espíritu se oponen en los deseos.\n` +
      `- **Romanos 12:1-2** — Renovación de la mente como culto racional.\n` +
      `- **1 Pedro 2:11** — Deseos carnales que batallan contra el alma.`
    );
  }
  if (type === 'lexicon') {
    return (
      `**Léxico contextual de ${passage}**\n\n` +
      `1. **Código:** consultar Strong según lengua del pasaje\n` +
      `   **Glosa ES:** término clave del versículo activo\n` +
      `   **Nota:** Conecta el original con el uso canónico en su contexto inmediato.\n\n` +
      `2. **Enfoque:** morfología + sentido teológico (gracia / metanoia)\n` +
      `3. **Aplicación:** decide a la luz del significado estricto, no de la conjetura.`
    );
  }
  if (type === 'commentary') {
    return (
      `**Exposición asistida de ${passage}**\n\n` +
      `1. **Contexto:** El texto confronta las motivaciones humanas bajo la soberanía de Dios.\n` +
      `2. **Exégesis:** El sentido literario apunta a la gracia que capacita la obediencia, no al mérito.\n` +
      `3. **Doctrina:** Cristo es el centro; la Escritura interpreta a la Escritura.\n` +
      `4. **Aplicación:** Sométete a la verdad revelada con integridad renovada (Ro. 12:2).`
    );
  }
  const lens = title || 'Análisis Bíblico';
  return (
    `**1. Exégesis & Gracia:**\n` +
    `En este pasaje (${passage}), bajo el enfoque «${lens}», la doctrina se orienta a la suficiencia de la obra consumada de Cristo.\n\n` +
    `**2. Metanoia & Renovación:**\n` +
    `Desarma esquemas mentales de la carne y reconfigura los afectos hacia la confianza soberana en la gracia (Ro. 12:2).\n\n` +
    `**3. Criterio de Decisión:**\n` +
    `Actúa desde el reposo y la integridad moral, no desde la urgencia de la carne.`
  );
}

async function callGemini(apiKey, systemInstruction) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: systemInstruction }] }],
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error?.message || `Gemini ${response.status}`);
  }
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

/**
 * Generador universal usado por /api/ai, /api/lente, /api/exegesis, /api/tsk, /api/lexicon
 */
export async function generateUniversalAnswer(body = {}, pathname = '') {
  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
  const passage =
    (typeof body.passage === 'string' && body.passage.trim()) ||
    (typeof body.consulta === 'string' && body.consulta.trim()) ||
    (typeof body.contextPassage === 'string' && body.contextPassage.trim()) ||
    '';
  const lensTitle =
    (typeof body.lensTitle === 'string' && body.lensTitle.trim()) ||
    (typeof body.lente === 'string' && body.lente.trim()) ||
    'Análisis Bíblico';
  const author =
    (typeof body.author === 'string' && body.author.trim()) ||
    (typeof body.autor === 'string' && body.autor.trim()) ||
    '';
  const lensId = typeof body.lensId === 'string' ? body.lensId.trim() : '';
  const type = foldType(body.type || body.mode, pathname);
  const ref = passage || 'Pasaje Seleccionado';

  const systemInstruction = buildSystemInstruction({
    type,
    passage: ref,
    author,
    lensTitle,
    prompt,
  });

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  let answer = '';
  let source = 'fallback';

  if (apiKey) {
    try {
      answer = await callGemini(apiKey, systemInstruction);
      if (String(answer || '').trim()) source = 'gemini';
    } catch (geminiError) {
      console.warn(
        '[api/ai] Fallo Gemini, aplicando respuesta estructurada:',
        geminiError?.message || geminiError
      );
    }
  }

  if (!String(answer || '').trim()) {
    answer = structuredFallback(type, ref, lensTitle);
    source = apiKey ? 'fallback-after-gemini' : 'fallback-no-key';
  }

  return {
    success: true,
    answer,
    respuesta: answer,
    result: answer,
    data: answer,
    type,
    source,
    meta: {
      passage: ref,
      lensTitle,
      author: author || undefined,
      lensId: lensId || undefined,
      assisted: type === 'commentary',
    },
  };
}

/** Compat con server.js anterior */
export async function generateLensAnswer(body = {}, pathname = '') {
  return generateUniversalAnswer(body, pathname);
}

export default async function handler(req, res) {
  res.setHeader?.('Content-Type', 'application/json; charset=utf-8');
  res.setHeader?.('Access-Control-Allow-Origin', '*');

  if (req.method === 'OPTIONS') {
    res.setHeader?.('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader?.('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    res.setHeader?.('Allow', 'POST');
    return res.status(405).json({ success: false, error: 'Método no permitido.' });
  }

  try {
    const body = req.body || {};
    const pathHint = req.url || req.path || '';
    const payload = await generateUniversalAnswer(body, pathHint);
    return res.status(200).json(payload);
  } catch (error) {
    console.error('[api/ai] Error interno:', error?.message || error);
    const passage = req.body?.passage || 'Escritura';
    const answer = structuredFallback('lens', passage, 'Análisis Bíblico');
    return res.status(200).json({
      success: true,
      answer,
      respuesta: answer,
      result: answer,
      data: answer,
    });
  }
}
