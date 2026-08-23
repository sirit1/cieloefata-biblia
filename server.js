import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3000;

// Mapeo Canónico de los 66 Libros (ID Bolls + Slugs)
const BIBLE_MAP = {
  "genesis": { id: 1, name: "Génesis" }, "exodo": { id: 2, name: "Éxodo" },
  "levitico": { id: 3, name: "Levítico" }, "numeros": { id: 4, name: "Números" },
  "deuteronomio": { id: 5, name: "Deuteronomio" }, "josue": { id: 6, name: "Josué" },
  "jueces": { id: 7, name: "Jueces" }, "rut": { id: 8, name: "Rut" },
  "1 samuel": { id: 9, name: "1 Samuel" }, "2 samuel": { id: 10, name: "2 Samuel" },
  "1 reyes": { id: 11, name: "1 Reyes" }, "2 reyes": { id: 12, name: "2 Reyes" },
  "1 cronicas": { id: 13, name: "1 Crónicas" }, "2 cronicas": { id: 14, name: "2 Crónicas" },
  "esdras": { id: 15, name: "Esdras" }, "nehemias": { id: 16, name: "Nehemías" },
  "ester": { id: 17, name: "Ester" }, "job": { id: 18, name: "Job" },
  "salmos": { id: 19, name: "Salmos" }, "proverbios": { id: 20, name: "Proverbios" },
  "eclesiastes": { id: 21, name: "Eclesiastés" }, "cantares": { id: 22, name: "Cantares" },
  "isaias": { id: 23, name: "Isaías" }, "jeremias": { id: 24, name: "Jeremías" },
  "lamentaciones": { id: 25, name: "Lamentaciones" }, "ezequiel": { id: 26, name: "Ezequiel" },
  "daniel": { id: 27, name: "Daniel" }, "oseas": { id: 28, name: "Oseas" },
  "joel": { id: 29, name: "Joel" }, "amos": { id: 30, name: "Amós" },
  "abdias": { id: 31, name: "Abdías" }, "jonas": { id: 32, name: "Jonás" },
  "miqueas": { id: 33, name: "Miqueas" }, "nahum": { id: 34, name: "Nahúm" },
  "habacuc": { id: 35, name: "Habacuc" }, "sofonias": { id: 36, name: "Sofonías" },
  "hageo": { id: 37, name: "Hageo" }, "zacarias": { id: 38, name: "Zacarías" },
  "malaquias": { id: 39, name: "Malaquías" }, "mateo": { id: 40, name: "Mateo" },
  "marcos": { id: 41, name: "Marcos" }, "lucas": { id: 42, name: "Lucas" },
  "juan": { id: 43, name: "Juan" }, "hechos": { id: 44, name: "Hechos" },
  "romanos": { id: 45, name: "Romanos" }, "1 corintios": { id: 46, name: "1 Corintios" },
  "2 corintios": { id: 47, name: "2 Corintios" }, "galatas": { id: 48, name: "Gálatas" },
  "efesios": { id: 49, name: "Efesios" }, "filipenses": { id: 50, name: "Filipenses" },
  "colosenses": { id: 51, name: "Colosenses" }, "1 tesalonicenses": { id: 52, name: "1 Tesalonicenses" },
  "2 tesalonicenses": { id: 53, name: "2 Tesalonicenses" }, "1 timoteo": { id: 54, name: "1 Timoteo" },
  "2 timoteo": { id: 55, name: "2 Timoteo" }, "tito": { id: 56, name: "Tito" },
  "filemon": { id: 57, name: "Filemón" }, "hebreos": { id: 58, name: "Hebreos" },
  "santiago": { id: 59, name: "Santiago" }, "1 pedro": { id: 60, name: "1 Pedro" },
  "2 pedro": { id: 61, name: "2 Pedro" }, "1 juan": { id: 62, name: "1 Juan" },
  "2 juan": { id: 63, name: "2 Juan" }, "3 juan": { id: 64, name: "3 Juan" },
  "judas": { id: 65, name: "Judas" }, "apocalipsis": { id: 66, name: "Apocalipsis" }
};

/** Identificadores nativos Bolls + etiqueta limpia (sin avisos de contingencia). */
const VERSION_MAP = {
  DHH: { bolls: 'DHH', label: 'Dios Habla Hoy' },
  TLA: { bolls: 'TLA', label: 'Traducción en Lenguaje Actual' },
  // Bolls sirve RVR1960 bajo el slug RV1960 (RVR1960 devuelve [])
  RVR1960: { bolls: 'RV1960', label: 'Reina-Valera 1960' },
  RV1960: { bolls: 'RV1960', label: 'Reina-Valera 1960' },
  RVR1909: { bolls: 'RV1909', label: 'Reina-Valera 1909' },
  RV1909: { bolls: 'RV1909', label: 'Reina-Valera 1909' },
  NVI: { bolls: 'NVI', label: 'Nueva Versión Internacional' },
  KJV: { bolls: 'KJV', label: 'King James Version' },
  LXX: { bolls: 'LXX', label: 'Septuaginta (Griego)' },
  SEPTUAGINTA: { bolls: 'LXX', label: 'Septuaginta (Griego)' },
  TEXTUAL: { bolls: 'LXX', label: 'Septuaginta (Griego)' },
};

function resolveVersionConfig(raw) {
  const key = String(raw || 'RVR1960')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]/g, '');
  if (VERSION_MAP[key]) return VERSION_MAP[key];
  if (key.includes('1909')) return VERSION_MAP.RVR1909;
  if (key.includes('1960') || key === 'RVR' || key === 'RV') return VERSION_MAP.RVR1960;
  if (key.includes('DHH')) return VERSION_MAP.DHH;
  if (key.includes('TLA')) return VERSION_MAP.TLA;
  if (key.includes('NVI')) return VERSION_MAP.NVI;
  if (key.includes('KJV')) return VERSION_MAP.KJV;
  if (key.includes('LXX') || key.includes('SEPT')) return VERSION_MAP.LXX;
  return VERSION_MAP.RVR1960;
}

function normalizeBookKey(raw) {
  return String(raw || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function safeFilePath(urlPath) {
  const cleaned = path.normalize(String(urlPath || '/').replace(/^\/+/, '')).replace(/^(\.\.(\/|\\|$))+/, '');
  if (!cleaned || cleaned === '.' || cleaned.includes('..')) return null;
  const full = path.join(__dirname, cleaned === '' ? 'index.html' : cleaned);
  if (!full.startsWith(__dirname)) return null;
  return full;
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    return res.end();
  }

  // ENDPOINT DE DATOS: /api/bible
  if (parsedUrl.pathname === '/api/bible' && req.method === 'GET') {
    const bookParam = parsedUrl.searchParams.get('book') || 'Romanos';
    const chapter = parsedUrl.searchParams.get('chapter') || '12';
    const version = parsedUrl.searchParams.get('version') || 'RVR1960';

    const normKey = normalizeBookKey(bookParam);
    const book = BIBLE_MAP[normKey] || { id: 45, name: bookParam };
    const vConfig = resolveVersionConfig(version);

    try {
      const response = await fetch(
        `https://bolls.life/get-chapter/${vConfig.bolls}/${book.id}/${chapter}/`
      );
      if (response.ok) {
        const raw = await response.json();
        const verses = Array.isArray(raw)
          ? raw
              .map((v) => ({
                verse: v.verse,
                text: String(v.text || '').replace(/<[^>]*>?/gm, '').trim(),
              }))
              .filter((v) => v.text)
          : [];

        if (verses.length) {
          res.writeHead(200, {
            'Content-Type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
          });
          return res.end(
            JSON.stringify({
              success: true,
              book: book.name,
              chapter: parseInt(chapter, 10),
              version: vConfig.label,
              verses,
            })
          );
        }
      }
    } catch (e) {
      console.error('[Server /api/bible error]:', e.message);
    }

    res.writeHead(500, {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
    });
    return res.end(
      JSON.stringify({
        success: false,
        error: `No se pudo obtener ${vConfig.label} para ${book.name} ${chapter}.`,
      })
    );
  }

  // SERVIDOR DE ARCHIVOS ESTÁTICOS (sin Live Server)
  const reqPath = parsedUrl.pathname === '/' ? 'index.html' : parsedUrl.pathname;
  const filePath = safeFilePath(reqPath);

  if (!filePath) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Bad Request');
  }

  const extname = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.mp3': 'audio/mpeg',
    '.m4a': 'audio/mp4',
  };

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // Fallback a /public para assets duplicados
        const pubPath = safeFilePath(path.join('public', reqPath.replace(/^\//, '')));
        if (pubPath && pubPath !== filePath) {
          return fs.readFile(pubPath, (err2, content2) => {
            if (err2) {
              res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
              return res.end('404 Not Found');
            }
            res.writeHead(200, { 'Content-Type': mimeTypes[extname] || 'application/octet-stream' });
            return res.end(content2);
          });
        }
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('404 Not Found');
      }
      res.writeHead(500);
      return res.end(`Server Error: ${err.code}`);
    }
    res.writeHead(200, { 'Content-Type': mimeTypes[extname] || 'application/octet-stream' });
    res.end(content);
  });
});

server.listen(PORT, () => {
  console.log(`[Éfata RevelatiO] Servidor ejecutándose en http://localhost:${PORT}`);
});
