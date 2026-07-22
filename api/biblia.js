import { createClient } from '@supabase/supabase-js';

const getConfig = () => ({
  url: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  anonKey: process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Método no permitido.' });
  }

  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  const { url, anonKey } = getConfig();
  if (!token || !url || !anonKey) return res.status(401).json({ error: 'Sesión inválida o vencida.' });

  const supabase = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authData.user) return res.status(401).json({ error: 'Sesión inválida o vencida.' });

  const libro = typeof req.query.libro === 'string' ? req.query.libro.trim() : '';
  const capitulo = Number.parseInt(req.query.capitulo, 10);
  const versiculo = Number.parseInt(req.query.versiculo, 10);
  if (!/^[a-z0-9-]{2,40}$/i.test(libro) || !Number.isInteger(capitulo) || !Number.isInteger(versiculo) || capitulo < 1 || versiculo < 1) {
    return res.status(400).json({ error: 'La referencia bíblica no es válida.' });
  }

  const { data, error } = await supabase
    .from('textos_biblicos')
    .select('*')
    .eq('libro_key', libro)
    .eq('capitulo', capitulo)
    .eq('versiculo', versiculo);

  if (error) {
    if (error.code === '42P01') return res.status(503).json({ error: 'La biblioteca bíblica aún no está disponible.' });
    console.error('Error en consulta bíblica:', error.code);
    return res.status(500).json({ error: 'No fue posible consultar la biblioteca.' });
  }

  return res.status(200).json({ success: true, data });
}
