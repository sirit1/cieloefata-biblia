import { generateText } from 'ai';
import {
  SYSTEM_PROMPT,
  AI_TEMPERATURE,
  FALLBACK_FUERA_DE_MARCO,
  respuestaSiFueraDeMarco,
} from '../lib/prompts/revelatio-system-prompt.js';

export const runtime = 'edge';

// Mismo modelo Gateway que lib/ai.js (ai@7 spec v2). No usar @ai-sdk/google.
const MODELO_GATEWAY = 'openai/gpt-4.1-mini';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
};

const EMPTY_FALLBACK =
  'RevelatiO IA no pudo generar una respuesta en este momento. La Escritura permanece: vuelve al pasaje y reintenta.';

function json(payload, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS, ...extraHeaders },
  });
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const prompt = String(body.prompt || body.message || body.text || '').trim();
    const context = body.context || body.contextPassage || '';
    const type = body.type;

    if (!prompt && !context) {
      return json({ error: 'Parámetros insuficientes' }, 400);
    }

    if (type === 'interlinear_resolve') {
      return json({
        error: 'El léxico no se inventa. Usa GET /api/lexico?codigo=G#### o H####.',
        original: String(prompt).slice(0, 120),
        transliteration: '',
        strong: '',
        morphology: '',
        meaning: 'No se fabricará un código Strong ni una glosa. Consulta /api/lexico.',
        metanoia: '',
        source: 'corpus-required',
      });
    }

    const cleanMessage = prompt;
    const fuera = respuestaSiFueraDeMarco(cleanMessage);
    if (fuera) {
      return new Response(FALLBACK_FUERA_DE_MARCO, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'X-Revelatio-Gated': 'fuera_de_marco',
          ...CORS,
        },
      });
    }

    let dynamicPrompt = prompt;
    if (context) {
      dynamicPrompt = `[Contexto Bíblico: ${typeof context === 'string' ? context : JSON.stringify(context)}]\nConsulta: ${prompt}`;
    }

    const result = await generateText({
      model: MODELO_GATEWAY,
      system: SYSTEM_PROMPT,
      prompt: dynamicPrompt,
      temperature: AI_TEMPERATURE,
    });
    const text = String(result.text || '').trim();
    if (!text) {
      return json({ error: 'Respuesta vacía', text: EMPTY_FALLBACK, answer: EMPTY_FALLBACK });
    }
    return json({ text, answer: text, ok: true, success: true });
  } catch (error) {
    const message = error?.message || 'Error en el servidor';
    return json({ error: message, text: EMPTY_FALLBACK, answer: EMPTY_FALLBACK }, 500);
  }
}

export async function GET() {
  return json({
    ok: true,
    success: true,
    ready: true,
    methods: ['POST'],
    answer: 'RevelatiO IA está activo. Envía POST con { message | prompt | text }.',
    text: 'RevelatiO IA está activo. Envía POST con { message | prompt | text }.',
  });
}
