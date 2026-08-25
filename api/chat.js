import { generateText } from 'ai';
import { answerUserQuestion } from '../lib/answer-user-question.js';
import {
  AI_TEMPERATURE,
} from '../lib/prompts/revelatio-system-prompt.js';
import { CHAT_MODEL, extractUserText } from '../lib/chat-contract.js';

export default async function handler(req, res) {
  res.setHeader?.('Access-Control-Allow-Origin', '*');
  res.setHeader?.('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader?.('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');

  if (req.method === 'OPTIONS') {
    res.setHeader?.('Allow', 'GET, POST, OPTIONS');
    return res.status(204).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      ok: true,
      ready: true,
      answer: 'Endpoint activo. Usa POST con { message } o { prompt }.',
      text: 'Endpoint activo. Usa POST con { message } o { prompt }.',
      data: 'Endpoint activo. Usa POST con { message } o { prompt }.',
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, ok: false, error: 'Método no permitido' });
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {};

  if (body.type === 'interlinear_resolve') {
    const userText = extractUserText(body);
    const context = body?.context;
    try {
      const result = await generateText({
        model: CHAT_MODEL,
        system:
          'Eres un diccionario léxico morfológico de precisión en Griego/Hebreo al servicio de la exégesis bíblica. Responde exclusivamente JSON válido, sin markdown ni comentarios.',
        prompt: `Analiza exactamente el término ${String(userText || '').slice(0, 120)} en el contexto del versículo ${String(context || 'no indicado').slice(0, 240)}. Devuelve SOLO este JSON: {"original":"grafía griega o hebrea","transliteration":"transliteración y pronunciación","strong":"G0000 o H0000","morphology":"análisis gramatical formal","meaning":"definición exegética y traducción literal al español","metanoia":"aplicación bajo la cruz y la Escritura, sin autoayuda"}. No dejes campos vacíos.`,
        temperature: AI_TEMPERATURE,
        maxOutputTokens: 700,
      });
      const cleaned = String(result.text || '').replace(/^```(?:json)?\s*|\s*```$/gi, '').trim();
      if (!cleaned) {
        return res.status(502).json({ success: false, ok: false, error: 'El modelo no devolvió análisis léxico.' });
      }
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
      return res.status(200).json(data);
    } catch (error) {
      console.error('[api/chat] interlinear:', error?.message || error);
      return res.status(502).json({ success: false, ok: false, error: 'No pude resolver el término ahora.' });
    }
  }

  const { status, json } = await answerUserQuestion(body);
  return res.status(status).json(json);
}
