// Cliente de IA de RevelatiO mediante Vercel AI Gateway.
// En Vercel se autentica con VERCEL_OIDC_TOKEN; fuera de Vercel usa
// AI_GATEWAY_API_KEY. No usa credenciales directas de Google.
//
// IMPORTANTE #1: usa siempre `generateText` con la opción `output` (Output.json /
// Output.object) para salida estructurada, NUNCA le pidas al modelo "devuelve
// JSON" en el prompt y lo parsees a mano. El modo texto libre deja que el
// modelo escriba saltos de línea reales dentro de las cadenas JSON (en vez de
// "\n" escapado), lo que rompe JSON.parse con errores como "Unterminated
// string in JSON" o "no contiene un objeto JSON válido" — justo la clase de
// bug que este archivo sufrió antes de este cambio. `output` fuerza al
// proveedor a decodificar JSON válido de verdad (vía su mecanismo nativo de
// salida estructurada), así que el resultado ya llega parseado y correcto.
//
// IMPORTANTE #2 (causa raíz de "No fue posible generar..." en toda la app):
// gemini-2.5-flash es un modelo "razonador" y por defecto gasta la mayor
// parte de `maxOutputTokens` en tokens de pensamiento interno invisibles
// (`usage.outputTokenDetails.reasoningTokens`), dejando casi nada para el
// texto/JSON real. Eso hace que la respuesta termine con
// `finishReason: "length"` habiendo escrito apenas ~70-80 tokens visibles, y
// entonces `result.output` lanza `AI_NoOutputGeneratedError` sin más detalle.
// Se soluciona apagando el "thinking" con `providerOptions.google.thinkingConfig
// .thinkingBudget: 0` — no lo necesitamos para JSON estructurado — lo que
// hace que el modelo termine con `finishReason: "stop"` de forma consistente.
import { generateText, Output, NoObjectGeneratedError } from 'ai';

const MODELO_GATEWAY = 'google/gemini-2.5-flash';
const SIN_RAZONAMIENTO = { google: { thinkingConfig: { thinkingBudget: 0 } } };

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

// Genera contenido en JSON libre (sin esquema fijo, cada llamador describe la
// forma esperada en el propio prompt) y devuelve el objeto ya validado como
// JSON por el proveedor. Reintenta con backoff ante rate-limit.
export async function generarJSON(prompt, { reintentos = 1, maxOutputTokens = 2200 } = {}) {
  let ultimoError;
  const modelos = resolverModelos();
  for (let intento = 0; intento <= reintentos; intento++) {
    for (const model of modelos) {
      try {
        const { output } = await generateText({
          model,
          prompt,
          maxOutputTokens,
          output: Output.json(),
          providerOptions: SIN_RAZONAMIENTO,
        });
        if (output === undefined || output === null) throw new Error('El proveedor no devolvió contenido JSON.');
        return output;
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

async function intentarObjeto(model, prompt, schema, maxOutputTokens) {
  const result = await generateText({
    model,
    prompt,
    maxOutputTokens,
    temperature: 0,
    output: Output.object({ schema }),
    providerOptions: SIN_RAZONAMIENTO,
  });
  // `result.output` es un getter que LANZA AI_NoOutputGeneratedError en vez de
  // devolver undefined cuando el paso final no terminó con finishReason "stop"
  // (p. ej. "length": se acabó el presupuesto de tokens a mitad del JSON). Hay
  // que envolver el acceso, no compararlo con null/undefined.
  try {
    return result.output;
  } catch (getterError) {
    if (result.finishReason === 'length') {
      throw new Error('El proveedor cortó la respuesta por límite de tokens antes de terminar el objeto JSON. Aumenta maxOutputTokens.');
    }
    throw getterError;
  }
}

// Genera un objeto con salida estructurada real (esquema Zod) mediante AI Gateway.
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
  if (NoObjectGeneratedError.isInstance?.(ultimoError)) {
    const error = new Error('El proveedor de IA no devolvió un objeto válido según el esquema esperado.');
    error.cause = ultimoError;
    throw error;
  }
  throw ultimoError;
}
