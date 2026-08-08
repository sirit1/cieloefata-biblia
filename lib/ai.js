// Cliente de IA de RevelatiO. Es "provider-aware":
//  - Si hay GEMINI_API_KEY (producción): usa la API de Google Gemini directa,
//    con la cuota propia del proyecto (evita los límites del free tier del gateway).
//  - Si no (p. ej. el preview local): cae al Vercel AI Gateway con AI_GATEWAY_API_KEY.
import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

const NOMBRE_MODELO = 'gemini-2.5-flash';

function resolverModelo() {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (geminiKey) {
    const google = createGoogleGenerativeAI({ apiKey: geminiKey });
    return google(NOMBRE_MODELO);
  }
  // Fallback: string de modelo -> el AI SDK usa el AI Gateway (AI_GATEWAY_API_KEY).
  return `google/${NOMBRE_MODELO}`;
}

export function hayMotorIA() {
  return !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.AI_GATEWAY_API_KEY);
}

// Genera contenido y devuelve el JSON ya parseado. Limpia vallas de código
// (```json ... ```) que a veces envuelven la respuesta del modelo.
export async function generarJSON(prompt) {
  const { text } = await generateText({ model: resolverModelo(), prompt });
  let s = String(text || '').trim();
  s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  return JSON.parse(s);
}
