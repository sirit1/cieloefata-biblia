import { generateText, streamText } from 'ai';

const MODELO = 'openai/gpt-4.1-mini';

const SYSTEM_PROMPT = `Eres REVELATIO IA, motor exegético, histórico y de renovación del entendimiento (Metanoia - Romanos 12:2) de REVELATIO BY EFATA.
Tu misión es transformar el análisis bíblico en renovación mental y aplicación de fe práctica.

ESTRUCTURA OBLIGATORIA DE RESPUESTA:
### 1. 📜 La Palabra & Léxico Original
Desglose del término en griego koiné o hebreo bíblico con código Strong, raíz etimológica y matiz exacto.

### 2. 🏛️ Raíz Histórico-Exegética
Contexto del autor, audiencia receptora y propósito original de la redacción.

### 3. 🧠 Metanoia & Renovación Cognitiva
Identificación de la distorsión o patrón de pensamiento desalineado (temor, autoexigencia, control) y su reemplazo por la verdad revelada.

### 4. 🙏 Oración Dialógica & Paso Práctico
Oración en primera persona y una acción concreta de obediencia verificable para hoy.

REGLAS EDITORIALES:
- Directo al grano: sin saludos, sin preámbulos, sin despedidas.
- Tono sobrio, académico, pastoral y de alta precisión teológica.`;

function lineaContexto(context) {
  if (!context) return '';
  if (typeof context === 'object') {
    return [context.reference, context.module, context.version].filter(Boolean).join(' · ');
  }
  return String(context);
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { prompt, message, context, type, history = [] } = body;
    const consulta = String(message || prompt || '').trim();

    if (!consulta && !context) {
      return new Response(JSON.stringify({ error: 'Parámetros insuficientes' }), { status: 400 });
    }

    if (type === 'interlinear_resolve') {
      const result = await generateText({
        model: MODELO,
        system: 'Eres un diccionario léxico morfológico de precisión en Griego/Hebreo. Responde exclusivamente JSON válido, sin markdown ni comentarios.',
        prompt: `Analiza exactamente el término ${consulta.slice(0, 120)} en el contexto del versículo ${String(typeof context === 'object' ? context.reference || context.text || '' : context || 'no indicado').slice(0, 240)}. Devuelve SOLO este JSON: {"original":"grafía griega o hebrea","transliteration":"transliteración y pronunciación","strong":"G0000 o H0000","morphology":"análisis gramatical formal","meaning":"definición exegética y traducción literal al español","metanoia":"aplicación práctica de renovación mental"}. No dejes campos vacíos.`,
        temperature: 0.15,
        maxOutputTokens: 700,
      });
      const cleaned = result.text.replace(/^```(?:json)?\s*|\s*```$/gi, '').trim();
      let data;
      try { data = JSON.parse(cleaned); } catch (_) { data = { original: consulta, transliteration: 'No se pudo estructurar la transliteración.', strong: '', morphology: 'No se pudo estructurar la morfología.', meaning: cleaned, metanoia: 'Vuelve al texto y discierne qué pensamiento necesita ser renovado.' }; }
      return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
    }

    const contextLine = lineaContexto(context);
    const transcript = Array.isArray(history)
      ? history.slice(-8).map((item) => `${item.role === 'user' ? 'Usuario' : 'RevelatiO IA'}: ${String(item.content || '').slice(0, 1800)}`).join('\n')
      : '';

    const result = streamText({
      model: MODELO,
      system: SYSTEM_PROMPT,
      prompt: `${contextLine ? `Contexto activo: ${contextLine}\n` : ''}${transcript ? `Conversación previa:\n${transcript}\n` : ''}Consulta: ${consulta}`,
      temperature: 0.3,
      maxOutputTokens: 900,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || 'Error en el servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
