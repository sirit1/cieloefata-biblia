import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/styles', express.static(path.join(__dirname, 'styles')));
app.use('/data', express.static(path.join(__dirname, 'data')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/views', express.static(path.join(__dirname, 'views')));

// —— Proxy canónico de texto bíblico (Bolls API, sin datos hardcodeados) ——
const BIBLE_MAP = {
  genesis: { id: 1, name: 'Génesis' }, exodo: { id: 2, name: 'Éxodo' },
  levitico: { id: 3, name: 'Levítico' }, numeros: { id: 4, name: 'Números' },
  deuteronomio: { id: 5, name: 'Deuteronomio' }, josue: { id: 6, name: 'Josué' },
  jueces: { id: 7, name: 'Jueces' }, rut: { id: 8, name: 'Rut' },
  '1 samuel': { id: 9, name: '1 Samuel' }, '2 samuel': { id: 10, name: '2 Samuel' },
  '1 reyes': { id: 11, name: '1 Reyes' }, '2 reyes': { id: 12, name: '2 Reyes' },
  '1 cronicas': { id: 13, name: '1 Crónicas' }, '2 cronicas': { id: 14, name: '2 Crónicas' },
  esdras: { id: 15, name: 'Esdras' }, nehemias: { id: 16, name: 'Nehemías' },
  ester: { id: 17, name: 'Ester' }, job: { id: 18, name: 'Job' },
  salmos: { id: 19, name: 'Salmos' }, proverbios: { id: 20, name: 'Proverbios' },
  eclesiastes: { id: 21, name: 'Eclesiastés' }, cantares: { id: 22, name: 'Cantares' },
  isaias: { id: 23, name: 'Isaías' }, jeremias: { id: 24, name: 'Jeremías' },
  lamentaciones: { id: 25, name: 'Lamentaciones' }, ezequiel: { id: 26, name: 'Ezequiel' },
  daniel: { id: 27, name: 'Daniel' }, oseas: { id: 28, name: 'Oseas' },
  joel: { id: 29, name: 'Joel' }, amos: { id: 30, name: 'Amós' },
  abdias: { id: 31, name: 'Abdías' }, jonas: { id: 32, name: 'Jonás' },
  miqueas: { id: 33, name: 'Miqueas' }, nahum: { id: 34, name: 'Nahúm' },
  habacuc: { id: 35, name: 'Habacuc' }, sofonias: { id: 36, name: 'Sofonías' },
  hageo: { id: 37, name: 'Hageo' }, zacarias: { id: 38, name: 'Zacarías' },
  malaquias: { id: 39, name: 'Malaquías' }, mateo: { id: 40, name: 'Mateo' },
  marcos: { id: 41, name: 'Marcos' }, lucas: { id: 42, name: 'Lucas' },
  juan: { id: 43, name: 'Juan' }, hechos: { id: 44, name: 'Hechos' },
  romanos: { id: 45, name: 'Romanos' }, '1 corintios': { id: 46, name: '1 Corintios' },
  '2 corintios': { id: 47, name: '2 Corintios' }, galatas: { id: 48, name: 'Gálatas' },
  efesios: { id: 49, name: 'Efesios' }, filipenses: { id: 50, name: 'Filipenses' },
  colosenses: { id: 51, name: 'Colosenses' }, '1 tesalonicenses': { id: 52, name: '1 Tesalonicenses' },
  '2 tesalonicenses': { id: 53, name: '2 Tesalonicenses' }, '1 timoteo': { id: 54, name: '1 Timoteo' },
  '2 timoteo': { id: 55, name: '2 Timoteo' }, tito: { id: 56, name: 'Tito' },
  filemon: { id: 57, name: 'Filemón' }, hebreos: { id: 58, name: 'Hebreos' },
  santiago: { id: 59, name: 'Santiago' }, '1 pedro': { id: 60, name: '1 Pedro' },
  '2 pedro': { id: 61, name: '2 Pedro' }, '1 juan': { id: 62, name: '1 Juan' },
  '2 juan': { id: 63, name: '2 Juan' }, '3 juan': { id: 64, name: '3 Juan' },
  judas: { id: 65, name: 'Judas' }, apocalipsis: { id: 66, name: 'Apocalipsis' },
  habakkuk: { id: 35, name: 'Habacuc' }, hab: { id: 35, name: 'Habacuc' },
  haggai: { id: 37, name: 'Hageo' }, hag: { id: 37, name: 'Hageo' },
};

const VERSION_MAP = {
  DHH: { bolls: 'DHH', label: 'Dios Habla Hoy' },
  TLA: { bolls: 'TLA', label: 'Traducción en Lenguaje Actual' },
  RVR1960: { bolls: 'RV1960', label: 'Reina-Valera 1960' },
  RV1960: { bolls: 'RV1960', label: 'Reina-Valera 1960' },
  RVR1909: { bolls: 'RV1909', label: 'Reina-Valera 1909' },
  RV1909: { bolls: 'RV1909', label: 'Reina-Valera 1909' },
  NVI: { bolls: 'NVI', label: 'Nueva Versión Internacional' },
  KJV: { bolls: 'KJV', label: 'King James Version' },
  LXX: { bolls: 'LXX', label: 'Septuaginta (Griego)' },
};

function normalizeBookKey(raw) {
  return String(raw || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

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

async function fetchBollsChapter(bollsSlug, bookId, chapter) {
  const response = await fetch(
    `https://bolls.life/get-chapter/${bollsSlug}/${bookId}/${chapter}/`
  );
  if (!response.ok) return [];
  const raw = await response.json().catch(() => null);
  if (!Array.isArray(raw)) return [];
  return raw
    .map((v) => ({
      verse: v.verse,
      text: String(v.text || '').replace(/<[^>]*>?/gm, '').trim(),
    }))
    .filter((v) => v.text);
}

async function resolveBiblePassage(bookParam, chapterParam, versionParam) {
  const bookNameRaw = String(bookParam || 'Génesis').trim() || 'Génesis';
  const chapter = Math.max(1, parseInt(chapterParam, 10) || 1);
  const requestedVersion = String(versionParam || 'RVR1960');
  const mapKey = normalizeBookKey(bookNameRaw);
  const book = BIBLE_MAP[mapKey] || { id: 1, name: bookNameRaw };
  const primary = resolveVersionConfig(requestedVersion);
  const fallbacks = [
    primary,
    resolveVersionConfig('RVR1960'),
    resolveVersionConfig('RVR1909'),
    resolveVersionConfig('DHH'),
    resolveVersionConfig('TLA'),
  ];

  const seen = new Set();
  for (const vConfig of fallbacks) {
    const key = vConfig.bolls;
    if (seen.has(key)) continue;
    seen.add(key);
    try {
      const verses = await fetchBollsChapter(key, book.id, chapter);
      if (verses.length) {
        return {
          success: true,
          book: book.name,
          chapter,
          version: vConfig.label,
          requestedVersion,
          source: key === primary.bolls ? 'bolls' : `bolls-fallback:${key}`,
          verses,
        };
      }
    } catch (err) {
      console.warn(`[bible] ${key} falló:`, err?.message || err);
    }
  }

  return {
    success: false,
    book: book.name,
    chapter,
    version: primary.label,
    requestedVersion,
    source: 'unavailable',
    verses: [],
    error: 'No se pudo obtener el capítulo desde ninguna versión disponible.',
  };
}

async function bibleHandler(req, res) {
  const bookParam = req.query.book || req.query.libro || 'Génesis';
  const chapterParam = req.query.chapter || req.query.capitulo || '1';
  const versionParam = req.query.version || 'RVR1960';
  try {
    const payload = await resolveBiblePassage(bookParam, chapterParam, versionParam);
    return res.status(200).json(payload);
  } catch (error) {
    console.error('[bible]', error.message);
    return res.status(200).json({
      success: false,
      book: bookParam,
      chapter: Math.max(1, parseInt(chapterParam, 10) || 1),
      verses: [],
      error: error.message,
    });
  }
}

app.get('/api/bible', bibleHandler);
app.get('/api/pasaje', bibleHandler);
app.get('/api/capitulo', bibleHandler);

// Endpoint Unificado de Inteligencia Teológica
app.post('/api/study-engine', async (req, res) => {
  try {
    const { passage, mode, author, lensTitle, prompt } = req.body;
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'GEMINI_API_KEY no detectada en las variables de entorno (.env).',
      });
    }

    let systemInstruction = '';

    switch (mode) {
      case 'commentary':
        systemInstruction = `Eres un catedrático de exégesis bíblica histórica. Proporciona la exposición literal completa y exhaustiva del pasaje "${passage}" bajo la línea exegética de ${author || 'Matthew Henry'}. No hagas resúmenes ni síntesis; explica el texto versículo por versículo con rigor doctrinal e histórico.`;
        break;
      case 'tsk':
        systemInstruction = `Eres el motor canónico de Treasury of Scripture Knowledge (TSK). Para el pasaje "${passage}", genera de 3 a 5 ejes temáticos con sus referencias bíblicas cruzadas exactas (Antiguo y Nuevo Testamento) y el texto bíblico breve correspondiente a cada una.`;
        break;
      case 'lexicon':
        systemInstruction = `Eres un lexicógrafo bíblico experto en Hebreo, Arameo y Griego. Para el pasaje "${passage}", analiza las 3 a 5 palabras clave originales. Para cada una incluye: Código Strong (H o G), término original en su alfabeto, transliteración fonética, categoría gramatical y definición estricta en español.`;
        break;
      case 'lens':
      default:
        systemInstruction = `Eres RevelatiO IA, mentor teológico fundamentado en la suficiencia de las Escrituras y la renovación del entendimiento (Romanos 12:2). Analiza "${passage}" bajo la lente "${lensTitle || 'General'}".
Estructura la respuesta exactamente en 3 secciones:
1. Exégesis & Centralidad en Cristo
2. Metanoia & Desarme de Sesgos
3. Criterio Innegociable para la Toma de Decisiones`;
        break;
    }

    const payloadText = prompt ? `${systemInstruction}\n\nConsulta adicional: ${prompt}` : systemInstruction;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: payloadText }] }],
        }),
      }
    );

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!resultText) {
      throw new Error(data.error?.message || 'La IA no devolvió contenido.');
    }

    return res.json({ success: true, answer: resultText });
  } catch (error) {
    console.error('Error en /api/study-engine:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Redirección para cualquier ruta de frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`[Éfata RevelatiO] Servidor limpio y activo en http://localhost:${PORT}`);
});
