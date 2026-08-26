import { createClient } from '@supabase/supabase-js';
import { parsearReferencia, obtenerCapitulo, extraerVersos, obtenerOriginal, VERSIONES } from '../lib/biblia.js';
import { versionesActivas, cargarPack, versosDesdePack } from '../lib/versiones.js';

const getSupabaseConfig = () => ({
  url: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  anonKey: process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

async function authenticate(req) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  const { url, anonKey } = getSupabaseConfig();
  if (!token || !url || !anonKey) return null;
  const supabase = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.auth.getUser(token);
  return error ? null : data.user;
}

function bloqueDe(versos) {
  if (!versos?.length) return '';
  if (versos.length === 1) return versos[0].texto;
  return versos.map((v) => `${v.n} ${v.texto}`).join(' ');
}

function claveVersion(raw) {
  return String(raw || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function esInglesLector(key) {
  const k = claveVersion(key);
  return k === 'kjv' || k === 'kjva' || k === 'kingjames' || k === 'av' || k.includes('kjv');
}

function esEspanolLector(key) {
  const k = claveVersion(key);
  return k === 'rv1960' || k === 'rvr1960' || k === 'nvi' || k === 'tla' || k === 'dhh' || k === 'rv1909' || k === 'rvr1909';
}

async function resolverVersion(meta, ref) {
  if (!meta?.key || meta.key === 'septuaginta') return null;
  if (esInglesLector(meta.key)) return null;
  let versos = versosDesdePack(
    cargarPack(meta.key),
    ref.libro,
    ref.capitulo,
    ref.versoInicio,
    ref.versoFin
  );
  if (!versos.length && meta.fuente_remota) {
    const remota = VERSIONES.find((v) => v.key === meta.key);
    const data = await obtenerCapitulo(remota?.bolls || meta.fuente_remota, ref.libroId, ref.capitulo);
    versos = extraerVersos(data, ref.versoInicio, ref.versoFin);
  }
  const texto = bloqueDe(versos);
  if (!texto) return null;
  return {
    key: meta.key,
    etiqueta: meta.etiqueta,
    nombre: meta.nombre,
    licencia: meta.licencia,
    texto,
    versos,
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Método no permitido.' });
  }

  await authenticate(req);

  const q = { ...(req.query || {}), ...((req.body && typeof req.body === 'object') ? req.body : {}) };
  let referencia = typeof q.referencia === 'string' ? q.referencia.trim() : '';
  if (!referencia && (q.book || q.libro)) {
    const libro = String(q.book || q.libro).trim();
    const cap = q.chapter || q.capitulo || 1;
    const verso = q.verse || q.verso || q.versiculo;
    referencia = verso ? `${libro} ${cap}:${verso}` : `${libro} ${cap}`;
  }
  if (!referencia && (q.passage || q.ref)) {
    referencia = String(q.passage || q.ref).trim();
  }
  if (!referencia || referencia.length > 120) {
    return res.status(400).json({ error: 'La consulta no es válida.' });
  }

  const ref = parsearReferencia(referencia);
  if (!ref) {
    return res.status(400).json({ error: 'No reconocemos esa referencia.' });
  }

  try {
    const catalogo = versionesActivas().filter((meta) => !esInglesLector(meta.key));
    const [original, ...resueltas] = await Promise.all([
      obtenerOriginal(ref).catch(() => null),
      ...catalogo.map((meta) => resolverVersion(meta, ref).catch(() => null)),
    ]);

    const versiones = {};
    const versionesVersos = {};
    const versionesLista = [];

    for (const item of resueltas) {
      if (!item) continue;
      versiones[item.key] = item.texto;
      versionesVersos[item.key] = item.versos;
      versionesLista.push({
        key: item.key,
        etiqueta: item.etiqueta,
        nombre: item.nombre,
        licencia: item.licencia,
      });
    }

    if (ref.esAT) {
      const dataLxx = await obtenerCapitulo('LXX', ref.libroId, ref.capitulo);
      let lxxVersos = extraerVersos(dataLxx, null, null);
      if (!lxxVersos.length) {
        lxxVersos = versosDesdePack(cargarPack('septuaginta'), ref.libro, ref.capitulo, null, null);
      }
      if (lxxVersos.length) {
        versiones.septuaginta = bloqueDe(lxxVersos);
        versionesVersos.septuaginta = lxxVersos;
        versionesLista.push({
          key: 'septuaginta',
          etiqueta: 'Septuaginta (Rahlfs)',
          licencia: 'public',
        });
      }
    }

    if (original?.versos?.length) {
      versionesVersos.original = original.versos;
    }

    const referenciaNormalizada = ref.versoInicio
      ? `${ref.libro} ${ref.capitulo}:${ref.versoInicio}${ref.versoFin && ref.versoFin !== ref.versoInicio ? `-${ref.versoFin}` : ''}`
      : `${ref.libro} ${ref.capitulo}`;

    const reqVerRaw = String(q.version || q.versionKey || 'rv1960');
    const reqVer = esInglesLector(reqVerRaw) ? 'rv1960' : reqVerRaw.toLowerCase();
    const cleanKey = claveVersion(reqVer);
    const rvrAsked = cleanKey === 'rv1960' || cleanKey === 'rvr1960' || cleanKey === 'rv1909' || cleanKey === 'rvr1909';
    let matchedVersos = versionesVersos[reqVer] || versionesVersos[cleanKey] || [];
    if ((!matchedVersos || !matchedVersos.length) && rvrAsked) {
      matchedVersos = versionesVersos.rv1960 || versionesVersos.rvr1960 || [];
    }
    const verses = (matchedVersos || []).map((v) => ({
      verse: Number(v.n || v.verse || v.verso) || 0,
      text: v.texto || v.text || '',
      n: Number(v.n || v.verse || v.verso) || 0,
      texto: v.texto || v.text || '',
    }));
    const matchedMeta = versionesLista.find((v) => v.key === cleanKey || v.key === reqVer)
      || (rvrAsked ? versionesLista.find((v) => v.key === 'rv1960') : null);
    const versionLabel = matchedMeta?.etiqueta
      || (cleanKey === 'dhh' ? 'Dios Habla Hoy'
        : cleanKey === 'tla' ? 'Traducción en Lenguaje Actual'
        : cleanKey === 'nvi' ? 'Nueva Versión Internacional'
        : 'Reina-Valera 1960');
    const versionEmpty = !verses.length && !rvrAsked;
    const note = versionEmpty
      ? `Pack local y Bolls vacíos para ${versionLabel}. No se sustituye por Reina-Valera.`
      : undefined;

    return res.status(200).json({
      success: !versionEmpty || Boolean(original?.versos?.length) || Boolean(versionesLista.length),
      note,
      data: {
        referencia: referenciaNormalizada,
        versiones,
        versionesVersos,
        versionesLista,
        original,
      },
      verses,
      book: ref.libro,
      chapter: ref.capitulo,
      version: versionLabel,
    });
  } catch (error) {
    console.error('Error obteniendo pasaje:', error?.message);
    return res.status(502).json({ error: 'No fue posible obtener el texto bíblico en este momento.' });
  }
}
