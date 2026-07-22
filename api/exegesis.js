import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

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
  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({ error: 'El motor de IA todavía no está configurado.' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Eres el motor exegético de CieloEfata. Analiza con rigor la consulta bíblica y responde únicamente JSON válido con esta estructura exacta: {"versiones":{"rvr1960":"","nbla":"","nvi":""},"idiomaOriginal":{"termino":"","strong":"","analisis":""},"comentarioMacArthur":"","aplicacion":""}. No inventes citas; si no puedes confirmar un texto exacto, indícalo con claridad. Consulta: ${consulta}`,
      config: { responseMimeType: 'application/json' },
    });

    const data = JSON.parse(response.text);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error en el motor exegético:', error?.message);
    return res.status(502).json({ error: 'No fue posible completar el análisis. Intenta nuevamente.' });
  }
}
