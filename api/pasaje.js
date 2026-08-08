import { createClient } from '@supabase/supabase-js';

// Texto bíblico REAL (no generado por IA): se sirve desde Bolls Bible
// (bolls.life), una API pública gratuita y sin clave, para que la lectura
// sea instantánea y fiel a traducciones reales, en lugar de esperar a que
// un modelo de IA "recuerde" el versículo (lento y con riesgo de inexactitud
// en un texto sagrado).

const getSupabaseConfig = () => ({
  url: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  anonKey: process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

async function authenticate(req) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  const { url, anonKey } = getSupabaseConfig();
  if (!token || !url || !anonKey) return null;
  const supabase = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await supabase.auth.getUser(token);
  return error ? null : data.user;
}

// Los 66 libros en el orden canónico protestante = numeración 1-66 de Bolls.
const LIBROS = [
  'Génesis', 'Éxodo', 'Levítico', 'Números', 'Deuteronomio', 'Josué', 'Jueces', 'Rut', '1 Samuel', '2 Samuel',
  '1 Reyes', '2 Reyes', '1 Crónicas', '2 Crónicas', 'Esdras', 'Nehemías', 'Ester', 'Job', 'Salmos', 'Proverbios',
  'Eclesiastés', 'Cantares', 'Isaías', 'Jeremías', 'Lamentaciones', 'Ezequiel', 'Daniel', 'Oseas', 'Joel', 'Amós',
  'Abdías', 'Jonás', 'Miqueas', 'Nahúm', 'Habacuc', 'Sofonías', 'Hageo', 'Zacarías', 'Malaquías',
  'Mateo', 'Marcos', 'Lucas', 'Juan', 'Hechos', 'Romanos', '1 Corintios', '2 Corintios', 'Gálatas', 'Efesios',
  'Filipenses', 'Colosenses', '1 Tesalonicenses', '2 Tesalonicenses', '1 Timoteo', '2 Timoteo', 'Tito', 'Filemón',
  'Hebreos', 'Santiago', '1 Pedro', '2 Pedro', '1 Juan', '2 Juan', '3 Juan', 'Judas', 'Apocalipsis'
];

// Catálogo real de versiones en español disponibles vía Bolls (sin clave, gratis).
const VERSIONES = [
  { key: 'rv1960', bolls: 'RV1960', etiqueta: 'RVR 1960' },
  { key: 'nvi', bolls: 'NVI', etiqueta: 'NVI' },
  { key: 'ntv', bolls: 'NTV', etiqueta: 'NTV' },
  { key: 'lbla', bolls: 'LBLA', etiqueta: 'LBLA' },
  { key: 'pdt', bolls: 'PDT', etiqueta: 'PDT' },
  { key: 'btx3', bolls: 'BTX3', etiqueta: 'Biblia Textual' },
  { key: 'rv2004', bolls: 'RV2004', etiqueta: 'RVR Gómez 2004' }
];

const normalizar = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

function parsearReferencia(ref) {
  const m = String(ref || '').trim().match(/^((?:[1-3]\s+)?[^\d]+?)\s+(\d+)(?::(\d+)(?:-(\d+))?)?\s*$/);
  if (!m) return null;
  const nombre = normalizar(m[1]);
  const idx = LIBROS.findIndex((l) => normalizar(l) === nombre);
  if (idx === -1) return null;
  const capitulo = Number.parseInt(m[2], 10);
  const versoInicio = m[3] ? Number.parseInt(m[3], 10) : null;
  const versoFin = m[4] ? Number.parseInt(m[4], 10) : versoInicio;
  return { libro: LIBROS[idx], libroId: idx + 1, capitulo, versoInicio, versoFin };
}

async function fetchConTimeout(url, opts = {}, ms = 6000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(url, { ...opts, signal: ctrl.signal });
    if (!r.ok) return null;
    return await r.json();
  } catch (_e) {
    return null;
  } finally {
    clearTimeout(t);
  }
}

// Simple caché en memoria por instancia (best-effort entre invocaciones cálidas).
const cacheCapitulo = new Map();
const TTL_MS = 30 * 60 * 1000;

async function obtenerCapitulo(bolls, libroId, capitulo) {
  const clave = `${bolls}:${libroId}:${capitulo}`;
  const cacheada = cacheCapitulo.get(clave);
  if (cacheada && Date.now() - cacheada.t < TTL_MS) return cacheada.data;
  const data = await fetchConTimeout(`https://bolls.life/get-chapter/${bolls}/${libroId}/${capitulo}/`);
  if (data) cacheCapitulo.set(clave, { data, t: Date.now() });
  return data;
}

function extraerTexto(versos, versoInicio, versoFin) {
  if (!Array.isArray(versos) || !versos.length) return '';
  const filtrados = versoInicio ? versos.filter((v) => v.verse >= versoInicio && v.verse <= versoFin) : versos;
  if (!filtrados.length) return '';
  if (filtrados.length === 1) return String(filtrados[0].text || '').replace(/\s+/g, ' ').trim();
  return filtrados.map((v) => `${v.verse} ${String(v.text || '').replace(/\s+/g, ' ').trim()}`).join(' ');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método no permitido.' });
  }

  const user = await authenticate(req);
  if (!user) return res.status(401).json({ error: 'Sesión inválida o vencida.' });

  const referencia = typeof req.body?.referencia === 'string' ? req.body.referencia.trim() : '';
  if (!referencia || referencia.length > 60) {
    return res.status(400).json({ error: 'La referencia bíblica no es válida.' });
  }

  const ref = parsearReferencia(referencia);
  if (!ref) {
    return res.status(400).json({ error: 'No se pudo interpretar esa referencia. Usa el formato "Libro capítulo:versículo".' });
  }

  try {
    const resultados = await Promise.all(
      VERSIONES.map(async (v) => {
        const data = await obtenerCapitulo(v.bolls, ref.libroId, ref.capitulo);
        const texto = extraerTexto(data, ref.versoInicio, ref.versoFin);
        return { ...v, texto };
      })
    );

    const versiones = {};
    const versionesLista = [];
    for (const r of resultados) {
      if (r.texto) {
        versiones[r.key] = r.texto;
        versionesLista.push({ key: r.key, etiqueta: r.etiqueta });
      }
    }

    if (!versionesLista.length) {
      return res.status(502).json({ error: 'No fue posible obtener el texto bíblico en este momento. Intenta de nuevo.' });
    }

    const referenciaNormalizada = ref.versoInicio
      ? `${ref.libro} ${ref.capitulo}:${ref.versoInicio}${ref.versoFin && ref.versoFin !== ref.versoInicio ? `-${ref.versoFin}` : ''}`
      : `${ref.libro} ${ref.capitulo}`;

    return res.status(200).json({
      success: true,
      data: { referencia: referenciaNormalizada, versiones, versionesLista }
    });
  } catch (error) {
    console.error('Error obteniendo pasaje real:', error?.message);
    return res.status(502).json({ error: 'No fue posible obtener el texto bíblico en este momento. Intenta de nuevo.' });
  }
}
