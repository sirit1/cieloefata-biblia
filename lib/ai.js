// Cliente de IA de RevelatiO. Es "provider-aware":
//  - Si hay GEMINI_API_KEY (producción): usa la API de Google Gemini directa,
//    con la cuota propia del proyecto (evita los límites del free tier del gateway).
//  - Si no (p. ej. el preview local): cae al Vercel AI Gateway con AI_GATEWAY_API_KEY.
import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

// El modelo más potente disponible sin coste, verificado por ruta:
//  - API directa de Google (con GEMINI_API_KEY, la que se usa en producción):
//    "gemini-3-flash-preview" SÍ está en el free tier de AI Studio y razona
//    mejor que 2.5 Flash.
//  - AI Gateway de Vercel (fallback sin clave propia, usado en el preview):
//    "gemini-3-flash" es de pago ahí; el más capaz gratis confirmado es
//    "gemini-2.5-flash" (2.5-pro y 3.x dan error de free tier).
const MODELO_GEMINI_FLASH = 'gemini-2.5-flash';
const MODELO_GEMINI_PRO = 'gemini-2.5-pro';
const MODELO_GATEWAY_FLASH = 'google/gemini-2.5-flash';
const MODELO_GATEWAY_PRO = 'google/gemini-2.5-pro';

function resolverModelos(perfil = 'profundo') {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (geminiKey) {
    const google = createGoogleGenerativeAI({ apiKey: geminiKey });
    return [google(MODELO_GEMINI_FLASH)];
  }
  return [MODELO_GATEWAY_FLASH];
}

// Par de modelos para la validación doble (Pro + Flash) del motor exegético
// principal. Se ejecutan en paralelo y sus resultados se contrastan en
// generarJSONDual. Con GEMINI_API_KEY propia usan la cuota directa de Google
// AI Studio; sin ella, caen al AI Gateway (donde Pro puede no estar en el
// free tier, y por eso el resultado final se degrada con honestidad a un
// único modelo en vez de fingir que ambos respondieron).
function resolverParDual() {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (geminiKey) {
    const google = createGoogleGenerativeAI({ apiKey: geminiKey });
    return { pro: google(MODELO_GEMINI_PRO), flash: google(MODELO_GEMINI_FLASH) };
  }
  return { pro: MODELO_GATEWAY_PRO, flash: MODELO_GATEWAY_FLASH };
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

function parsearTextoJSON(text) {
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
}

async function intentarModelo(model, prompt, maxOutputTokens) {
  const { text } = await generateText({ model, prompt, maxOutputTokens });
  return parsearTextoJSON(text);
}

function normalizarStrong(valor) {
  return String(valor || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

// Compara el término del idioma original y el número de Strong devueltos por
// cada modelo. Es la comprobación concreta de la "validación doble": si Pro
// y Flash coinciden en el dato verificable (Strong's), se marca "coincide";
// si difieren, se avisa "discrepancia" en vez de ocultar la diferencia.
function coincidenModelos(a, b) {
  const strongA = normalizarStrong(a?.idiomaOriginal?.strong);
  const strongB = normalizarStrong(b?.idiomaOriginal?.strong);
  if (!strongA || !strongB) return null; // sin dato verificable en alguno, no se puede contrastar
  return strongA === strongB;
}

// Ejecuta Gemini 2.5 Pro y Gemini 2.5 Flash EN PARALELO sobre el mismo
// prompt y contrasta sus respuestas. Devuelve siempre datos reales de al
// menos un modelo si alguno respondió, con un campo "validacionCruzada"
// honesto: 'coincide' (ambos respondieron y el dato verificable coincide),
// 'discrepancia' (ambos respondieron pero difieren — se prioriza Pro y se
// deja constancia), o 'parcial' (solo uno de los dos pudo responder).
export async function generarJSONDual(prompt, { maxOutputTokens = 4000 } = {}) {
  const { pro, flash } = resolverParDual();
  const [proRes, flashRes] = await Promise.allSettled([
    intentarModelo(pro, prompt, maxOutputTokens),
    intentarModelo(flash, prompt, maxOutputTokens),
  ]);

  const proOk = proRes.status === 'fulfilled' ? proRes.value : null;
  const flashOk = flashRes.status === 'fulfilled' ? flashRes.value : null;

  if (!proOk && !flashOk) {
    const errores = [proRes.reason, flashRes.reason].filter(Boolean);
    const rateLimit = errores.find(esRateLimit);
    if (rateLimit) {
      const e = new Error('RATE_LIMIT');
      e.code = 'RATE_LIMIT';
      throw e;
    }
    throw errores[0] || new Error('Sin respuesta de ningún motor de IA.');
  }

  if (proOk && flashOk) {
    const coincide = coincidenModelos(proOk, flashOk);
    return {
      ...proOk,
      validacionCruzada: coincide === null ? 'sin-dato-verificable' : coincide ? 'coincide' : 'discrepancia',
      strongFlash: flashOk?.idiomaOriginal?.strong || null,
      modelosConsultados: ['gemini-2.5-pro', 'gemini-2.5-flash'],
    };
  }

  const unico = proOk || flashOk;
  return {
    ...unico,
    validacionCruzada: 'parcial',
    modelosConsultados: [proOk ? 'gemini-2.5-pro' : 'gemini-2.5-flash'],
  };
}
