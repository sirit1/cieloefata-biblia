import { createClient } from '@supabase/supabase-js';
import { parsearReferencia, obtenerCapitulo, extraerTexto, obtenerOriginal } from '../lib/biblia.js';

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
    const [resultados, original] = await Promise.all([
      Promise.all(
        VERSIONES.map(async (v) => {
          const data = await obtenerCapitulo(v.bolls, ref.libroId, ref.capitulo);
          const texto = extraerTexto(data, ref.versoInicio, ref.versoFin);
          return { ...v, texto };
        })
      ),
      obtenerOriginal(ref).catch(() => null)
    ]);

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
      data: { referencia: referenciaNormalizada, versiones, versionesLista, original }
    });
  } catch (error) {
    console.error('Error obteniendo pasaje real:', error?.message);
    return res.status(502).json({ error: 'No fue posible obtener el texto bíblico en este momento. Intenta de nuevo.' });
  }
}
