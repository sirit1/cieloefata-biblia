/**
 * Mapa de rutas Express (server.js) → api/*.js.
 * Loaders dinámicos para no tumbar el bundle si un módulo pesado falla al importar.
 */
import { invokeNodeHandler } from './node-api-bridge.js';

const LOADERS = {
  bible: () => import('../api/bible.js'),
  capitulo: () => import('../api/bible.js'),
  biblia: () => import('../api/biblia.js'),
  pasaje: () => import('../api/pasaje.js'),
  tsk: () => import('../api/tsk.js'),
  referencias: () => import('../api/referencias.js'),
  'study-engine': () => import('../api/study-engine.js'),
  lexico: () => import('../api/lexico.js'),
  lexicon: () => import('../api/lexico.js'),
  concordancia: () => import('../api/concordancia.js'),
  concordance: () => import('../api/study-engine.js'),
  'lente-elite': () => import('../api/lente-elite.js'),
  comentario: () => import('../api/comentario.js'),
  commentary: () => import('../api/commentary.js'),
  strong: () => import('../api/strong.js'),
  exegesis: () => import('../api/exegesis.js'),
  lente: () => import('../api/lente.js'),
  recursos: () => import('../api/recursos.js'),
  ai: () => import('../api/ai.js'),
  voz: () => import('../api/voz.js'),
  diccionario: () => import('../api/diccionario.js'),
  devocional: () => import('../api/devocional.js'),
  versiones: () => import('../api/versiones.js'),
  'agente-teologico': () => import('../api/agente-teologico.js'),
  'ai-synthesis': () => import('../api/ai-synthesis.js'),
  'plan-cierre': () => import('../api/plan-cierre.js'),
};

export function routeKeyFromPath(pathname) {
  return String(pathname || '')
    .replace(/^\/api\/?/i, '')
    .replace(/\/+$/, '')
    .split('?')[0];
}

export async function handlerForApiPath(pathname) {
  const rel = routeKeyFromPath(pathname);
  const loader = LOADERS[rel] || (() => import('../api/study-engine.js'));
  const mod = await loader();
  return mod.default;
}

export async function dispatchApiRequest(request, pathHint) {
  const url = new URL(request.url);
  const hint = pathHint || url.pathname;
  const handler = await handlerForApiPath(hint);
  return invokeNodeHandler(handler, request, hint);
}
