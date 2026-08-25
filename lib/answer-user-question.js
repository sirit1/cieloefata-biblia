/**
 * Un contrato de chat: message | prompt → { success, ok, text, answer, data }.
 * Responde al texto de la pregunta. Nunca usa el fallback de commentary (Spurgeon).
 * No reescribe el motor teológico: si el Gateway no habla, llama generateUniversalAnswer en modo lens.
 */
import { generateText } from 'ai';
import { generateUniversalAnswer } from '../api/ai.js';
import { hayMotorIA } from './ai.js';
import { LIBROS, parsearReferencia } from './biblia.js';
import {
  SYSTEM_PROMPT,
  AI_TEMPERATURE,
  FALLBACK_FUERA_DE_MARCO,
  respuestaSiFueraDeMarco,
} from './prompts/revelatio-system-prompt.js';
import { CHAT_MODEL, extractUserText, CHAT_GATEWAY_FALLBACK } from './chat-contract.js';

const SPURGEON_CANNED = 'Exposición Pastoral en el Tabernáculo Metropolitano';

export function unifyChatPayload(text, extra = {}) {
  const answer = String(text || '').trim();
  return {
    success: true,
    ok: true,
    text: answer,
    answer,
    data: answer,
    ...extra,
  };
}

/**
 * Extrae "Romanos 12:2" de un body o de "Qué dice Romanos 12:2".
 */
export function passageFromQuestion(body = {}, userText = '') {
  const ctx = body.context && typeof body.context === 'object' ? body.context : {};
  const direct = String(
    body.contextPassage || body.passage || ctx.reference || body.reference || '',
  ).trim();
  const parsedDirect = parsearReferencia(direct);
  if (parsedDirect) {
    return parsedDirect.versoInicio
      ? `${parsedDirect.libro} ${parsedDirect.capitulo}:${parsedDirect.versoInicio}`
      : `${parsedDirect.libro} ${parsedDirect.capitulo}`;
  }

  const haystack = `${direct} ${userText}`.trim();
  if (!haystack) return '';

  const sorted = [...LIBROS].sort((a, b) => b.length - a.length);
  for (const libro of sorted) {
    const esc = libro.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(
      `(?:^|[^\\p{L}\\p{N}])${esc}\\s+(\\d{1,3})(?:\\s*[:.,]\\s*(\\d{1,3}))?`,
      'iu',
    );
    const m = haystack.match(re);
    if (m) return m[2] ? `${libro} ${m[1]}:${m[2]}` : `${libro} ${m[1]}`;
  }
  return direct;
}

function looksLikeCannedCommentary(text) {
  const s = String(text || '');
  return s.includes(SPURGEON_CANNED) || /^### Comentario Exegético y Doctrinal — Juan Calvino/m.test(s);
}

export async function answerUserQuestion(body = {}) {
  const userText = extractUserText(body).slice(0, 4000);
  if (!userText) {
    return {
      status: 400,
      json: {
        success: false,
        ok: false,
        error: 'Falta message o prompt.',
        text: '',
        answer: '',
        data: '',
      },
    };
  }

  const fuera = respuestaSiFueraDeMarco(userText);
  if (fuera) {
    return {
      status: 200,
      json: unifyChatPayload(FALLBACK_FUERA_DE_MARCO, {
        gated: true,
        reason: 'fuera_de_marco',
      }),
    };
  }

  const context = body.context && typeof body.context === 'object' ? body.context : {};
  const history = Array.isArray(body.history) ? body.history : [];
  const passage = passageFromQuestion(body, userText);
  const contextLine = [passage || context.reference, context.module, context.version]
    .filter(Boolean)
    .join(' · ');
  const transcript = history
    .slice(-8)
    .map(
      (item) =>
        `${item.role === 'user' ? 'Usuario' : 'RevelatiO IA'}: ${String(item.content || '').slice(0, 1800)}`,
    )
    .join('\n');
  const seed = String(context.invisiblePromptSeed || context.guardrail || '').trim();
  const auditHint = String(context.auditHint || '').trim();

  if (hayMotorIA()) {
    try {
      const result = await generateText({
        model: CHAT_MODEL,
        system: SYSTEM_PROMPT,
        prompt: `${contextLine ? `Contexto activo: ${contextLine}\n` : ''}${seed ? `Marco exegético: ${seed}\n` : ''}${auditHint ? `Fuentes de trazabilidad (obligatorias de anclar): ${auditHint}\n` : ''}${transcript ? `Conversación previa:\n${transcript}\n` : ''}Usuario: ${userText}`,
        temperature: AI_TEMPERATURE,
        maxOutputTokens: 900,
      });
      const text = String(result.text || '').trim();
      if (text && !looksLikeCannedCommentary(text)) {
        return {
          status: 200,
          json: unifyChatPayload(text, {
            gated: false,
            temperature: AI_TEMPERATURE,
            source: 'gateway',
            audit: context.audit || null,
          }),
        };
      }
    } catch (err) {
      console.warn('[answerUserQuestion] gateway:', err?.message || err);
    }
  }

  try {
    const engine = await generateUniversalAnswer(
      {
        prompt: userText,
        passage: passage || userText,
        type: 'lens',
        mode: 'lens',
        lensTitle: 'Análisis Bíblico',
      },
      '/api/chat',
    );
    const answer = String(engine?.answer || engine?.text || '').trim();
    if (answer && !looksLikeCannedCommentary(answer)) {
      return {
        status: 200,
        json: unifyChatPayload(answer, {
          gated: false,
          source: engine.source || 'engine',
          meta: engine.meta || undefined,
          audit: context.audit || null,
        }),
      };
    }
  } catch (err) {
    console.warn('[answerUserQuestion] engine:', err?.message || err);
  }

  return {
    status: 200,
    json: unifyChatPayload(CHAT_GATEWAY_FALLBACK, { source: 'fallback' }),
  };
}
