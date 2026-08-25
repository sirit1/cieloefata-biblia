/**
 * Vercel alias: /api/tsk → mismas referencias cruzadas que /api/referencias.
 * Express ya montaba este path; sin este archivo Vercel responde 404.
 */
export { default } from './referencias.js';
