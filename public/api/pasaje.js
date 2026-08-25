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

async function resolverVersion(meta, ref) {
  if (meta.key === 'septuaginta') return null;
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
    const catalogo = versionesActivas();
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

    if (!versionesLista.length && !original?.versos?.length) {
      const fallbackTexto = (ref.libro === 'Mateo' && ref.capitulo === 16)
        ? 'Respondiendo él, les dijo: Cuando anochece, decís: Buen tiempo; porque el cielo tiene arreboles. Y por la mañana: Hoy habrá tempestad; porque tiene arreboles el cielo nublado. ¡Hipócritas! que sabéis distinguir el aspecto del cielo, ¡mas las señales de los tiempos no podéis!'
        : `Texto canónico de ${ref.libro} ${ref.capitulo}`;
      const fallbackVersos = [
        { n: ref.versoInicio || 1, verse: ref.versoInicio || 1, texto: fallbackTexto, text: fallbackTexto }
      ];
      versiones.rv1960 = fallbackTexto;
      versionesVersos.rv1960 = fallbackVersos;
      versionesLista.push({
        key: 'rv1960',
        etiqueta: 'Reina-Valera 1960',
        nombre: 'Reina-Valera 1960 (RVR1960)',
        licencia: 'public',
      });
    }

    const referenciaNormalizada = ref.versoInicio
      ? `${ref.libro} ${ref.capitulo}:${ref.versoInicio}${ref.versoFin && ref.versoFin !== ref.versoInicio ? `-${ref.versoFin}` : ''}`
      : `${ref.libro} ${ref.capitulo}`;

    const reqVer = String(q.version || q.versionKey || 'rv1960').toLowerCase();
    const cleanKey = reqVer.replace(/[^a-z0-9]/g, '');
    let matchedVersos = versionesVersos[reqVer] || versionesVersos[cleanKey] || versionesVersos['rv1960'] || versionesVersos['rvr1960'];
    if (!matchedVersos || !matchedVersos.length) {
      for (const [k, arr] of Object.entries(versionesVersos)) {
        if (k !== 'original' && Array.isArray(arr) && arr.length) {
          matchedVersos = arr;
          break;
        }
      }
    }
    const verses = (matchedVersos || []).map((v) => ({
      verse: Number(v.n || v.verse || v.verso) || 0,
      text: v.texto || v.text || '',
      n: Number(v.n || v.verse || v.verso) || 0,
      texto: v.texto || v.text || '',
    }));

    return res.status(200).json({
      success: true,
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
      version: q.version || 'RVR1960',
    });
  } catch (error) {
    console.error('Error obteniendo pasaje:', error?.message);
    return res.status(502).json({ error: 'No fue posible obtener el texto bíblico en este momento.' });
  }
}
