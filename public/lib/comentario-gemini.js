/**
 * Éfata RevelatiO — comentario-gemini.js
 * Exposición clásica profunda con timeout calibrado (15s) y fallback teológico inmediato (<50ms).
 */
import { resolveGeminiApiKey } from './load-env.js';
import { generarFallbackComentario } from './theological-fallback.js';

const GEMINI_TIMEOUT_MS = 15000;
const GEMINI_MODELS = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash'];
const inflight = new Map();
let activeAbort = null;

function quote(verseText) {
  const t = String(verseText || '').replace(/\s+/g, ' ').trim();
  return t || 'el texto canónico del versículo indicado';
}

export function buildAuthorPrompt(authorName, passageRef, verseText) {
  const ref = String(passageRef || '').trim();
  const cited = quote(verseText);
  const a = String(authorName || '').toLowerCase();

  if (a.includes('calvino') || a.includes('calvin')) {
    return `Actúa como Juan Calvino en sus Comentarios Bíblicos. Proporciona un análisis exegético y doctrinal riguroso de "${ref}" («${cited}»).
Tu exposición debe incluir:
1. Intención del autor original y contexto histórico-gramatical inmediato.
2. Soberanía de Dios y doctrina de la justificación frente a la hipocresía humana.
3. Uso pedagógico de la Ley y el Evangelio para la disciplina y fe de la Iglesia.
Extensión: 3 párrafos concisos y densos (máximo 350 palabras). Prohibido esquemas vacíos o sustituir el pasaje por otro libro.`;
  }

  if (a.includes('gill')) {
    return `Actúa como John Gill en su Exposition of the Old and New Testament. Expón con erudición "${ref}" («${cited}»).
Tu exposición debe incluir:
1. Vocablos hebreos o griegos pertinentes (transliteración y glosa) y su peso en el versículo.
2. La soberanía de la gracia y la elección en el sentido del texto, sin forzar un sistema ajeno al pasaje.
3. Armonización con el testimonio canónico inmediato del pasaje.
Extensión: 3 párrafos concisos y técnicos (máximo 350 palabras). Prohibido resúmenes de una línea.`;
  }

  if (a.includes('matthew') || a.includes('henry')) {
    return `Actúa como Matthew Henry en su Exposición del Antiguo y Nuevo Testamento para "${ref}" («${cited}»).
Estructura la respuesta en exactamente tres párrafos, rotulados I. II. III.:
I. Ocasión y sentido de las palabras en su marco histórico inmediato.
II. Doctrina práctica: providencia, inspiración y discernimiento espiritual.
III. Advertencia y consuelo para la fe cotidiana.
Densidad teológica alta, lenguaje clásico (máximo 350 palabras). Prohibido esquemas vacíos o genéricos.`;
  }

  if (a.includes('jamieson') || a.includes('jfb') || a.includes('fausset') || a.includes('brown')) {
    return `Actúa como el Comentario Crítico y Explicativo de Jamieson-Fausset-Brown para "${ref}" («${cited}»).
Proporciona notas críticas versículo a versículo con análisis de las raíces en el idioma original (griego/hebreo), variantes textuales pertinentes y armonización con pasajes paralelos cuando existan.
Extensión: notas concisas en 3 bloques (máximo 350 palabras). Prohibido dar resúmenes superficiales.`;
  }

  return `Actúa como Charles H. Spurgeon en el Tabernáculo Metropolitano. Desarrolla una exposición rica, vibrante y cristocéntrica del pasaje "${ref}" («${cited}»).
Tu exposición debe incluir:
1. El corazón del texto: la confrontación entre la ceguera religiosa y la revelación de la gracia.
2. Tipología y Cristología: cómo este versículo apunta a la persona y obra de Cristo.
3. Llamado pastoral: aplicación incisiva y fervorosa a la conciencia del creyente hoy.
Extensión: 3 párrafos elocuentes y devocionales (máximo 350 palabras). Prohibido dar esquemas superficiales o resúmenes de una línea.`;
}

function extractExposition(data) {
  const parts = data?.candidates?.[0]?.content?.parts || [];
  return parts
    .filter((p) => p && !p.thought && String(p.text || '').trim())
    .map((p) => String(p.text).trim())
    .join('\n\n')
    .trim();
}

async function generateOnce(apiKey, model, prompt, signal) {
  const generationConfig = {
    temperature: 0.3,
    maxOutputTokens: 1200,
  };
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig,
      }),
    }
  );
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const msg = data?.error?.message || `Gemini ${model} HTTP ${response.status}`;
    const err = new Error(msg);
    err.status = response.status;
    throw err;
  }
  const exposition = extractExposition(data);
  if (!exposition) {
    throw new Error(data.error?.message || 'Respuesta vacía del motor de IA');
  }
  return exposition;
}

export async function generarComentarioGemini({
  passage,
  author,
  verseText = '',
  timeoutMs = GEMINI_TIMEOUT_MS,
  ctx = null,
} = {}) {
  const ref = String(passage || '').trim() || 'Mateo 16:2';
  const voz = String(author || 'C. H. Spurgeon').trim() || 'C. H. Spurgeon';
  const effectiveTimeout = Math.min(Number(timeoutMs) || GEMINI_TIMEOUT_MS, 15000);

  const fallback = () => ({
    text: generarFallbackComentario({ passage: ref, author: voz, verseText, ctx }),
    author: voz,
    source: 'theological-engine-fallback',
  });

  const apiKey = resolveGeminiApiKey();
  if (!apiKey) {
    console.warn('[commentary] GEMINI_API_KEY no presente. Ejecutando síntesis teológica inmediata.');
    return fallback();
  }

  const prompt = buildAuthorPrompt(voz, ref, verseText);
  const cacheKey = `${voz.toLowerCase()}|${ref.toLowerCase()}`;
  if (inflight.has(cacheKey)) {
    return inflight.get(cacheKey);
  }

  if (activeAbort) activeAbort.abort();
  const jobAbort = new AbortController();
  activeAbort = jobAbort;

  const run = (async () => {
    const deadline = Date.now() + effectiveTimeout;

    for (const model of GEMINI_MODELS) {
      if (jobAbort.signal.aborted) break;
      const remaining = deadline - Date.now();
      if (remaining < 300) break;

      const controller = new AbortController();
      const onJobAbort = () => controller.abort();
      jobAbort.signal.addEventListener('abort', onJobAbort, { once: true });
      const timeoutId = setTimeout(() => controller.abort(), remaining);
      const started = Date.now();

      try {
        console.log(`[commentary] ${voz} · ${ref} · ${model} · ${Math.round(remaining)}ms`);
        const text = await generateOnce(apiKey, model, prompt, controller.signal);
        clearTimeout(timeoutId);
        jobAbort.signal.removeEventListener('abort', onJobAbort);
        if (text && text.length > 80) {
          console.log(`[commentary] ok ${voz} · ${ref} · ${Date.now() - started}ms · ${text.length}c`);
          return { text, author: voz, source: 'gemini' };
        }
      } catch (err) {
        clearTimeout(timeoutId);
        jobAbort.signal.removeEventListener('abort', onJobAbort);
        console.warn(`[commentary] ${model} error/timeout (${Date.now() - started}ms):`, err.message);
      }
    }

    console.log(`[commentary] Fallback teológico ejecutado para ${voz} en ${ref}`);
    return fallback();
  })();

  inflight.set(cacheKey, run);
  try {
    return await run;
  } catch (_err) {
    return fallback();
  } finally {
    inflight.delete(cacheKey);
    if (activeAbort === jobAbort) activeAbort = null;
  }
}

export function envelopeComentario(text, author, source = 'gemini') {
  const cuerpo = String(text || '').trim();
  const paragraphs = cuerpo.split(/\n{2,}/).map((t) => t.trim()).filter(Boolean);
  return {
    ia: source === 'gemini',
    vacio: !cuerpo,
    generico: false,
    nivel: 'versiculo',
    titulo: author || 'Comentarista clásico',
    obra: '',
    cuerpo,
    paragraphs,
    entradas: paragraphs.map((t, i) => ({ n: String(i + 1), texto: t })),
  };
}
