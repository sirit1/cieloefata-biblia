/**
 * GET/POST /api/tsk — alias de /api/referencias (mismo handler que Express).
 */
import referenciasHandler from './referencias.js';

export default async function handler(req, res) {
  if (!req.body || typeof req.body !== 'object') req.body = {};
  if (!req.query || typeof req.query !== 'object') req.query = {};
  if (!req.body.consulta) {
    req.body.consulta =
      req.body.passage ||
      req.body.referencia ||
      req.body.ref ||
      req.query.consulta ||
      req.query.passage ||
      req.query.referencia ||
      req.query.ref ||
      req.query.q ||
      '';
  }
  return referenciasHandler(req, res);
}
