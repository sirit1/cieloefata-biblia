import { createClient } from '@supabase/supabase-js';
import { obtenerDefinicionStrong } from '../lib/biblia.js';
import { generarJSON, hayMotorIA } from '../lib/ai.js';

async function traducirDefinicion(definicion) {
  if (!hayMotorIA() || !definicion?.definicion) return definicion;
  try {
    const traduccion = await generarJSON(`Traduce al español bíblico claro la siguiente entrada léxica de Strong. Conserva exactamente el código, el lexema, la transliteración y la pronunciación. No añadas información. Devuelve solo JSON válido con la clave definicion_es.\n\nCódigo: ${definicion.codigo}\nLexema: ${definicion.lexema}\nDefinición: ${definicion.definicion}`, { reintentos: 1 });
    return { ...definicion, definicionEs: String(traduccion?.definicion_es || '').trim() || definicion.definicion };
  } catch (_) {
    return { ...definicion, definicionEs: definicion.definicion };
  }
}

// Diccionario léxico REAL (Brown-Driver-Briggs para hebreo, Thayer para
// griego, vía Bolls Bible) para consultar el significado exacto de una
// palabra original al tocarla en el lector. No es texto generado por IA.

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

  const codigo = typeof req.body?.codigo === 'string' ? req.body.codigo.trim() : '';
  if (!/^[GH]\d{1,4}$/i.test(codigo)) {
    return res.status(400).json({ error: 'Código de Strong inválido.' });
  }

  try {
    const definicion = await obtenerDefinicionStrong(codigo);
    if (!definicion) {
      return res.status(404).json({ error: 'No se encontró una definición para ese término.' });
    }
    const resultado = await traducirDefinicion(definicion);
    return res.status(200).json({ success: true, data: resultado });
  } catch (error) {
    console.error('Error consultando el diccionario léxico:', error?.message);
    return res.status(502).json({ error: 'No fue posible consultar el diccionario en este momento.' });
  }
}
