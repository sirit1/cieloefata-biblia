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

// Devuelve referencias cruzadas para un pasaje o tema: pasajes bíblicos
// relacionados por tema, cumplimiento, cita o paralelo, cada uno con una
// nota breve del vínculo. La estructura es una lista navegable.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método no permitido.' });
  }

  const user = await authenticate(req);
  if (!user) return res.status(401).json({ error: 'Sesión inválida o vencida.' });

  const consulta = typeof req.body?.consulta === 'string' ? req.body.consulta.trim() : '';
  if (!consulta || consulta.length > 300) {
    return res.status(400).json({ error: 'Consulta inválida.' });
  }
  if (!hayMotorIA()) {
    return res.status(503).json({ error: 'El motor de IA todavía no está configurado.' });
  }

  try {
    const data = await generarJSON(`Eres RevelatiO IA, motor de estudio bíblico en español. Para el pasaje o tema dado, entrega sus REFERENCIAS CRUZADAS: otros pasajes bíblicos relacionados por tema, promesa, cumplimiento profético, cita del NT al AT, paralelo o contraste doctrinal.

Responde ÚNICAMENTE con JSON válido y esta estructura exacta:
{"referencias":[{"ref":"","nota":""}]}

Reglas:
- Entre 6 y 10 referencias, las más iluminadoras y verificables.
- "ref": la cita en formato estándar español (ej. "Juan 3:16", "1 Pedro 2:2", "Romanos 12:2"). Usa nombres de libros en español.
- "nota": una frase muy breve (máximo 15 palabras) que explique POR QUÉ se conecta con la consulta.
- Ordena de la conexión más directa a la más temática.
- No inventes citas: usa solo referencias reales y correctas.
- PROHIBIDO LaTeX o notación matemática.

Consulta: ${consulta}`);
    const referencias = Array.isArray(data.referencias)
      ? data.referencias
          .filter((r) => r && typeof r.ref === 'string' && r.ref.trim())
          .slice(0, 12)
          .map((r) => ({ ref: String(r.ref).trim(), nota: String(r.nota || '').trim() }))
      : [];
    return res.status(200).json({ success: true, data: { referencias } });
  } catch (error) {
    console.error('Error en referencias cruzadas:', error?.message);
    if (error?.code === 'RATE_LIMIT') {
      return res.status(429).json({ error: 'RevelatiO IA está recibiendo muchas consultas. Espera unos segundos e inténtalo de nuevo.' });
    }
    return res.status(502).json({ error: 'No fue posible obtener las referencias cruzadas.' });
  }
}
