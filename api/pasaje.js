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
  const supabase = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await supabase.auth.getUser(token);
  return error ? null : data.user;
}

function bloqueDe(versos) {
  if (!versos?.length) return '';
  if (versos.length === 1) return versos[0].texto;
  return versos.map((v) => `${v.n} ${v.texto}`).join(' ');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método no permitido.' });
  }

  await authenticate(req);

  const referencia = typeof req.body?.referencia === 'string' ? req.body.referencia.trim() : '';
  if (!referencia || referencia.length > 120) {
    return res.status(400).json({ error: 'La consulta no es válida.' });
  }

  const ref = parsearReferencia(referencia);
  if (!ref) {
    return res.status(400).json({ error: 'No reconocemos esa referencia.' });
  }

  try {
    const catalogo = versionesActivas();
    const original = await obtenerOriginal(ref).catch(() => null);
    const versiones = {};
    const versionesVersos = {};
    const versionesLista = [];

    for (const meta of catalogo) {
      if (meta.key === 'septuaginta') continue;
      let versos = versosDesdePack(cargarPack(meta.key), ref.libro, ref.capitulo, ref.versoInicio, ref.versoFin);
      if (!versos.length && meta.fuente_remota) {
        const remota = VERSIONES.find((v) => v.key === meta.key);
        const data = await obtenerCapitulo(remota?.bolls || meta.fuente_remota, ref.libroId, ref.capitulo);
        versos = extraerVersos(data, ref.versoInicio, ref.versoFin);
      }
      const texto = bloqueDe(versos);
      if (texto) {
        versiones[meta.key] = texto;
        versionesVersos[meta.key] = versos;
        versionesLista.push({ key: meta.key, etiqueta: meta.etiqueta, nombre: meta.nombre, licencia: meta.licencia });
      }
    }

    const lxxLocal = versosDesdePack(cargarPack('septuaginta'), ref.libro, ref.capitulo, ref.versoInicio, ref.versoFin);
    if (lxxLocal.length) {
      versiones.septuaginta = bloqueDe(lxxLocal);
      versionesVersos.septuaginta = lxxLocal;
      versionesLista.push({ key: 'septuaginta', etiqueta: 'Septuaginta', licencia: 'public' });
    } else if (ref.esAT && original?.septuaginta?.texto) {
      versiones.septuaginta = original.septuaginta.texto;
      versionesVersos.septuaginta = original.septuaginta.texto.split(/(?=\d+\s)/).filter(Boolean).map((texto, indice) => {
        const match = texto.trim().match(/^(\d+)\s+([\s\S]*)$/);
        return { n: Number(match?.[1] || indice + 1), texto: match?.[2] || texto.trim() };
      });
      versionesLista.push({ key: 'septuaginta', etiqueta: 'Septuaginta', licencia: 'public' });
    }

    if (original?.versos?.length) {
      versionesVersos.original = original.versos;
    }

    if (!versionesLista.length && !original?.versos?.length) {
      return res.status(502).json({ error: 'No fue posible obtener el texto bíblico en este momento.' });
    }

    const referenciaNormalizada = ref.versoInicio
      ? `${ref.libro} ${ref.capitulo}:${ref.versoInicio}${ref.versoFin && ref.versoFin !== ref.versoInicio ? `-${ref.versoFin}` : ''}`
      : `${ref.libro} ${ref.capitulo}`;

    return res.status(200).json({
      success: true,
      data: { referencia: referenciaNormalizada, versiones, versionesVersos, versionesLista, original }
    });
  } catch (error) {
    console.error('Error obteniendo pasaje:', error?.message);
    return res.status(502).json({ error: 'No fue posible obtener el texto bíblico en este momento.' });
  }
}
