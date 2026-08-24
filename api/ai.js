/**
 * Éfata RevelatiO — api/ai.js
 * Endpoint unificado para Lentes / RevelatiO IA.
 * Siempre responde 200 + { success: true, answer } (fallback teológico garantizado).
 */
function structuredFallback(ref, title) {
  const passage = ref || 'Pasaje Seleccionado';
  const lens = title || 'Análisis Bíblico';
  return (
    `**1. Exégesis & Gracia:**\n` +
    `En este pasaje (${passage}), bajo el enfoque «${lens}», la doctrina se orienta a la suficiencia de la obra consumada de Cristo, derribando cualquier intento de auto-justificación legalista o mérito humano.\n\n` +
    `**2. Metanoia & Renovación:**\n` +
    `Desarma los esquemas mentales basados en la carne y reconfigura los afectos hacia la confianza soberana en el favor divino (Ro. 12:2).\n\n` +
    `**3. Criterio de Decisión:**\n` +
    `Purifica las intenciones eliminando motivaciones de vanagloria o temor circunstancial. La decisión debe tomarse desde el reposo y la integridad moral, no desde la urgencia de la carne.`
  );
}

async function callGemini(apiKey, { ref, title, prompt }) {
  const text = `Eres RevelatiO IA, un teólogo bíblico y mentor de metanoia cristiana clásica/reformada.
Analiza el siguiente pasaje: "${ref}" bajo el enfoque "${title}".
Petición específica: "${prompt}"

Estructura tu respuesta exactamente en 3 bloques concisos:
1. EXÉGESIS & GRACIA: Sentido del original y centralidad de Cristo.
2. METANOIA & RENOVACIÓN MENTAL: Qué patrón de pensamiento o sesgo corrige.
3. CRITERIO DE DECISIÓN & ACCIÓN: Principio práctico no negociable para la vida diaria.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text }] }],
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error?.message || `Gemini ${response.status}`);
  }
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

export async function generateLensAnswer(body = {}) {
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
  const lensId = typeof body.lensId === 'string' ? body.lensId.trim() : '';
  const ref = passage || 'Pasaje Seleccionado';
  const query = prompt || `Analiza ${ref} bajo ${lensTitle}`;

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  let answer = '';

  if (apiKey) {
    try {
      answer = await callGemini(apiKey, { ref, title: lensTitle, prompt: query });
    } catch (geminiError) {
      console.warn(
        '[api/ai] Fallo Gemini, aplicando respuesta teológica estructurada:',
        geminiError?.message || geminiError
      );
    }
  }

  if (!String(answer || '').trim()) {
    answer = structuredFallback(ref, lensTitle);
  }

  return {
    success: true,
    answer,
    respuesta: answer,
    result: answer,
    data: {
      comentarioExpositivo: answer,
      lensId: lensId || undefined,
      lensTitle,
      passage: ref,
    },
  };
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
    const payload = await generateLensAnswer(body);
    return res.status(200).json(payload);
  } catch (error) {
    console.error('[api/ai] Error interno:', error?.message || error);
    const passage = req.body?.passage || 'Escritura';
    const answer =
      `**Análisis Teológico (${passage}):**\n` +
      `La verdad bíblica revelada demanda someter los afectos carnales a la autoridad de Cristo y actuar con integridad renovada.`;
    return res.status(200).json({ success: true, answer, respuesta: answer, result: answer });
  }
}
