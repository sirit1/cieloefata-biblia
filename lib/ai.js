// Cliente de IA de RevelatiO.
// Gateway: solo si hay AI_GATEWAY_API_KEY real. VERCEL_OIDC_TOKEN en preview
// NO autentica el Gateway (falla «Unauthenticated» en ~1s). Lentes caen a
// Gemini REST vía resolveGeminiApiKey() cuando el Gateway no está contratado.
//
// IMPORTANTE: usa siempre `generateText` con la opción `output` (Output.json /
// Output.object) para salida estructurada, NUNCA le pidas al modelo "devuelve
// JSON" en el prompt y lo parsees a mano. El modo texto libre deja que el
// modelo escriba saltos de línea reales dentro de las cadenas JSON (en vez de
// "\n" escapado), lo que rompe JSON.parse con errores como "Unterminated
// string in JSON" o "no contiene un objeto JSON válido". `output` fuerza al
// proveedor a decodificar JSON válido de verdad (vía su mecanismo nativo de
// salida estructurada), así que el resultado ya llega parseado y correcto.
import { generateText, Output, NoObjectGeneratedError } from 'ai';
import { resolveGeminiApiKey } from './load-env.js';

const MODELO_GATEWAY = 'openai/gpt-4.1-mini';

function resolverModelos() {
  return [MODELO_GATEWAY];
}

/** Gateway contratado de verdad — OIDC de preview no cuenta. */
export function hayGatewayIA() {
  return Boolean(String(process.env.AI_GATEWAY_API_KEY || '').trim());
}

export function hayGeminiIA() {
  return Boolean(resolveGeminiApiKey());
}

export function hayMotorIA() {
  return hayGatewayIA() || hayGeminiIA();
}

/** Texto libre vía AI Gateway. Vacío si no hay clave de Gateway (no usa OIDC). */
export async function generarTexto(prompt, { maxOutputTokens = 2800 } = {}) {
  if (!hayGatewayIA()) return '';
  try {
    const { text } = await generateText({
      model: MODELO_GATEWAY,
      prompt,
      maxOutputTokens,
    });
    return String(text || '').trim();
  } catch (error) {
    console.warn('[ai] Gateway:', error?.message || error);
    return '';
  }
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
  if (!hayGatewayIA()) {
    const e = new Error('Falta AI_GATEWAY_API_KEY.');
    e.code = 'NO_GATEWAY';
    throw e;
  }
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
  if (!hayGatewayIA()) {
    const e = new Error('Falta AI_GATEWAY_API_KEY.');
    e.code = 'NO_GATEWAY';
    throw e;
  }
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
