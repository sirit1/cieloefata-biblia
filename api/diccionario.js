import { createClient } from '@supabase/supabase-js';
import { consultarDiccionario } from '../lib/diccionario.js';

function config() {
  return { url: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL, key: process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY };
}

async function authenticate(req) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  const { url, key } = config();
  if (!token || !url || !key) return null;
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await supabase.auth.getUser(token);
  return error ? null : data.user;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido.' });
  if (!await authenticate(req)) return res.status(401).json({ error: 'Sesión inválida o vencida.' });
  const codigo = String(req.body?.strongId || req.body?.codigo || '').trim().toUpperCase();
  if (!/^[GH]\d{1,5}$/.test(codigo)) return res.status(400).json({ error: 'Código Strong inválido.' });
  try {
    const data = await consultarDiccionario(codigo);
    if (!data) return res.status(404).json({ error: 'No se encontró la entrada.' });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('[v0] Error diccionario:', error?.message);
    return res.status(502).json({ error: 'No fue posible consultar el diccionario.' });
  }
}
