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

  // El devocional de apertura es una tarea generativa ligera: se contabiliza con la cuota de "lente".
  const cuota = await consumirCuota(req, authData.user, 'lente');
  if (!cuota.allowed) return cuota.reason ? respuestaCuotaAgotada(res, cuota) : res.status(cuota.status || 503).json({ error: cuota.error });

  const titulo = typeof req.body?.titulo === 'string' ? req.body.titulo.trim().slice(0, 160) : '';
  const descripcion = typeof req.body?.descripcion === 'string' ? req.body.descripcion.trim().slice(0, 320) : '';
  const nombre = typeof req.body?.nombre === 'string' ? req.body.nombre.trim().slice(0, 80) : '';
  const pasajes = Array.isArray(req.body?.pasajes)
    ? [...new Set(req.body.pasajes.filter((p) => typeof p === 'string' && p.trim()).map((p) => p.trim()))].slice(0, 4)
    : [];
  if (!titulo) return res.status(400).json({ error: 'Faltan datos del plan.' });

  const lecturaInicial = pasajes.length ? pasajes.join(' · ') : 'Salmos 1';
  const fallback = {
    oracion: `${nombre ? nombre + ', ' : ''}antes de leer, detente en silencio. Señor, abre mis ojos para ver las maravillas de tu Palabra (Salmos 119:18); quita de mí toda prisa y todo prejuicio, y dame un corazón dispuesto a obedecer lo que me muestres. En el nombre de Jesús, amén.`,
    lecturaInicial,
    meditacion: `Este plan, "${titulo}", no es una lista de tareas: es una invitación a que Dios renueve tu mente (Romanos 12:2). Lee despacio, deja que el texto te examine antes de examinarlo tú, y busca en cada página el rostro de Cristo.`,
    aplicacion: '¿Qué verdad de la lectura de hoy pondrás en práctica en tu familia, trabajo, iglesia o vida interior?',
  };

  let data = fallback;
  if (hayMotorIA()) {
    try {
      const generado = await generarJSON(
        `Eres RevelatiO IA, guía bíblica pastoral de RevelatiO by Efata. Responde en español, mantén la Escritura (NBLA) como autoridad final y no inventes citas.
Construye un DEVOCIONAL DE APERTURA para${nombre ? ' ' + nombre + ',' : ''} que va a comenzar el plan de lectura "${titulo}"${descripcion ? ' (' + descripcion + ')' : ''}.
La lectura inicial del plan es: ${lecturaInicial}.
El devocional debe invitar primero a orar y a leer, antes de las lecturas bíblicas del plan.
Devuelve únicamente JSON válido con:
- "oracion": una oración breve (2 a 3 frases) que invite a detenerse y disponer el corazón antes de leer, en segunda persona y cálida.
- "lecturaInicial": exactamente esta cadena: "${lecturaInicial}".
- "meditacion": una meditación introductoria (3 a 4 frases) que enmarque el propósito del plan y llame a leer con humildad y obediencia, fiel al contexto histórico-gramatical.
- "aplicacion": una pregunta de aplicación concreta para la vida (1 frase).
No presentes la vida espiritual como una métrica, no sustituyas al pastor, mentor ni a la comunidad local, y no uses Markdown.`,
        { maxOutputTokens: 1600 },
      );
      if (generado && typeof generado.oracion === 'string' && typeof generado.meditacion === 'string') {
        data = {
          oracion: generado.oracion,
          lecturaInicial: typeof generado.lecturaInicial === 'string' && generado.lecturaInicial.trim() ? generado.lecturaInicial.trim() : lecturaInicial,
          meditacion: generado.meditacion,
          aplicacion: typeof generado.aplicacion === 'string' && generado.aplicacion.trim() ? generado.aplicacion.trim() : fallback.aplicacion,
        };
      }
    } catch (error) {
      console.error('[v0] IA devocional fallback:', error?.message);
    }
  }

  return res.status(200).json({ success: true, usage: cuota, data });
}
