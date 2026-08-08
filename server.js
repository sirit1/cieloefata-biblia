// Dev server SOLO para el preview local de v0.
// Sirve index.html y ejecuta las funciones /api/* con el mismo formato req/res de Vercel.
// En producción, Vercel enruta /api automáticamente y este archivo no se usa.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

// Adapta el res de Node al formato Vercel (res.status().json(), res.setHeader()).
function decorate(res) {
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (payload) => {
    if (!res.getHeader('Content-Type')) res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(payload));
    return res;
  };
  return res;
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    return {};
  }
}

const server = createServer(async (req, res) => {
  decorate(res);
  const parsed = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsed.pathname;

  // Rutas de API -> funciones serverless
  if (pathname.startsWith('/api/')) {
    const name = pathname.slice('/api/'.length).replace(/[^a-z0-9_-]/gi, '');
    try {
      const mod = await import(join(__dirname, 'api', `${name}.js`));
      req.query = Object.fromEntries(parsed.searchParams.entries());
      if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
        req.body = await readBody(req);
      }
      await mod.default(req, res);
    } catch (error) {
      console.error('[dev-server] error en /api/%s:', name, error?.message);
      if (!res.headersSent) res.status(500).json({ error: 'Error interno del dev server.' });
    }
    return;
  }

  // Archivos estáticos de public/ (en Vercel se sirven en la raíz)
  if (pathname !== '/' && pathname !== '/index.html') {
    const safe = pathname.replace(/\.\.+/g, '').replace(/^\/+/, '');
    try {
      const file = await readFile(join(__dirname, 'public', safe));
      const ext = safe.split('.').pop().toLowerCase();
      const types = {
        png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', svg: 'image/svg+xml',
        webp: 'image/webp', ico: 'image/x-icon', gif: 'image/gif',
        css: 'text/css', js: 'text/javascript', json: 'application/json',
        woff: 'font/woff', woff2: 'font/woff2', mp3: 'audio/mpeg'
      };
      res.setHeader('Content-Type', types[ext] || 'application/octet-stream');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.end(file);
      return;
    } catch { /* cae al index (SPA) */ }
  }

  // Archivo estático principal (SPA)
  try {
    const html = await readFile(join(__dirname, 'index.html'));
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(html);
  } catch {
    res.status(404).end('No encontrado');
  }
});

server.listen(PORT, () => {
  console.log(`[dev-server] RevelatiO by Efata escuchando en http://localhost:${PORT}`);
});
