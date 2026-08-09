import { createClient } from '@supabase/supabase-js';
import { generarJSON, hayMotorIA } from '../lib/ai.js';
import { consumirCuota, respuestaCuotaAgotada } from '../lib/quota.js';

const CAMINO_BASE = [
  { id: 'luz', titulo: 'Caminar en la luz', pasaje: '1 Juan 1:9 · NBLA', objetivo: 'Reconocer el pecado y responder con confesión y arrepentimiento.', contenido: 'La vida del discípulo comienza ante Dios con honestidad. La confesión no es una condena: es volver a la verdad y recibir limpieza.', practica: 'Escribe una confesión concreta, ora con humildad y busca reconciliación cuando corresponda.', preguntas: [{ pregunta: '¿Qué respuesta pide 1 Juan 1:9?', opciones: ['Ocultar el pecado', 'Confesarlo a Dios', 'Justificarlo'], correcta: 1, explicacion: 'El texto llama a confesar el pecado y confiar en el carácter fiel y justo de Dios.' }] },
  { id: 'palabra', titulo: 'Alimentarse de la Palabra', pasaje: '1 Pedro 2:2 · NBLA', objetivo: 'Pasar de conocer versículos a desear y obedecer la Palabra.', contenido: 'El crecimiento cristiano necesita alimento constante. Leer, observar, interpretar y practicar forman un hábito de discípulo.', practica: 'Lee el pasaje lentamente, anota una verdad, una corrección y una obediencia para hoy.', preguntas: [{ pregunta: '¿Qué imagen usa 1 Pedro 2:2 para describir el deseo espiritual?', opciones: ['Agua de lluvia', 'Leche espiritual', 'Pan del cielo'], correcta: 1, explicacion: 'Pedro compara el deseo por la Palabra con el deseo de un recién nacido por la leche.' }] },
  { id: 'obediencia', titulo: 'Obedecer en comunidad', pasaje: 'Santiago 1:22 · NBLA', objetivo: 'Convertir la escucha bíblica en decisiones visibles y compartidas.', contenido: 'Un discípulo no se limita a escuchar. Examina su vida, practica la verdad y permite que otros le acompañen con gracia y rendición de cuentas.', practica: 'Comparte tu próximo paso con una persona madura y vuelve a revisar tu obediencia.', preguntas: [{ pregunta: '¿Qué peligro señala Santiago 1:22?', opciones: ['Escuchar sin hacer', 'Servir demasiado', 'Leer en comunidad'], correcta: 0, explicacion: 'El texto advierte contra engañarnos al oír la Palabra sin ponerla en práctica.' }] },
  { id: 'firmeza', titulo: 'Permanecer firmes', pasaje: '1 Corintios 15:58 · NBLA', objetivo: 'Servir con constancia y esperanza sin abandonar el camino.', contenido: 'La madurez se reconoce en una vida sólida, constante y útil. La esperanza en Cristo sostiene el trabajo fiel aun cuando no vemos resultados inmediatos.', practica: 'Define un servicio concreto para esta semana y una forma de permanecer constante.', preguntas: [{ pregunta: '¿Cómo llama Pablo a permanecer en la obra del Señor?', opciones: ['Inconstantes', 'Firmes y constantes', 'Aislados'], correcta: 1, explicacion: 'Pablo anima a estar firmes, constantes y abundando en la obra del Señor.' }] }
];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido.' });
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!token || !url || !anonKey) return res.status(401).json({ error: 'Sesión inválida o vencida.' });
  const supabase = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authData.user) return res.status(401).json({ error: 'Sesión inválida o vencida.' });
  const cuota = await consumirCuota(req, authData.user, 'discipulado');
  if (!cuota.allowed) return cuota.reason ? respuestaCuotaAgotada(res, cuota) : res.status(cuota.status || 503).json({ error: cuota.error });
  const objetivo = typeof req.body?.objetivo === 'string' ? req.body.objetivo.trim() : '';
  const ritmo = typeof req.body?.ritmo === 'string' ? req.body.ritmo.trim() : '15 minutos al día';
  if (!objetivo || objetivo.length > 300) return res.status(400).json({ error: 'Escribe un objetivo de entre 1 y 300 caracteres.' });
  let data = { titulo: 'Camino de discipulado bíblico', introduccion: `Un recorrido para crecer en ${objetivo}, a un ritmo de ${ritmo}.`, etapas: CAMINO_BASE };
  if (hayMotorIA()) {
    try {
      const generado = await generarJSON(`Eres RevelatiO IA, guía bíblica en español. Personaliza este camino de discipulado para: "${objetivo}" y ritmo: "${ritmo}". Devuelve JSON válido con titulo, introduccion y etapas. Conserva exactamente 4 etapas, cada una con id, titulo, pasaje, objetivo, contenido, practica y preguntas. Cada pregunta debe tener pregunta, opciones (3 textos), correcta (índice numérico) y explicacion. Usa referencias bíblicas verificables y NBLA. No uses Markdown.`);
      if (generado?.etapas?.length === 4) data = generado;
    } catch (error) { console.error('[v0] IA discipulado fallback:', error?.message); }
  }
  return res.status(200).json({ success: true, data });
}
