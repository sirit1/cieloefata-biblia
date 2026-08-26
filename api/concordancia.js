import { createClient } from '@supabase/supabase-js';
import { obtenerConcordancia } from '../lib/concordancia.js';

// Concordancia bíblica REAL: el mismo motor para RVR1960 / NVI / DHH / TLA.
// PRODUCT LAW (Alejandro): version chooses which text is scanned, never
// whether the engine runs. Never Gemini.

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
  res.setHeader?.('Access-Control-Allow-Origin', '*');
  res.setHeader?.('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader?.('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST, OPTIONS');
    return res.status(405).json({ error: 'Método no permitido.' });
  }

  await authenticate(req);

  const q = {
    ...(req.query || {}),
    ...((req.body && typeof req.body === 'object') ? req.body : {}),
  };
  const termino = String(q.q || q.keyword || q.searchTerm || q.termino || q.term || '').trim();
  if (termino.length < 3) {
    return res.status(400).json({ error: 'Escribe al menos 3 letras para buscar en la Biblia.' });
  }
  if (termino.length > 60) {
    return res.status(400).json({ error: 'La búsqueda es demasiado larga.' });
  }

  try {
    const payload = await obtenerConcordancia({
      termino,
      version: q.version || q.traduccion || 'rv1960',
    });
    return res.status(200).json(payload);
  } catch (error) {
    console.error('Error en concordancia:', error?.message);
    return res.status(502).json({ error: 'No fue posible buscar en la Biblia en este momento. Intenta de nuevo.' });
  }
}
