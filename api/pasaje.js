import { createClient } from '@supabase/supabase-js';
import { parsearReferencia, obtenerCapitulo, extraerTexto, extraerVersos, obtenerOriginal, VERSIONES } from '../lib/biblia.js';
import { buscarPeshitta } from '../lib/peshitta.js';

// Texto bíblico REAL (no generado por IA): se sirve desde Bolls Bible
// (bolls.life), una API pública gratuita y sin clave, para que la lectura
// sea instantánea y fiel a traducciones reales, en lugar de esperar a que
// un modelo de IA "recuerde" el versículo (lento y con riesgo de inexactitud
// en un texto sagrado). También incluye el idioma original (griego/hebreo
// con números de Strong) y, en el Antiguo Testamento, la Septuaginta griega.

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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método no permitido.' });
  }

  const user = await authenticate(req);
  if (!user) return res.status(401).json({ error: 'Sesión inválida o vencida.' });

  const referencia = typeof req.body?.referencia === 'string' ? req.body.referencia.trim() : '';
  if (!referencia || referencia.length > 120) {
    return res.status(400).json({ error: 'La consulta no es válida.' });
  }

  const ref = parsearReferencia(referencia);
  const peshittaLocal = buscarPeshitta(referencia);
  if (!ref) {
    if (!peshittaLocal.versos.length) return res.status(400).json({ error: 'No encontramos esa referencia o tema en la Peshitta.' });
    return res.status(200).json({ success: true, data: { referencia: referencia, versiones: { peshitta: peshittaLocal.texto }, versionesVersos: { peshitta: peshittaLocal.versos }, original: null } });
  }

  try {
    const [resultados, original] = await Promise.all([
      Promise.all(
        VERSIONES.map(async (v) => {
          const data = await obtenerCapitulo(v.bolls, ref.libroId, ref.capitulo);
          const texto = extraerTexto(data, ref.versoInicio, ref.versoFin);
          const versos = extraerVersos(data, ref.versoInicio, ref.versoFin);
          return { ...v, texto, versos };
        })
      ),
      obtenerOriginal(ref).catch(() => null)
    ]);

    const versiones = {};
    const versionesVersos = {};
    const versionesLista = [];
    for (const r of resultados) {
      if (r.texto) {
        versiones[r.key] = r.texto;
        versionesVersos[r.key] = r.versos;
        versionesLista.push({ key: r.key, etiqueta: r.etiqueta });
      }
    }
    if (peshittaLocal.texto) {
      versiones.peshitta = peshittaLocal.texto;
      versionesVersos.peshitta = peshittaLocal.versos;
      versionesLista.push({ key: 'peshitta', etiqueta: 'Peshitta · búsqueda local' });
    }

    const tieneStrong = original?.versos?.some((verso) => verso.tokens?.some((token) => token.strong));
    if (tieneStrong) {
      versionesLista.push({
        key: 'interlineal',
        etiqueta: `Interlineal · ${original.idioma === 'hebreo' ? 'Hebreo' : 'Griego'} + Strong`
      });
    }

    if (!versionesLista.length) {
      return res.status(502).json({ error: 'No fue posible obtener el texto bíblico en este momento. Intenta de nuevo.' });
    }

    const referenciaNormalizada = ref.versoInicio
      ? `${ref.libro} ${ref.capitulo}:${ref.versoInicio}${ref.versoFin && ref.versoFin !== ref.versoInicio ? `-${ref.versoFin}` : ''}`
      : `${ref.libro} ${ref.capitulo}`;

    return res.status(200).json({
      success: true,
      data: { referencia: referenciaNormalizada, versiones, versionesVersos, versionesLista, original }
    });
  } catch (error) {
    console.error('Error obteniendo pasaje real:', error?.message);
    return res.status(502).json({ error: 'No fue posible obtener el texto bíblico en este momento. Intenta de nuevo.' });
  }
}
