/**
 * Vercel alias: /api/lexicon → mismo handler que /api/lexico.
 * Express ya montaba este path; sin este archivo Vercel responde 404.
 */
export { default } from './lexico.js';
