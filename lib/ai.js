// Cliente de IA de RevelatiO. Es "provider-aware":
//  - Si hay GEMINI_API_KEY (producción): usa la API de Google Gemini directa,
//    con la cuota propia del proyecto (evita los límites del free tier del gateway).
//  - Si no (p. ej. el preview local): cae al Vercel AI Gateway con AI_GATEWAY_API_KEY.
import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

// Usamos un modelo estable y ampliamente disponible en la API directa de Google.
// El modelo preview anterior podía responder con 404/errores de disponibilidad
// según el proyecto, aunque la clave GEMINI_API_KEY fuese válida.
const MODELO_GEMINI_DIRECTO = 'gemini-2.5-flash';
// Lite reduce los fallos por cuota del Gateway en consultas JSON largas.
const MODELO_GATEWAY = 'google/gemini-2.5-flash-lite';

function resolverModelo() {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (geminiKey) {
    const google = createGoogleGenerativeAI({ apiKey: geminiKey });
    return google(MODELO_GEMINI_DIRECTO);
  }
  // Fallback: string de modelo -> el AI SDK usa el AI Gateway (AI_GATEWAY_API_KEY).
  return MODELO_GATEWAY;
}

export function hayMotorIA() {
  return !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.AI_GATEWAY_API_KEY);
}

function esRateLimit(error) {
  const m = `${error?.name || ''} ${error?.message || ''}`.toLowerCase();
  return error?.statusCode === 429 || m.includes('rate limit') || m.includes('ratelimit') || m.includes('too many requests');
}

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

// Genera contenido y devuelve el JSON ya parseado. Reintenta con backoff ante
// rate-limit (relevante en el free tier del gateway) y limpia vallas de código
// (```json ... ```) que a veces envuelven la respuesta del modelo.
export async function generarJSON(prompt, { reintentos = 1, maxOutputTokens = 1800 } = {}) {
  let ultimoError;
  for (let intento = 0; intento <= reintentos; intento++) {
    try {
      const { text } = await generateText({ model: resolverModelo(), prompt, maxOutputTokens });
      let s = String(text || '').trim();
      s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
      return JSON.parse(s);
    } catch (error) {
      ultimoError = error;
      if (esRateLimit(error) && intento < reintentos) {
        await espera(1500 * (intento + 1));
        continue;
      }
      break;
    }
  }
  if (esRateLimit(ultimoError)) {
    const e = new Error('RATE_LIMIT');
    e.code = 'RATE_LIMIT';
    throw e;
  }
  throw ultimoError;
}
