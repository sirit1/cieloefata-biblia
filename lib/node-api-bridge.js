/**
 * Puente único: handlers Node de api/*.js → App Router (Request/Response).
 * Express y Vercel invocan el mismo archivo; aquí no hay lógica teológica.
 */
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
};

export function createNodeResponse() {
  const headers = new Headers(CORS);
  let status = 200;
  let payload;
  let raw = null;
  let ended = false;
  return {
    setHeader(name, value) {
      headers.set(name, String(value));
      return this;
    },
    status(code) {
      status = Number(code) || 200;
      return this;
    },
    json(value) {
      payload = value;
      ended = true;
      return this;
    },
    end(value) {
      ended = true;
      if (value != null && payload === undefined) raw = value;
      return this;
    },
    send(value) {
      return this.end(value);
    },
    toResponse() {
      if (raw != null && payload === undefined) {
        return new Response(typeof raw === 'string' ? raw : JSON.stringify(raw), { status, headers });
      }
      if (ended && payload === undefined && raw == null) {
        return new Response(null, { status, headers });
      }
      return Response.json(payload ?? {}, { status, headers });
    },
  };
}

export async function invokeNodeHandler(legacyHandler, request, pathHint = '') {
  const url = new URL(request.url);
  const query = Object.fromEntries(url.searchParams.entries());
  let body = {};
  if (request.method !== 'GET' && request.method !== 'HEAD' && request.method !== 'OPTIONS') {
    body = await request.json().catch(() => ({}));
    if (!body || typeof body !== 'object') body = {};
  }
  const req = {
    method: request.method,
    body,
    query,
    url: url.pathname + url.search,
    path: pathHint || url.pathname,
    headers: Object.fromEntries(request.headers.entries()),
  };
  const response = createNodeResponse();
  await legacyHandler(req, response);
  return response.toResponse();
}

export function nodeHandlers(legacyHandler, pathHint = '') {
  const run = (request) => invokeNodeHandler(legacyHandler, request, pathHint);
  return {
    GET: run,
    POST: run,
    OPTIONS() {
      return new Response(null, { status: 204, headers: CORS });
    },
  };
}
