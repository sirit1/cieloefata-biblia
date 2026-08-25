import { generateText, streamText } from 'ai';
import { google } from '@ai-sdk/google';
import {
  SYSTEM_PROMPT,
  AI_TEMPERATURE,
  FALLBACK_FUERA_DE_MARCO,
  respuestaSiFueraDeMarco,
} from '../lib/prompts/revelatio-system-prompt.js';

export const runtime = 'edge';

export async function POST(req) {
  try {
    const { prompt, context, type } = await req.json();

    if (!prompt && !context) {
      return new Response(JSON.stringify({ error: 'Parámetros insuficientes' }), { status: 400 });
    }

    // Léxico interlinear: precisión filológica (no es consulta pastoral abierta).
    if (type === 'interlinear_resolve') {
      const result = await generateText({
        model: google('gemini-1.5-flash'),
        system: 'Eres un diccionario léxico morfológico de precisión en Griego/Hebreo al servicio de la exégesis bíblica. Responde exclusivamente JSON válido, sin markdown ni comentarios.',
        prompt: `Analiza exactamente el término ${String(prompt).slice(0, 120)} en el contexto del versículo ${String(context || 'no indicado').slice(0, 240)}. Devuelve SOLO este JSON: {"original":"grafía griega o hebrea","transliteration":"transliteración y pronunciación","strong":"G0000 o H0000","morphology":"análisis gramatical formal","meaning":"definición exegética y traducción literal al español","metanoia":"aplicación bajo la cruz y la Escritura, sin autoayuda"}. No dejes campos vacíos.`,
        temperature: AI_TEMPERATURE,
        maxOutputTokens: 700,
      });
      const cleaned = result.text.replace(/^```(?:json)?\s*|\s*```$/gi, '').trim();
      let data;
      try { data = JSON.parse(cleaned); } catch (_) { data = { original: String(prompt), transliteration: 'No se pudo estructurar la transliteración.', strong: '', morphology: 'No se pudo estructurar la morfología.', meaning: cleaned, metanoia: 'Vuelve al texto y discierne qué pensamiento necesita ser renovado bajo la cruz.' }; }
      return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
    }

    const cleanMessage = String(prompt || '').trim();
    const fuera = respuestaSiFueraDeMarco(cleanMessage);
    if (fuera) {
      return new Response(FALLBACK_FUERA_DE_MARCO, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'X-Revelatio-Gated': 'fuera_de_marco',
        },
      });
    }

    let dynamicPrompt = prompt;
    if (context) {
      dynamicPrompt = `[Contexto Bíblico: ${context}]\nConsulta: ${prompt}`;
    }

    const result = streamText({
      model: google('gemini-1.5-flash'),
      system: SYSTEM_PROMPT,
      prompt: dynamicPrompt,
      temperature: AI_TEMPERATURE,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || 'Error en el servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
