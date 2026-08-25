import { generateText } from 'ai';
import {
  SYSTEM_PROMPT,
  AI_TEMPERATURE,
  FALLBACK_FUERA_DE_MARCO,
  respuestaSiFueraDeMarco,
} from '../lib/prompts/revelatio-system-prompt.js';
import {
  CHAT_MODEL,
  extractUserText,
  optionsResponse,
  chatJson,
  chatError,
  chatOk,
  CHAT_GATEWAY_FALLBACK,
} from '../lib/chat-contract.js';

export const runtime = 'edge';

export async function OPTIONS() {
  return optionsResponse();
}

export async function GET() {
  return chatJson({
    success: true,
    ok: true,
    ready: true,
    answer: 'Endpoint activo. Usa POST con { message } o { prompt }.',
  });
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const userText = extractUserText(body);
    const context = body?.context;
    const type = body?.type;

    if (!userText) {
      return chatError('Parámetros insuficientes', 400);
    }

    if (type === 'interlinear_resolve') {
      const result = await generateText({
        model: CHAT_MODEL,
        system: 'Eres un diccionario léxico morfológico de precisión en Griego/Hebreo al servicio de la exégesis bíblica. Responde exclusivamente JSON válido, sin markdown ni comentarios.',
        prompt: `Analiza exactamente el término ${userText.slice(0, 120)} en el contexto del versículo ${String(context || 'no indicado').slice(0, 240)}. Devuelve SOLO este JSON: {"original":"grafía griega o hebrea","transliteration":"transliteración y pronunciación","strong":"G0000 o H0000","morphology":"análisis gramatical formal","meaning":"definición exegética y traducción literal al español","metanoia":"aplicación bajo la cruz y la Escritura, sin autoayuda"}. No dejes campos vacíos.`,
        temperature: AI_TEMPERATURE,
        maxOutputTokens: 700,
      });
      const cleaned = String(result.text || '').replace(/^```(?:json)?\s*|\s*```$/gi, '').trim();
      if (!cleaned) return chatError('El modelo no devolvió análisis léxico.', 502);
      let data;
      try {
        data = JSON.parse(cleaned);
      } catch {
        data = {
          original: userText,
          transliteration: 'No se pudo estructurar la transliteración.',
          strong: '',
          morphology: 'No se pudo estructurar la morfología.',
          meaning: cleaned,
          metanoia: 'Vuelve al texto y discierne qué pensamiento necesita ser renovado bajo la cruz.',
        };
      }
      return chatJson(data);
    }

    const fuera = respuestaSiFueraDeMarco(userText);
    if (fuera) {
      return chatOk(FALLBACK_FUERA_DE_MARCO, { gated: true, reason: 'fuera_de_marco' });
    }

    let dynamicPrompt = userText;
    if (context) {
      const ctx =
        typeof context === 'string'
          ? context
          : [context.reference, context.module, context.version].filter(Boolean).join(' · ');
      if (ctx) dynamicPrompt = `[Contexto Bíblico: ${ctx}]\nConsulta: ${userText}`;
    }

    const result = await generateText({
      model: CHAT_MODEL,
      system: SYSTEM_PROMPT,
      prompt: dynamicPrompt,
      temperature: AI_TEMPERATURE,
      maxOutputTokens: 900,
    });
    const text = String(result.text || '').trim();
    if (!text) {
      return chatOk(CHAT_GATEWAY_FALLBACK, { source: 'empty-model-fallback' });
    }
    return chatOk(text, { gated: false, temperature: AI_TEMPERATURE });
  } catch (error) {
    console.error('[api/chat]', String(error?.message || error).replace(/\u001b\[[0-9;]*m/g, ''));
    return chatOk(CHAT_GATEWAY_FALLBACK, { source: 'gateway-fallback' });
  }
}
