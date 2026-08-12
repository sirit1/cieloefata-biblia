import { createClient } from '@supabase/supabase-js';
import { generarJSON, hayMotorIA } from '../lib/ai.js';
import { consumirCuota, respuestaCuotaAgotada } from '../lib/quota.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido.' });
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!token || !url || !anonKey) return res.status(401).json({ error: 'Sesión inválida o vencida.' });
  const supabase = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authData.user) return res.status(401).json({ error: 'Sesión inválida o vencida.' });

  // El cierre de plan es una tarea generativa ligera: se contabiliza con la cuota de "lente".
  const cuota = await consumirCuota(req, authData.user, 'lente');
  if (!cuota.allowed) return cuota.reason ? respuestaCuotaAgotada(res, cuota) : res.status(cuota.status || 503).json({ error: cuota.error });

  const titulo = typeof req.body?.titulo === 'string' ? req.body.titulo.trim().slice(0, 160) : '';
  const nombre = typeof req.body?.nombre === 'string' ? req.body.nombre.trim().slice(0, 80) : '';
  const pasajes = Array.isArray(req.body?.pasajes)
    ? [...new Set(req.body.pasajes.filter((p) => typeof p === 'string' && p.trim()).map((p) => p.trim()))].slice(0, 12)
    : [];
  if (!titulo || !pasajes.length) return res.status(400).json({ error: 'Faltan datos del plan.' });

  const fallback = {
    comentarios: pasajes.slice(0, 6).map((p) => ({
      pasaje: p,
      comentario: 'Vuelve a este pasaje en oración: léelo en su contexto, subraya lo que Dios revela y pregúntate qué obediencia concreta te pide hoy.',
    })),
    conclusion: `${nombre ? nombre + ', ' : ''}has recorrido este plan no para acumular lecturas, sino para renovar tu mente (Romanos 12:2). Confiesa lo que el Espíritu haya señalado, conviértete de nuevo a Cristo y permanece firme: elige hoy un paso concreto de obediencia y compártelo con tu comunidad.`,
  };

  let data = fallback;
  if (hayMotorIA()) {
    try {
      const generado = await generarJSON(
        `Eres RevelatiO IA, guía bíblica pastoral de RevelatiO by Efata. Responde en español, mantén la Escritura (NBLA) como autoridad final y no inventes citas.
La persona${nombre ? ' llamada ' + nombre : ''} acaba de completar el plan de lectura "${titulo}".
Pasajes destacados del plan: ${pasajes.join('; ')}.
Devuelve únicamente JSON válido con:
- "comentarios": un arreglo (máximo 6) de objetos { "pasaje", "comentario" }, con un comentario bíblico breve (2 a 3 frases) sobre lo más destacado de cada lectura, fiel al contexto histórico-gramatical.
- "conclusion": una conclusión pastoral aplicable a la vida de la persona (3 a 4 frases) que llame a la confesión y el arrepentimiento, a la conversión y estudio de la Palabra, y a permanecer firme, sólido y constante en la fe.
No presentes la vida espiritual como una métrica, no sustituyas al pastor, mentor ni a la comunidad local, y no uses Markdown.`,
        { maxOutputTokens: 2600 },
      );
      if (Array.isArray(generado?.comentarios) && generado.comentarios.length && typeof generado.conclusion === 'string') {
        data = {
          comentarios: generado.comentarios
            .filter((c) => c && typeof c.pasaje === 'string' && typeof c.comentario === 'string')
            .slice(0, 6),
          conclusion: generado.conclusion,
        };
        if (!data.comentarios.length) data = fallback;
      }
    } catch (error) {
      console.error('[v0] IA plan-cierre fallback:', error?.message);
    }
  }

  return res.status(200).json({ success: true, usage: cuota, data });
}
