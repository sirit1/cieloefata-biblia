/**
 * Comentarios clásicos: texto histórico de dominio público, versículo a versículo.
 * Nunca Gemini, nunca «Actúa como Spurgeon», nunca el respaldo teológico fingiendo autor.
 *
 * Fuentes:
 * - helloao (JFB, Henry, Calvino, Gill, Clarke when the book exists)
 * - Adam Clarke PD fallback (truthaccordingtoscripture ACC / StudyLight) when helloao omits a book (e.g. Mateo)
 * - Spurgeon Verse Expositions (truthaccordingtoscripture / SPE) + Treasury of David (Salmos, CrossWire TDavid)
 * - Wesley: CrossWire `Wesley` + Christianity.com
 * - Lutero / Agustín: CrossWire cuando hay nota real; si no, found:false
 */
import { parsearReferencia, LIBROS } from './biblia.js';
import { attachStoredSpanish } from './comentario-es.js';

const HELLOAO = 'https://bible.helloao.org';
const CROSSWIRE = 'https://www.crosswire.org/study/passagestudy.jsp';
const SPE_BASE = 'https://www.truthaccordingtoscripture.com/commentaries/spe';
const SPE_PRAYERREQUEST = 'https://bible.prayerrequest.com/9131-spurgeons-verse-expositions-of-the-bible-3-vols';
const SPE_STUDYLIGHT = 'https://www.studylight.org/commentaries/eng/spe';
const ACC_BASE = 'https://www.truthaccordingtoscripture.com/commentaries/acc';
const ACC_STUDYLIGHT = 'https://www.studylight.org/commentaries/eng/acc';
const WESLEY_HTML = 'https://www.christianity.com/bible/commentary/john-wesley';
const WESLEY_BIBLEHUB = 'https://biblehub.com/commentaries/wes';
const GOSPEL_EN = { Matt: 'Matthew', Mark: 'Mark', Luke: 'Luke', John: 'John' };

const USFM = [
  'GEN', 'EXO', 'LEV', 'NUM', 'DEU', 'JOS', 'JDG', 'RUT', '1SA', '2SA',
  '1KI', '2KI', '1CH', '2CH', 'EZR', 'NEH', 'EST', 'JOB', 'PSA', 'PRO',
  'ECC', 'SNG', 'ISA', 'JER', 'LAM', 'EZK', 'DAN', 'HOS', 'JOL', 'AMO',
  'OBA', 'JON', 'MIC', 'NAM', 'HAB', 'ZEP', 'HAG', 'ZEC', 'MAL',
  'MAT', 'MRK', 'LUK', 'JHN', 'ACT', 'ROM', '1CO', '2CO', 'GAL', 'EPH',
  'PHP', 'COL', '1TH', '2TH', '1TI', '2TI', 'TIT', 'PHM',
  'HEB', 'JAS', '1PE', '2PE', '1JN', '2JN', '3JN', 'JUD', 'REV',
];

const OSIS = [
  'Gen', 'Exod', 'Lev', 'Num', 'Deut', 'Josh', 'Judg', 'Ruth', '1Sam', '2Sam',
  '1Kgs', '2Kgs', '1Chr', '2Chr', 'Ezra', 'Neh', 'Esth', 'Job', 'Ps', 'Prov',
  'Eccl', 'Song', 'Isa', 'Jer', 'Lam', 'Ezek', 'Dan', 'Hos', 'Joel', 'Amos',
  'Obad', 'Jonah', 'Mic', 'Nah', 'Hab', 'Zeph', 'Hag', 'Zech', 'Mal',
  'Matt', 'Mark', 'Luke', 'John', 'Acts', 'Rom', '1Cor', '2Cor', 'Gal', 'Eph',
  'Phil', 'Col', '1Thess', '2Thess', '1Tim', '2Tim', 'Titus', 'Phlm',
  'Heb', 'Jas', '1Pet', '2Pet', '1John', '2John', '3John', 'Jude', 'Rev',
];

const EN_SLUG = [
  'genesis', 'exodus', 'leviticus', 'numbers', 'deuteronomy', 'joshua', 'judges', 'ruth',
  '1-samuel', '2-samuel', '1-kings', '2-kings', '1-chronicles', '2-chronicles', 'ezra',
  'nehemiah', 'esther', 'job', 'psalms', 'proverbs', 'ecclesiastes', 'song-of-solomon',
  'isaiah', 'jeremiah', 'lamentations', 'ezekiel', 'daniel', 'hosea', 'joel', 'amos',
  'obadiah', 'jonah', 'micah', 'nahum', 'habakkuk', 'zephaniah', 'haggai', 'zechariah',
  'malachi', 'matthew', 'mark', 'luke', 'john', 'acts', 'romans', '1-corinthians',
  '2-corinthians', 'galatians', 'ephesians', 'philippians', 'colossians',
  '1-thessalonians', '2-thessalonians', '1-timothy', '2-timothy', 'titus', 'philemon',
  'hebrews', 'james', '1-peter', '2-peter', '1-john', '2-john', '3-john', 'jude',
  'revelation',
];

const AUTHOR_META = {
  'charles-spurgeon': { name: 'C. H. Spurgeon', helloao: null },
  'matthew-henry': { name: 'Matthew Henry', helloao: 'matthew-henry' },
  'john-calvin': { name: 'Juan Calvino', helloao: 'john-calvin' },
  'john-wesley': { name: 'John Wesley', helloao: null },
  'jamieson-fausset-brown': { name: 'Jamieson-Fausset-Brown', helloao: 'jamieson-fausset-brown' },
  'martin-luther': { name: 'Martín Lutero', helloao: null },
  'agustin-de-hipona': { name: 'Agustín de Hipona', helloao: null },
  'john-gill': { name: 'John Gill', helloao: 'john-gill' },
  'adam-clarke': { name: 'Adam Clarke', helloao: 'adam-clarke' },
};

/** Compact UI ids / labels → canonical SPE / helloao id. Display string not required. */
const AUTHOR_ALIASES = {
  charlesspurgeon: 'charles-spurgeon',
  spurgeon: 'charles-spurgeon',
  chspurgeon: 'charles-spurgeon',
  chs: 'charles-spurgeon',
  elprincipedelospredicadores: 'charles-spurgeon',
  principe: 'charles-spurgeon',
  johnwesley: 'john-wesley',
  wesley: 'john-wesley',
  notasexplicativas: 'john-wesley',
  matthewhenry: 'matthew-henry',
  henry: 'matthew-henry',
  johncalvin: 'john-calvin',
  calvin: 'john-calvin',
  calvino: 'john-calvin',
  juancalvino: 'john-calvin',
  jamiesonfaussetbrown: 'jamieson-fausset-brown',
  jfb: 'jamieson-fausset-brown',
  jamieson: 'jamieson-fausset-brown',
  fausset: 'jamieson-fausset-brown',
  brown: 'jamieson-fausset-brown',
  martinluther: 'martin-luther',
  luther: 'martin-luther',
  lutero: 'martin-luther',
  johngill: 'john-gill',
  gill: 'john-gill',
  adamclarke: 'adam-clarke',
  clarke: 'adam-clarke',
  agustindehipona: 'agustin-de-hipona',
  agustin: 'agustin-de-hipona',
  augustine: 'agustin-de-hipona',
  hipona: 'agustin-de-hipona',
};

function compactAuthor(s) {
  return fold(s).replace(/[^a-z0-9]/g, '');
}

const chapterCache = new Map();
const UA = 'RevelatioCorpus/1.0 (public-domain commentary fetch)';

function fold(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function resolveAuthorId(raw) {
  const s = fold(raw);
  if (!s) return 'jamieson-fausset-brown';
  if (AUTHOR_META[s]) return s;
  const compact = compactAuthor(s);
  if (AUTHOR_ALIASES[compact]) return AUTHOR_ALIASES[compact];
  if (AUTHOR_META[s.replace(/\s+/g, '-')]) return s.replace(/\s+/g, '-');
  if (s.includes('spurgeon') || s.includes('principe')) return 'charles-spurgeon';
  if (s.includes('wesley')) return 'john-wesley';
  if (s.includes('henry')) return 'matthew-henry';
  if (s.includes('calvin') || s.includes('calvino')) return 'john-calvin';
  if (s.includes('jamieson') || s.includes('jfb') || s.includes('fausset')) {
    return 'jamieson-fausset-brown';
  }
  if (s.includes('luther') || s.includes('lutero')) return 'martin-luther';
  if (s.includes('agustin') || s.includes('augustine') || s.includes('hipona') || s.includes('agust')) {
    return 'agustin-de-hipona';
  }
  if (s.includes('gill')) return 'john-gill';
  if (s.includes('clarke')) return 'adam-clarke';
  return s.replace(/\s+/g, '-');
}

export function authorDisplayName(idOrLabel) {
  const id = resolveAuthorId(idOrLabel);
  return AUTHOR_META[id]?.name || String(idOrLabel || 'Comentarista').trim();
}

function parseEnglish(raw) {
  const m = String(raw || '').trim().match(/^((?:[1-3]\s+)?[^\d]+?)\s+(\d+)(?::(\d+)(?:-(\d+))?)?\s*$/);
  if (!m) return null;
  const name = fold(m[1]).replace(/^(the|san|st)\s+/, '');
  const idx = EN_SLUG.findIndex((slug) => fold(slug.replace(/-/g, ' ')) === name || fold(slug) === name.replace(/\s+/g, '-'));
  if (idx === -1) {
    const byOsis = OSIS.findIndex((o) => fold(o) === name);
    if (byOsis === -1) return null;
    return {
      libro: LIBROS[byOsis],
      libroId: byOsis + 1,
      capitulo: Number.parseInt(m[2], 10),
      versoInicio: m[3] ? Number.parseInt(m[3], 10) : null,
      versoFin: m[4] ? Number.parseInt(m[4], 10) : m[3] ? Number.parseInt(m[3], 10) : null,
    };
  }
  return {
    libro: LIBROS[idx],
    libroId: idx + 1,
    capitulo: Number.parseInt(m[2], 10),
    versoInicio: m[3] ? Number.parseInt(m[3], 10) : null,
    versoFin: m[4] ? Number.parseInt(m[4], 10) : m[3] ? Number.parseInt(m[3], 10) : null,
  };
}

export function parsePassage(raw) {
  const cruda = String(raw || '').trim();
  const parsed = parsearReferencia(cruda) || parseEnglish(cruda);
  if (!parsed) return null;
  const idx = parsed.libroId - 1;
  return {
    ...parsed,
    cruda,
    usfm: USFM[idx],
    osis: OSIS[idx],
    slug: EN_SLUG[idx],
    verse: parsed.versoInicio || 1,
  };
}

async function fetchText(url, timeoutMs = 12000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': UA, Accept: 'text/html,application/json,*/*' },
    });
    if (!res.ok) return { ok: false, status: res.status, text: '' };
    return { ok: true, status: res.status, text: await res.text() };
  } catch {
    return { ok: false, status: 0, text: '' };
  } finally {
    clearTimeout(t);
  }
}

async function fetchJson(url, timeoutMs = 12000) {
  const got = await fetchText(url, timeoutMs);
  if (!got.ok || !got.text) return null;
  try {
    return JSON.parse(got.text);
  } catch {
    return null;
  }
}

function htmlToText(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&ldquo;|&rdquo;|&#8220;|&#8221;/gi, '"')
    .replace(/&lsquo;|&rsquo;|&#8216;|&#8217;/gi, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function parseRangeIn(text, chapter) {
  const s = String(text || '').slice(0, 280);
  const m = s.match(
    new RegExp(
      String.raw`(?:verses?\s+)?(?:${chapter}\s*:\s*)?(\d{1,3})\s*[-–—]\s*(?:${chapter}\s*:\s*)?(\d{1,3})`,
      'i',
    ),
  );
  if (!m) return null;
  const a = Number(m[1]);
  const b = Number(m[2]);
  if (!a || !b || b < a) return null;
  return { start: a, end: b };
}

function flattenHelloaoVerse(item) {
  if (!item || typeof item !== 'object') return '';
  if (typeof item.text === 'string' && item.text.trim()) return item.text.trim();
  const content = item.content;
  if (typeof content === 'string') return content.trim();
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === 'string') return part;
        if (part && typeof part === 'object') {
          return part.text || part.value || flattenHelloaoVerse(part);
        }
        return '';
      })
      .filter(Boolean)
      .join('\n\n')
      .trim();
  }
  return '';
}

function notesFromHelloao(chapterJson) {
  const content = chapterJson?.chapter?.content || chapterJson?.content || [];
  if (!Array.isArray(content)) return [];
  const notes = [];
  for (const item of content) {
    if (!item || item.type === 'heading') continue;
    const n = Number(item.number || item.verse || 0);
    if (!n) continue;
    const text = flattenHelloaoVerse(item);
    if (!text) continue;
    const range = parseRangeIn(text, chapterJson?.chapter?.number || chapterJson?.thisChapterReference?.chapter);
    notes.push({
      start: range?.start || n,
      end: range?.end || n,
      text,
    });
  }
  return notes;
}

function pickNote(notes, verse) {
  const v = Number(verse) || 1;
  const list = Array.isArray(notes) ? notes.filter((n) => n && n.text) : [];
  if (!list.length) return null;

  const covering = list.filter((n) => v >= n.start && v <= (n.end || n.start));
  if (covering.length) {
    covering.sort((a, b) => (a.end - a.start) - (b.end - b.start) || b.start - a.start);
    return covering[0];
  }

  const exact = list.find((n) => n.start === v && (!n.end || n.end === v));
  if (exact) return exact;

  // Comentarios que agrupan (Henry, Calvino, Spurgeon por perícopa): pocos bloques.
  if (list.length <= 8) {
    const prev = list.filter((n) => n.start <= v).sort((a, b) => b.start - a.start)[0];
    const next = list.filter((n) => n.start > v).sort((a, b) => a.start - b.start)[0];
    if (prev && (!next || next.start - prev.start >= 3)) return prev;
  }
  return null;
}

async function cached(key, loader, { cacheEmpty = true } = {}) {
  if (chapterCache.has(key)) return chapterCache.get(key);
  const value = await loader();
  const empty = value == null
    || value === ''
    || (Array.isArray(value) && value.length === 0);
  if (!empty || cacheEmpty) chapterCache.set(key, value);
  return value;
}

async function loadHelloaoNotes(helloaoId, usfm, chapter) {
  const key = `helloao:${helloaoId}:${usfm}:${chapter}`;
  return cached(key, async () => {
    const simple = await fetchJson(`${HELLOAO}/api/c/${helloaoId}/${usfm}/${chapter}.simple.json`);
    if (simple) {
      const notes = notesFromHelloao(simple);
      if (notes.length) return notes;
    }
    const full = await fetchJson(`${HELLOAO}/api/c/${helloaoId}/${usfm}/${chapter}.json`);
    return full ? notesFromHelloao(full) : [];
  });
}

function parseSpeNotes(html, bookLabel, chapter) {
  const plain = htmlToText(html);
  const book = String(bookLabel || 'Luke').replace(/-/g, ' ');
  const heading = new RegExp(
    String.raw`(?:Verses?\s+(\d{1,3})\s*[-–—]\s*(\d{1,3})|${book}\s+${chapter}:(\d{1,3})(?:-(\d{1,3}))?|[A-Za-z]{2,5}_${chapter}:(\d{1,3})(?:-(\d{1,3}))?)`,
    'gi',
  );
  const hits = [];
  let m;
  while ((m = heading.exec(plain))) {
    const start = Number(m[1] || m[3] || m[5]);
    const end = Number(m[2] || m[4] || m[6] || start);
    if (!start) continue;
    hits.push({ index: m.index, length: m[0].length, start, end: end >= start ? end : start });
  }
  if (!hits.length) return [];
  const notes = [];
  for (let i = 0; i < hits.length; i++) {
    const from = hits[i].index + hits[i].length;
    const to = i + 1 < hits.length ? hits[i + 1].index : plain.length;
    const text = plain.slice(from, to).replace(/^[\s.:-]+/, '').trim();
    if (text.length < 40) continue;
    notes.push({ start: hits[i].start, end: hits[i].end, text });
  }
  return notes;
}

function parseSpeIndexRanges(html, chapter, verse) {
  const v = Number(verse) || 1;
  const ch = Number(chapter) || 1;
  const seen = new Set();
  const ranges = [];
  const re = /(\d{1,3})\/(\d{1,3})\/(\d{1,3})\/(\d{1,3})\//g;
  let m;
  while ((m = re.exec(String(html || '')))) {
    const sc = Number(m[1]);
    const sv = Number(m[2]);
    const ec = Number(m[3]);
    const ev = Number(m[4]);
    const covers =
      (sc < ch || (sc === ch && sv <= v)) &&
      (ec > ch || (ec === ch && ev >= v));
    if (!covers) continue;
    const key = `${sc}:${sv}-${ec}:${ev}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const span = (ec - sc) * 200 + (ev - sv);
    ranges.push({ sc, sv, ec, ev, span });
  }
  ranges.sort((a, b) => a.span - b.span || a.sv - b.sv);
  return ranges;
}

function stripSpeChrome(plain) {
  let t = String(plain || '');
  t = t.replace(/^[\s\S]*?Spurgeon Verse Expositions[^\n]{0,120}/i, '');
  t = t.replace(/This Chapter Verse Commentaries:[\s\S]*?(?=[A-Za-z]{2,5}_\d+:\d+)/i, '');
  t = t.replace(/Commentary Index[\s\S]*?(?=Mat_|Mar_|Mrk_|Luk_|Joh_|Rom_)/i, '');
  return t.trim();
}

async function loadSpeIndexHtml(slug) {
  const key = `speidx:${slug}`;
  return cached(key, async () => {
    const idx = await fetchText(`${SPE_PRAYERREQUEST}/${slug}/`);
    return idx.ok ? idx.text : '';
  }, { cacheEmpty: false });
}

async function loadSpePrayerRequest(slug, chapter, verse, bookLabel) {
  const key = `spepr:${slug}:${chapter}:${verse}`;
  return cached(key, async () => {
    const idxText = await loadSpeIndexHtml(slug);
    if (!idxText) return [];
    const ranges = parseSpeIndexRanges(idxText, chapter, verse);
    if (!ranges.length) return [];
    const best = ranges[0];
    const pageKey = `spepage:${slug}:${best.sc}:${best.sv}:${best.ec}:${best.ev}`;
    return cached(pageKey, async () => {
      const page = await fetchText(
        `${SPE_PRAYERREQUEST}/${slug}/${best.sc}/${best.sv}/${best.ec}/${best.ev}/`,
      );
      if (!page.ok) return [];
      const notes = parseSpeNotes(page.text, bookLabel, chapter);
      if (notes.length) return notes;
      const body = stripSpeChrome(htmlToText(page.text));
      if (body.length > 80) {
        return [{ start: best.sv, end: best.ev, text: body }];
      }
      return [];
    }, { cacheEmpty: false });
  }, { cacheEmpty: false });
}

function parseClarkeAccNotes(html) {
  const source = String(html || '');
  const re = /(?:name="(?:verse-)?(\d+)"|data-entry="verse-(\d+)")/gi;
  const hits = [];
  const seenAt = new Set();
  let m;
  while ((m = re.exec(source))) {
    const start = Number(m[1] || m[2]);
    if (!start) continue;
    const key = `${start}@${m.index}`;
    if (seenAt.has(key)) continue;
    seenAt.add(key);
    hits.push({ start, index: m.index, length: m[0].length });
  }
  if (!hits.length) return [];
  hits.sort((a, b) => a.index - b.index);
  const firstByVerse = [];
  const seenVerse = new Set();
  for (const hit of hits) {
    if (seenVerse.has(hit.start)) continue;
    seenVerse.add(hit.start);
    firstByVerse.push(hit);
  }
  const notes = [];
  for (let i = 0; i < firstByVerse.length; i++) {
    const from = firstByVerse[i].index + firstByVerse[i].length;
    const to = i + 1 < firstByVerse.length ? firstByVerse[i + 1].index : source.length;
    const text = htmlToText(source.slice(from, to))
      .replace(/^>+\s*/g, '')
      .replace(/^Verse\s+\d+\s*/i, '')
      .replace(/^return to[\s\S]{0,80}Top of Page/i, '')
      .trim();
    if (text.length < 40) continue;
    notes.push({
      start: firstByVerse[i].start,
      end: firstByVerse[i].start,
      text,
    });
  }
  return notes;
}

async function loadClarkeAccNotes(slug, chapter) {
  const key = `acc:${slug}:${chapter}`;
  return cached(key, async () => {
    const urls = [
      `${ACC_BASE}/${slug}-${chapter}.php`,
      `${ACC_STUDYLIGHT}/${slug}-${chapter}.html`,
    ];
    for (const url of urls) {
      const got = await fetchText(url, 18000);
      if (!got.ok) continue;
      const notes = parseClarkeAccNotes(got.text);
      if (notes.length) return notes;
    }
    return [];
  }, { cacheEmpty: false });
}

async function loadSpeNotes(slug, chapter, bookLabel) {
  const key = `spe:${slug}:${chapter}`;
  return cached(key, async () => {
    const urls = [
      `${SPE_BASE}/${slug}-${chapter}.php`,
      `${SPE_STUDYLIGHT}/${slug}-${chapter}.html`,
    ];
    for (const url of urls) {
      const got = await fetchText(url);
      if (!got.ok) continue;
      const notes = parseSpeNotes(got.text, bookLabel, chapter);
      if (notes.length) return notes;
    }
    return [];
  }, { cacheEmpty: false });
}

function dedupeLineasCabecera(text) {
  const lines = String(text || '').split('\n');
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const cur = lines[i].trim();
    const prev = (out[out.length - 1] || '').trim();
    if (cur && cur === prev && /^(Matthew|Mark|Luke|John)\s+\d+:\d+/.test(cur)) continue;
    out.push(lines[i]);
  }
  return out.join('\n');
}

function recortarNotaSinoptica(raw, osis, chapter, verse) {
  const book = GOSPEL_EN[osis] || '';
  const v = Number(verse) || 1;
  const ch = Number(chapter) || 0;
  let t = dedupeLineasCabecera(String(raw || '').replace(/\r/g, ''));
  if (!book) return t.trim();

  const headingRe = /^(Matthew|Mark|Luke|John)\s+(\d+):(\d+)(?:-(\d+))?\.?/gm;
  const hits = [];
  let m;
  while ((m = headingRe.exec(t))) {
    const start = Number(m[3]);
    const end = Number(m[4] || m[3]);
    hits.push({
      book: m[1],
      chapter: Number(m[2]),
      start,
      end: end >= start ? end : start,
      index: m.index,
      range: Boolean(m[4]),
    });
  }

  const innerRe = new RegExp(
    String.raw`(?:^|\n)\s*${v}\.\s+[^\n][\s\S]*?(?=\n\s*(?:\d+\.\s+|Matthew|Mark|Luke|John)\s+|$)`,
    'gi',
  );
  const innerBlocks = [...t.matchAll(innerRe)]
    .map((x) => x[0].replace(/^\n/, '').trim())
    .filter((x) => x.length > 80);
  if (innerBlocks.length) {
    innerBlocks.sort((a, b) => b.length - a.length);
    return innerBlocks[0];
  }

  const verseHeads = hits.filter((h) => !h.range);
  const prev = verseHeads
    .filter((h) => h.book === book && h.chapter === ch && h.start <= v)
    .sort((a, b) => b.start - a.start)[0];
  if (prev) {
    const next = hits.find((h) => h.index > prev.index && (h.book !== book || h.start > v || h.chapter !== ch));
    return t.slice(prev.index, next ? next.index : t.length).trim();
  }

  const ownRanges = hits.filter(
    (h) => h.book === book && h.chapter === ch && v >= h.start && v <= h.end,
  );
  if (ownRanges.length) {
    ownRanges.sort((a, b) => (a.end - a.start) - (b.end - b.start));
    const h = ownRanges[0];
    const nextOther = hits.find((x) => x.index > h.index && x.book !== book);
    return t.slice(h.index, nextOther ? nextOther.index : t.length).trim();
  }
  return t.trim();
}

function isGarbageNote(text) {
  const t = String(text || '').trim();
  if (t.length < 40) return true;
  if (/No Commentary on these verses is yet included/i.test(t)) return true;
  const words = t.match(/[A-Za-zÁÉÍÓÚáéíóúñ]{4,}/g) || [];
  if (words.length < 12) return true;
  return false;
}

function parseCrosswireNote(html) {
  if (/No Commentary on these verses is yet included/i.test(html)) return '';
  let text = htmlToText(html);
  text = text.replace(/^[\s\S]*?(?:this chapter\s*-->\s*next chapter|next chapter)\s+/i, '');
  text = text.replace(/\s*previous chapter[\s\S]*$/i, '');
  text = text.replace(/^[\s\S]{0,120}?(?:Notes on the Bible|Commentary[^\n]{0,80})\s+/i, '');
  text = text.replace(/xhtml\s*-->/gi, '').trim();
  if (/previous chapter/i.test(text) && /next chapter/i.test(text)) {
    const stripped = text
      .replace(/previous chapter/gi, ' ')
      .replace(/next chapter/gi, ' ')
      .replace(/this chapter[^a-z]{0,40}/gi, ' ')
      .replace(/John Wesley's Notes[^\n]*/gi, ' ')
      .replace(/\b(?:Matthew|Mark|Luke|John)\s+\d+:\d+\b/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (stripped.length < 120) return '';
    text = stripped;
  }
  if (isGarbageNote(text)) return '';
  return text;
}

async function loadCrosswire(mod, osis, chapter, verse) {
  const key = `cw:${mod}:${osis}.${chapter}.${verse}`;
  return cached(key, async () => {
    const url = `${CROSSWIRE}?mod=${encodeURIComponent(mod)}&key=${encodeURIComponent(`${osis}.${chapter}.${verse}`)}`;
    const got = await fetchText(url);
    if (!got.ok) return '';
    return parseCrosswireNote(got.text);
  });
}

function parseWesleyHtmlNotes(html) {
  const parts = String(html || '').split(/<h4>\s*Verse\s+(\d+)\s*<\/h4>/i);
  if (parts.length < 3) return [];
  const notes = [];
  for (let i = 1; i < parts.length; i += 2) {
    const start = Number(parts[i]);
    const text = htmlToText(parts[i + 1] || '')
      .replace(/^\[\d+\][^\n]{0,400}/, '')
      .trim();
    if (!start || text.length < 20) continue;
    notes.push({ start, end: start, text });
  }
  return notes;
}

function parseWesleyBiblehubNotes(html, chapter) {
  const plain = htmlToText(html);
  const ch = Number(chapter) || 0;
  const heading = new RegExp(
    String.raw`(?:Matthew|Mark|Luke|John|Acts|Romans|Genesis)\s+${ch}:(\d+)|(?:^|\n)\s*${ch}:(\d+)\s+`,
    'gi',
  );
  const hits = [];
  let m;
  while ((m = heading.exec(plain))) {
    const start = Number(m[1] || m[2]);
    if (!start) continue;
    hits.push({ index: m.index, length: m[0].length, start });
  }
  if (!hits.length) return [];
  const notes = [];
  for (let i = 0; i < hits.length; i++) {
    const from = hits[i].index + hits[i].length;
    const to = i + 1 < hits.length ? hits[i + 1].index : plain.length;
    const text = plain.slice(from, to).replace(/^[\s.:-]+/, '').trim();
    if (text.length < 20) continue;
    notes.push({ start: hits[i].start, end: hits[i].start, text });
  }
  return notes;
}

async function loadWesleyHtml(slug, chapter) {
  const key = `weshtml:${slug}:${chapter}`;
  return cached(key, async () => {
    const got = await fetchText(`${WESLEY_HTML}/${slug}/${chapter}`);
    if (!got.ok) return [];
    return parseWesleyHtmlNotes(got.text);
  }, { cacheEmpty: false });
}

async function loadWesleyBiblehub(slug, chapter) {
  const key = `wesbh:${slug}:${chapter}`;
  return cached(key, async () => {
    const got = await fetchText(`${WESLEY_BIBLEHUB}/${slug}/${chapter}.htm`);
    if (!got.ok) return [];
    return parseWesleyBiblehubNotes(got.text, chapter);
  }, { cacheEmpty: false });
}

export function envelopeComentario(text, author, source = 'corpus') {
  const cuerpo = String(text || '').trim();
  const paragraphs = cuerpo.split(/\n{2,}/).map((t) => t.trim()).filter(Boolean);
  return {
    ia: false,
    vacio: !cuerpo,
    generico: false,
    nivel: 'versiculo',
    titulo: author || 'Comentarista clásico',
    obra: '',
    cuerpo,
    paragraphs,
    entradas: paragraphs.map((t, i) => ({ n: String(i + 1), texto: t })),
  };
}

function missPayload(authorName, passage, authorId) {
  const text = `No hay nota de ${authorName} para ${passage}.`;
  return {
    found: false,
    text,
    answer: text,
    author: authorName,
    authorId,
    source: 'corpus-miss',
    passage,
    data: envelopeComentario(text, authorName, 'corpus-miss'),
  };
}

function hitPayload(authorName, passage, authorId, source, text) {
  const cuerpo = String(text || '').trim();
  return {
    found: true,
    text: cuerpo,
    answer: cuerpo,
    author: authorName,
    authorId,
    source,
    passage,
    data: envelopeComentario(cuerpo, authorName, source),
  };
}

async function fetchSpurgeon(ref) {
  const { slug, osis, capitulo, verse, usfm } = ref;
  if (usfm === 'PSA') {
    const tod = await loadCrosswire('TDavid', 'Ps', capitulo, verse);
    if (tod && tod.length > 80) return { source: 'corpus:charles-spurgeon:tdavid', text: tod };
  }
  const prayer = await loadSpePrayerRequest(slug, capitulo, verse, osis);
  const fromRange = pickNote(prayer, verse);
  if (fromRange?.text) return { source: 'corpus:charles-spurgeon', text: fromRange.text };
  const spe = await loadSpeNotes(slug, capitulo, osis);
  const note = pickNote(spe, verse);
  if (note?.text) return { source: 'corpus:charles-spurgeon', text: note.text };
  return null;
}

async function fetchWesley(ref) {
  const cw = await loadCrosswire('Wesley', ref.osis, ref.capitulo, ref.verse);
  if (cw && cw.length > 20) return { source: 'corpus:john-wesley', text: cw };
  const htmlNotes = await loadWesleyHtml(ref.slug, ref.capitulo);
  const fromSite = pickNote(htmlNotes, ref.verse);
  if (fromSite?.text) return { source: 'corpus:john-wesley', text: fromSite.text };
  const hub = await loadWesleyBiblehub(ref.slug, ref.capitulo);
  const fromHub = pickNote(hub, ref.verse);
  if (fromHub?.text) return { source: 'corpus:john-wesley', text: fromHub.text };
  return null;
}

async function fetchLuther(ref) {
  const cw = await loadCrosswire('Luther', ref.osis, ref.capitulo, ref.verse);
  if (cw && cw.length > 40) return { source: 'corpus:martin-luther', text: cw };
  return null;
}

async function fetchAugustine(ref) {
  const mod = ref.usfm === 'PSA' ? 'Augustine' : 'Augustine';
  const osisKey = ref.usfm === 'PSA' ? 'Ps' : ref.osis;
  const cw = await loadCrosswire(mod, osisKey, ref.capitulo, ref.verse);
  if (cw && cw.length > 60) return { source: 'corpus:agustin-de-hipona', text: cw };
  return null;
}

/**
 * @returns {Promise<{found:boolean, text:string, answer:string, author:string, authorId:string, source:string, passage:string, data:object}>}
 */
export async function obtenerComentarioCorpus({ passage, author } = {}) {
  const authorId = resolveAuthorId(author);
  const authorName = authorDisplayName(authorId);
  const ref = parsePassage(passage);
  const etiqueta = ref
    ? `${ref.libro} ${ref.capitulo}${ref.verse ? `:${ref.verse}` : ''}`
    : String(passage || '').trim() || 'el pasaje';

  if (!ref?.usfm) return missPayload(authorName, etiqueta, authorId);

  try {
    const helloaoId = AUTHOR_META[authorId]?.helloao;
    if (helloaoId) {
      const notes = await loadHelloaoNotes(helloaoId, ref.usfm, ref.capitulo);
      const note = pickNote(notes, ref.verse);
      if (note?.text) {
        const text = helloaoId === 'john-calvin'
          ? recortarNotaSinoptica(note.text, ref.osis, ref.capitulo, ref.verse)
          : note.text;
        return attachStoredSpanish(hitPayload(authorName, etiqueta, authorId, `corpus:${helloaoId}`, text));
      }
      if (authorId === 'adam-clarke') {
        const acc = await loadClarkeAccNotes(ref.slug, ref.capitulo);
        const accNote = pickNote(acc, ref.verse);
        if (accNote?.text) {
          return attachStoredSpanish(
            hitPayload(authorName, etiqueta, authorId, 'corpus:adam-clarke', accNote.text),
          );
        }
      }
      return missPayload(authorName, etiqueta, authorId);
    }

    let got = null;
    if (authorId === 'charles-spurgeon') got = await fetchSpurgeon(ref);
    else if (authorId === 'john-wesley') got = await fetchWesley(ref);
    else if (authorId === 'martin-luther') got = await fetchLuther(ref);
    else if (authorId === 'agustin-de-hipona') got = await fetchAugustine(ref);

    if (got?.text) {
      return attachStoredSpanish(hitPayload(authorName, etiqueta, authorId, got.source, got.text));
    }
    return missPayload(authorName, etiqueta, authorId);
  } catch (err) {
    console.warn('[comentario-corpus]', authorId, etiqueta, err?.message || err);
    return missPayload(authorName, etiqueta, authorId);
  }
}

export function jsonComentarioCorpus(result) {
  const found = Boolean(result?.found);
  const text = String(result?.text || '').trim();
  const textEn = String(result?.textEn || (result?.translated ? '' : text)).trim();
  const textEs = String(result?.textEs || '').trim();
  return {
    success: true,
    ok: true,
    found,
    text,
    answer: text,
    textEn: result?.translated ? textEn : text,
    textEs,
    translated: Boolean(result?.translated),
    lang: result?.lang || (result?.translated ? 'es' : 'en'),
    disclaimer: result?.disclaimer || '',
    author: result?.author,
    authorId: result?.authorId,
    source: result?.source,
    passage: result?.passage,
    data: result?.data,
  };
}
