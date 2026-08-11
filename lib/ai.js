// Cliente de IA de RevelatiO mediante Vercel AI Gateway.
// En Vercel se autentica con VERCEL_OIDC_TOKEN; fuera de Vercel usa
// AI_GATEWAY_API_KEY. No usa credenciales directas de Google.
import { generateText } from 'ai';

const MODELO_GATEWAY = 'google/gemini-2.5-flash';

function resolverModelos() {
  return [MODELO_GATEWAY];
}

export function hayMotorIA() {
  return Boolean(process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN);
}

function esRateLimit(error) {
  const m = `${error?.name || ''} ${error?.message || ''}`.toLowerCase();
  return error?.statusCode === 429 || m.includes('rate limit') || m.includes('ratelimit') || m.includes('too many requests');
}

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

// Genera contenido y devuelve el JSON ya parseado. Reintenta con backoff ante
// rate-limit (relevante en el free tier del gateway) y limpia vallas de código
// (```json ... ```) que a veces envuelven la respuesta del modelo.
//
// NOTA: para respuestas con esquemas anidados o listas, prefiere
// generarObjeto/generarObjetoDual (salida estructurada con Zod): el modelo
// deja de "redactar" JSON en texto libre y el proveedor fuerza JSON válido
// que cumple el esquema, lo que evita los cortes a mitad de cadena y comas
// faltantes que sufría el parseo manual.
export async function generarJSON(prompt, { reintentos = 1, maxOutputTokens = 2200, perfil = 'profundo' } = {}) {
  let ultimoError;
  const modelos = resolverModelos(perfil);
  for (let intento = 0; intento <= reintentos; intento++) {
    for (const model of modelos) {
      try {
        const { text } = await generateText({ model, prompt, maxOutputTokens });
        let s = String(text || '').trim();
        s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
        try {
          return JSON.parse(s);
        } catch (parseError) {
          const inicio = s.indexOf('{');
          const fin = s.lastIndexOf('}');
          if (inicio >= 0 && fin > inicio) return JSON.parse(s.slice(inicio, fin + 1));
          throw parseError;
        }
      } catch (error) {
        ultimoError = error;
        continue;
      }
    }
    if (esRateLimit(ultimoError) && intento < reintentos) {
      await espera(1500 * (intento + 1));
    }
  }
  if (esRateLimit(ultimoError)) {
    const e = new Error('RATE_LIMIT');
    e.code = 'RATE_LIMIT';
    throw e;
  }
  throw ultimoError;
}

function extraerJSON(texto) {
  const limpio = String(texto || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const inicio = limpio.indexOf('{');
  const fin = limpio.lastIndexOf('}');
  if (inicio < 0 || fin <= inicio) throw new Error('La respuesta de IA no contiene un objeto JSON válido.');
  return JSON.parse(limpio.slice(inicio, fin + 1));
}

async function intentarObjeto(model, prompt, schema, maxOutputTokens) {
  const instrucciones = 'Devuelve exclusivamente un objeto JSON válido. No uses Markdown, explicaciones ni bloques de código.';
  let result = await generateText({
    model,
    prompt: `${instrucciones}\n\n${prompt}`,
    maxOutputTokens,
    temperature: 0,
  });
  let text = String(result.text || '').trim();

  // Algunos proveedores pueden finalizar una petición larga sin texto. Reintenta
  // una vez con un contrato reducido antes de convertirlo en un error de usuario.
  if (!text) {
    result = await generateText({
      model,
      prompt: `${instrucciones}\n\nResponde de forma breve y completa al siguiente encargo:\n${prompt}`,
      maxOutputTokens: Math.min(maxOutputTokens, 800),
      temperature: 0,
    });
    text = String(result.text || '').trim();
  }

  if (!text) {
    throw new Error(`El proveedor no devolvió contenido (finish reason: ${result.finishReason || 'desconocido'}).`);
  }
  return schema.parse(extraerJSON(text));
}

// Genera un objeto validado localmente contra un esquema Zod mediante AI Gateway.
export async function generarObjeto(prompt, { schema, reintentos = 1, maxOutputTokens = 4000 } = {}) {
  let ultimoError;
  const modelos = resolverModelos();
  for (let intento = 0; intento <= reintentos; intento++) {
    for (const model of modelos) {
      try {
        return await intentarObjeto(model, prompt, schema, maxOutputTokens);
      } catch (error) {
        ultimoError = error;
      }
    }
    if (esRateLimit(ultimoError) && intento < reintentos) {
      await espera(1500 * (intento + 1));
    }
  }
  if (esRateLimit(ultimoError)) {
    const error = new Error('RATE_LIMIT');
    error.code = 'RATE_LIMIT';
    throw error;
  }
  throw ultimoError;
}
