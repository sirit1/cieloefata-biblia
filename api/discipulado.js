import { createClient } from '@supabase/supabase-js';
import { generarJSON, hayMotorIA } from '../lib/ai.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido.' });
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!token || !url || !anonKey) return res.status(401).json({ error: 'Sesión inválida o vencida.' });
  const supabase = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authData.user) return res.status(401).json({ error: 'Sesión inválida o vencida.' });
  const objetivo = typeof req.body?.objetivo === 'string' ? req.body.objetivo.trim() : '';
  const ritmo = typeof req.body?.ritmo === 'string' ? req.body.ritmo.trim() : '15 minutos al día';
  if (!objetivo || objetivo.length > 300) return res.status(400).json({ error: 'Escribe un objetivo de entre 1 y 300 caracteres.' });
  if (!hayMotorIA()) return res.status(503).json({ error: 'El motor de IA todavía no está configurado.' });
  try {
    const data = await generarJSON(`Eres RevelatiO IA, guía de discipulado bíblico en español. Diseña una propuesta PERSONALIZADA, no una plantilla predeterminada, para una persona cuyo objetivo es: "${objetivo}" y cuyo ritmo es "${ritmo}".
Responde ÚNICAMENTE JSON válido con esta estructura exacta: {"titulo":"","introduccion":"","invitacion":"","etapas":[{"titulo":"","descripcion":"","hito":""}]}.
Crea entre 3 y 5 etapas progresivas, concretas y distintas según el objetivo. No uses títulos, descripciones ni etapas genéricas o preconcebidas; no repitas siempre el esquema de confesión, conversión y firmeza. El orden, los temas y las prácticas deben nacer directamente del objetivo de la persona, aunque mantengan fidelidad bíblica. Cada hito debe ser una referencia bíblica verificable y terminar en "· NBLA". No afirmes que la IA sustituye a pastores o comunidad. La introducción explica el camino y la invitación anima a comenzar con un paso concreto. Escribe en español claro, sin Markdown ni LaTeX.`);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('[v0] Error en discipulado IA:', error?.message);
    const errorText = `${error?.message || ''} ${error?.name || ''}`.toLowerCase();
    const rateLimited = error?.code === 'RATE_LIMIT' || error?.statusCode === 429 || errorText.includes('rate limit') || errorText.includes('too many requests');
    const noConfigurado = errorText.includes('api key') || errorText.includes('configured');
    return res.status(rateLimited ? 429 : noConfigurado ? 503 : 502).json({ error: rateLimited ? 'RevelatiO IA está recibiendo muchas consultas. Espera unos segundos.' : noConfigurado ? 'El motor de IA no está configurado en este entorno.' : 'No fue posible crear tu camino. Inténtalo de nuevo.' });
  }
}
