/**
 * Contrato HTTP de /api/chat y /api/chat-global.
 * Extrae el texto del usuario y responde JSON o error — nunca 200 vacío.
 */

export const CHAT_MODEL = 'openai/gpt-4.1-mini';

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
  'Access-Control-Max-Age': '86400',
};

function pieceToText(piece) {
  if (piece == null) return '';
  if (typeof piece === 'string') return piece;
  if (typeof piece.text === 'string') return piece.text;
  if (typeof piece.content === 'string') return piece.content;
  return '';
}

/**
 * Acepta message | prompt | text | consulta | query | messages[].
 */
export function extractUserText(body) {
  if (!body || typeof body !== 'object') return '';
  const direct = body.message ?? body.prompt ?? body.text ?? body.consulta ?? body.query;
  if (direct != null && String(direct).trim()) return String(direct).trim();

  const messages = body.messages;
  if (!Array.isArray(messages) || !messages.length) return '';

  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const item = messages[i];
    if (!item || typeof item !== 'object') continue;
    const role = String(item.role || 'user').toLowerCase();
    if (role === 'assistant' || role === 'system') continue;
    const content = item.content ?? item.text ?? item.message;
    if (typeof content === 'string' && content.trim()) return content.trim();
    if (Array.isArray(content)) {
      const joined = content.map(pieceToText).join(' ').trim();
      if (joined) return joined;
    }
  }
  return '';
}

export function optionsResponse() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export function chatJson(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

export function chatError(message, status = 500) {
  return chatJson({ error: message, success: false, ok: false }, status);
}

export function chatOk(text, extra = {}) {
  const answer = String(text || '').trim();
  return chatJson({
    success: true,
    ok: true,
    text: answer,
    answer,
    ...extra,
  });
}
