/**
 * Servidor local de Éfata RevelatiO.
 * Raíz = carpeta de este archivo (cieloefata-biblia), independiente del cwd.
 * Sirve la SPA + /api/* + estáticos (audio, brand, data, public/).
 */
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, extname, join, normalize, sep } from 'node:path';

const ROOT = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

loadEnv(ROOT);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.gif': 'image/gif',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
};

function loadEnv(dir) {
  for (const file of ['.env.local', '.env']) {
    const path = join(dir, file);
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const cleaned = t.replace(/^export\s+/, '');
      const i = cleaned.indexOf('=');
      if (i < 1) continue;
      const k = cleaned.slice(0, i).trim();
      let v = cleaned.slice(i + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      if (process.env[k] == null || process.env[k] === '') process.env[k] = v;
    }
  }
}

function decorate(res) {
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (payload) => {
    if (!res.getHeader('Content-Type')) res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(payload));
    return res;
  };
  res.send = (payload) => {
    if (Buffer.isBuffer(payload) || payload instanceof Uint8Array) {
      res.end(payload);
      return res;
    }
    if (payload && typeof payload === 'object' && !('pipe' in payload)) return res.json(payload);
    res.end(payload);
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

function safeJoin(base, requestPath) {
  const cleaned = normalize(String(requestPath || '').replace(/^\/+/, '')).replace(/^(\.\.(\/|\\|$))+/, '');
  if (!cleaned || cleaned === '.' || cleaned.includes(`..${sep}`) || cleaned.startsWith(`..`)) return null;
  const full = join(base, cleaned);
  if (!full.startsWith(base)) return null;
  return full;
}

function isBlocked(rel) {
  return /(^|\/)\.env|(^|\/)\.git|(^|\/)node_modules\b/i.test(rel);
}

async function sendFile(res, filePath) {
  const buf = await readFile(filePath);
  const ext = extname(filePath).toLowerCase();
  res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
  res.setHeader('Content-Length', String(buf.length));
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Cache-Control', ext === '.js' || ext === '.html' ? 'no-store, max-age=0' : 'public, max-age=3600');
  res.statusCode = 200;
  res.end(buf);
}

async function sendSpa(res) {
  const htmlPath = join(ROOT, 'index.html');
  const buf = await readFile(htmlPath);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Content-Length', String(buf.length));
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.statusCode = 200;
  res.end(buf);
}

async function tryStatic(res, pathname) {
  const rel = pathname.replace(/^\/+/, '');
  if (!rel || isBlocked(rel)) return false;
  for (const base of [ROOT, join(ROOT, 'public')]) {
    const full = safeJoin(base, rel);
    if (!full || !existsSync(full)) continue;
    try {
      if (!statSync(full).isFile()) continue;
    } catch {
      continue;
    }
    await sendFile(res, full);
    return true;
  }
  return false;
}

async function handleApi(req, res, pathname, parsed) {
  const name = pathname.slice('/api/'.length).replace(/[^a-z0-9_-]/gi, '');
  if (!name) {
    res.status(404).json({ error: 'Ruta API no encontrada.' });
    return;
  }
  const apiFile = join(ROOT, 'api', `${name}.js`);
  if (!existsSync(apiFile)) {
    res.status(404).json({ error: 'Ruta API no encontrada.' });
    return;
  }
  try {
    const mod = await import(`${apiFile}?t=${Date.now()}`);
    req.query = Object.fromEntries(parsed.searchParams.entries());
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      req.body = await readBody(req);
    }
    await mod.default(req, res);
  } catch (error) {
    console.error('[dev-server] error en /api/%s:', name, error?.message || error);
    if (!res.headersSent) res.status(500).json({ error: 'Error interno del servidor local.' });
  }
}

const server = createServer(async (req, res) => {
  decorate(res);
  try {
    const parsed = new URL(req.url || '/', `http://${req.headers.host || '127.0.0.1'}`);
    const pathname = parsed.pathname.replace(/\/+$/, '') || '/';

    if (pathname === '/' || pathname === '/index.html' || pathname === '/lectura' || pathname === '/efata') {
      await sendSpa(res);
      return;
    }

    if (pathname.startsWith('/api/')) {
      await handleApi(req, res, pathname, parsed);
      return;
    }

    if (await tryStatic(res, pathname)) return;

    // SPA fallback (nunca listar directorios)
    await sendSpa(res);
  } catch (error) {
    console.error('[dev-server]', error?.message || error);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.end('Error interno');
    }
  }
});

server.on('error', (err) => {
  if (err?.code === 'EADDRINUSE') {
    console.error(`[dev-server] El puerto ${PORT} ya está en uso.`);
    console.error(`[dev-server] Libéralo o arranca con: PORT=3001 npm start`);
    process.exit(1);
  }
  console.error('[dev-server] no pudo iniciar:', err?.message || err);
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  const local = `http://127.0.0.1:${PORT}/`;
  console.log(`[dev-server] Éfata RevelatiO listo`);
  console.log(`[dev-server] Abre: ${local}`);
  console.log(`[dev-server] Raíz: ${ROOT}`);
});
