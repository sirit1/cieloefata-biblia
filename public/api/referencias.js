import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { generarObjeto, hayMotorIA } from '../lib/ai.js';
import { parsearReferencia, obtenerOriginal, originalComoTextoPlano } from '../lib/biblia.js';
import { consumirCuota, respuestaCuotaAgotada } from '../lib/quota.js';

const ESQUEMA_REFERENCIAS = z.object({
  referencias: z.array(z.object({
    ref: z.string().describe('Cita en formato estándar español, ej. "Juan 3:16".'),
    nota: z.string().describe('Frase muy breve (máximo 15 palabras) que explique por qué se conecta con la consulta.'),
  })).describe('Entre 6 y 10 referencias cruzadas, de la conexión más directa a la más temática.'),
});

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
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Método no permitido.' });
  }

  // Referencias cruzadas: auth/cuota opcionales para no bloquear el estudio público.
  const user = await authenticate(req);
  if (user) {
    const cuota = await consumirCuota(req, user, 'referencias');
    if (!cuota.allowed) {
      return cuota.reason
        ? respuestaCuotaAgotada(res, cuota)
        : res.status(cuota.status || 503).json({ error: cuota.error });
    }
  }

  const q = { ...(req.query || {}), ...((req.body && typeof req.body === 'object') ? req.body : {}) };
  const consulta = String(q.consulta || q.passage || q.referencia || q.ref || '').trim();
  if (!consulta || consulta.length > 300) {
    return res.status(400).json({ error: 'Consulta inválida.' });
  }

  const { contextoConsulta, paralelosReales, enriquecerReferenciasConTexto } = await import('../lib/consulta-contexto.js');
  const ctx = await contextoConsulta(consulta).catch(() => null);

  async function fallbackTextual() {
    const texto = ctx?.texto || consulta;
    const paralelos = await paralelosReales(texto, { excludeRef: ctx?.etiqueta || consulta });
    const referencias = await enriquecerReferenciasConTexto(paralelos);
    return res.status(200).json({ success: true, data: { referencias } });
  }

  if (!hayMotorIA()) {
    return fallbackTextual();
  }

  // Contexto real: si la consulta es una referencia puntual, se le da a la IA
  // el texto original real (griego/hebreo con Strong's) para que las citas
  // del NT al AT (o viceversa) que proponga se apoyen en el término original
  // real en vez de en una asociación de memoria sin verificar.
  let contextoOriginal = '';
  try {
    const ref = parsearReferencia(consulta);
    if (ref && ref.versoInicio) {
      const original = await obtenerOriginal(ref);
      if (original) contextoOriginal = `\n\nCONTEXTO REAL VERIFICADO (${original.etiqueta}): ${originalComoTextoPlano(original)}`;
    }
  } catch (_e) { /* si falla, sigue sin este contexto extra */ }

  try {
    const data = await generarObjeto(`Eres RevelatiO IA, motor de estudio bíblico en español. Para el pasaje o tema dado, entrega sus REFERENCIAS CRUZADAS: otros pasajes bíblicos relacionados por tema, promesa, cumplimiento profético, cita del NT al AT, paralelo o contraste doctrinal.

Genera la lista de referencias cruzadas siguiendo el esquema proporcionado.

Reglas:
- Entre 6 y 10 referencias, las más iluminadoras y verificables.
- "ref": la cita en formato estándar español (ej. "Juan 3:16", "1 Pedro 2:2", "Romanos 12:2"). Usa nombres de libros en español.
- "nota": una frase muy breve (máximo 15 palabras) que explique POR QUÉ se conecta con la consulta.
- Ordena de la conexión más directa a la más temática.
- Prioriza SIEMPRE referencias ampliamente reconocidas y verificables en cualquier Biblia de estudio (ej. citas explícitas del NT al AT, pasajes paralelos de los evangelios sinópticos, promesas y su cumplimiento). No inventes citas ni conexiones forzadas: si dudas de una conexión, descártala.
- PROHIBIDO LaTeX o notación matemática.

Consulta: ${consulta}${contextoOriginal}`, { schema: ESQUEMA_REFERENCIAS, maxOutputTokens: 3000 });
    const referencias = Array.isArray(data.referencias)
      ? data.referencias
          .filter((r) => r && typeof r.ref === 'string' && r.ref.trim())
          .slice(0, 12)
          .map((r) => ({ ref: String(r.ref).trim(), nota: String(r.nota || '').trim() }))
      : [];
    const hidratadas = await enriquecerReferenciasConTexto(referencias);
    return res.status(200).json({ success: true, data: { referencias: hidratadas } });
  } catch (error) {
    console.error('Error en referencias cruzadas:', error?.message);
    try {
      const { contextoConsulta, paralelosReales, enriquecerReferenciasConTexto } = await import('../lib/consulta-contexto.js');
      const ctx = await contextoConsulta(consulta);
      const paralelos = await paralelosReales(ctx.texto || consulta, { excludeRef: ctx.etiqueta || consulta });
      if (paralelos.length) {
        return res.status(200).json({ success: true, data: { referencias: paralelos } });
      }
    } catch { /* sigue 502 */ }
    return res.status(502).json({ error: 'El proveedor de IA no pudo generar las referencias cruzadas. Intenta de nuevo más tarde.' });
  }
}
