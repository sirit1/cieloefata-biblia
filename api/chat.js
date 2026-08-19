import { generateText, streamText } from 'ai';
import { google } from '@ai-sdk/google';

export const runtime = 'edge';

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

export async function POST(req) {
  try {
    const { prompt, context, type } = await req.json();

    if (!prompt && !context) {
      return new Response(JSON.stringify({ error: 'Parámetros insuficientes' }), { status: 400 });
    }

    let dynamicPrompt = prompt;
    if (type === 'interlinear_resolve') {
      dynamicPrompt = `Proporciona el análisis léxico estricto del término "${prompt}" en el contexto de ${context}. Responde con formato JSON puro sin bloques markdown con esta estructura exacta:
      {"original":"...","transliteration":"...","strong":"...","morphology":"...","meaning":"...","metanoia":"..."}`;
    } else if (context) {
      dynamicPrompt = `[Contexto Bíblico: ${context}]\nConsulta: ${prompt}`;
    }

    if (type === 'interlinear_resolve') {
      const result = await generateText({
        model: google('gemini-1.5-flash'),
        system: 'Eres un diccionario léxico morfológico de precisión en Griego/Hebreo. Responde exclusivamente JSON válido, sin markdown ni comentarios.',
        prompt: `Analiza exactamente el término ${String(prompt).slice(0, 120)} en el contexto del versículo ${String(context || 'no indicado').slice(0, 240)}. Devuelve SOLO este JSON: {"original":"grafía griega o hebrea","transliteration":"transliteración y pronunciación","strong":"G0000 o H0000","morphology":"análisis gramatical formal","meaning":"definición exegética y traducción literal al español","metanoia":"aplicación práctica de renovación mental"}. No dejes campos vacíos.`,
        temperature: 0.15,
        maxOutputTokens: 700,
      });
      const cleaned = result.text.replace(/^```(?:json)?\s*|\s*```$/gi, '').trim();
      let data;
      try { data = JSON.parse(cleaned); } catch (_) { data = { original: String(prompt), transliteration: 'No se pudo estructurar la transliteración.', strong: '', morphology: 'No se pudo estructurar la morfología.', meaning: cleaned, metanoia: 'Vuelve al texto y discierne qué pensamiento necesita ser renovado.' }; }
      return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
    }

    const result = streamText({
      model: google('gemini-1.5-flash'),
      system: SYSTEM_PROMPT,
      prompt: dynamicPrompt,
      temperature: 0.3,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || 'Error en el servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
