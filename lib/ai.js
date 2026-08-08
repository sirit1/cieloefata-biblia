// Cliente de IA de RevelatiO, vía Vercel AI Gateway (usa AI_GATEWAY_API_KEY,
// disponible tanto en el preview local como en producción por OIDC).
import { generateText } from 'ai';

// Modelo Gemini flash vigente en el gateway (verificado contra la lista de modelos).
export const MODELO = 'google/gemini-3.6-flash';

// Genera contenido y devuelve el JSON ya parseado. Limpia vallas de código
// (```json ... ```) que a veces envuelven la respuesta del modelo.
export async function generarJSON(prompt) {
  const { text } = await generateText({ model: MODELO, prompt });
  let s = String(text || '').trim();
  s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  return JSON.parse(s);
}
