/**
 * GET/POST /api/tsk — alias canónico de /api/referencias (TSK / cruzadas).
 * Vercel no monta el alias de Express; este archivo existe para que POST /api/tsk no sea 404.
 */
export { default } from './referencias.js';
