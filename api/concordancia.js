import { createClient } from '@supabase/supabase-js';
import { fetchConTimeout, resaltarCoincidencia, VERSIONES, LIBROS } from '../lib/biblia.js';

// Concordancia bíblica REAL: busca una palabra o frase en todo el texto de
// una traducción completa vía Bolls Bible (bolls.life/find/), la misma
// fuente ya usada para el lector. No es una lista generada por IA: son
// coincidencias reales dentro del texto de la versión elegida.

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

const MAX_RESULTADOS = 40;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Método no permitido.' });
  }

  // Lectura pública: la concordancia usa Bolls (texto real). Auth opcional.
  await authenticate(req);

  const termino = typeof req.query?.q === 'string' ? req.query.q.trim() : '';
  if (termino.length < 3) {
    return res.status(400).json({ error: 'Escribe al menos 3 letras para buscar en la Biblia.' });
  }
  if (termino.length > 60) {
    return res.status(400).json({ error: 'La búsqueda es demasiado larga.' });
  }

  const versionKey = typeof req.query?.version === 'string' ? req.query.version : 'rv1960';
  const version = VERSIONES.find((v) => v.key === versionKey) || VERSIONES[0];

  try {
    const url = `https://bolls.life/find/${version.bolls}/?search=${encodeURIComponent(termino)}&match_case=false&match_whole=false`;
    const data = await fetchConTimeout(url, {}, 9000);
    if (!Array.isArray(data)) {
      return res.status(502).json({ error: 'No fue posible buscar en la Biblia en este momento. Intenta de nuevo.' });
    }

    const resultados = data.slice(0, MAX_RESULTADOS).map((r) => {
      const libro = LIBROS[r.book - 1] || null;
      return {
        libro,
        capitulo: r.chapter,
        verso: r.verse,
        ref: libro ? `${libro} ${r.chapter}:${r.verse}` : null,
        html: resaltarCoincidencia(r.text, termino)
      };
    }).filter((r) => r.libro);

    return res.status(200).json({
      success: true,
      data: { termino, version: version.key, etiqueta: version.etiqueta, total: data.length, resultados }
    });
  } catch (error) {
    console.error('Error en concordancia:', error?.message);
    return res.status(502).json({ error: 'No fue posible buscar en la Biblia en este momento. Intenta de nuevo.' });
  }
}
