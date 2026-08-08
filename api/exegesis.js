import { createClient } from '@supabase/supabase-js';
import { generarJSON, hayMotorIA } from '../lib/ai.js';

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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método no permitido.' });
  }

  const user = await authenticate(req);
  if (!user) return res.status(401).json({ error: 'Sesión inválida o vencida.' });

  const consulta = typeof req.body?.consulta === 'string' ? req.body.consulta.trim() : '';
  if (!consulta || consulta.length > 300) {
    return res.status(400).json({ error: 'Escribe una consulta de entre 1 y 300 caracteres.' });
  }
  if (!hayMotorIA()) {
    return res.status(503).json({ error: 'El motor de IA todavía no está configurado.' });
  }

  try {
    const data = await generarJSON(`Eres el motor exegético de RevelatiO by Efata, plataforma de estudio bíblico en español.

La consulta puede ser (a) una referencia bíblica concreta (ej. "Juan 3:16", "Salmos 23:1") o (b) un tema o pregunta ("el perdón", "¿qué es la gracia?").

Responde ÚNICAMENTE con JSON válido y esta estructura exacta:
{"referencia":"","versiones":{"rvr1960":"","nbla":"","nvi":""},"idiomaOriginal":{"termino":"","strong":"","analisis":""},"comentarioMacArthur":"","aplicacion":""}

Reglas:
- "referencia": la cita canónica normalizada (ej. "Juan 3:16"). Si es un tema, coloca el pasaje base más representativo.
- "versiones": el texto del versículo en cada versión. Si es un tema sin un único versículo, deja los tres campos como cadena vacía "".
- "idiomaOriginal": término griego o hebreo clave, número Strong y un breve análisis morfológico/etimológico.
- "comentarioMacArthur": comentario exegético pastoral, riguroso y expositivo.
- "aplicacion": aplicación ministerial que refleje el camino del evangelio: confesión y arrepentimiento (1 Juan 1:9), conversión y estudio de la Palabra (1 Pedro 2:2), y permanecer firmes y constantes en la fe (1 Corintios 15:58).
- No inventes citas: si no puedes confirmar un texto exacto, deja ese campo vacío y explícalo en el comentario.
- Escribe en español claro. PROHIBIDO usar LaTeX o notación matemática (nada de \\rightarrow, $...$, \\text, símbolos de fórmula). Usa palabras y flechas simples como "->".

Consulta: ${consulta}`);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error en el motor exegético:', error?.message);
    return res.status(502).json({ error: 'No fue posible completar el análisis. Intenta nuevamente.' });
  }
}
