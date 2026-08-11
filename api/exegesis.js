import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { generarObjeto, hayMotorIA } from '../lib/ai.js';
import { parsearReferencia, obtenerOriginal, originalComoTextoPlano, strongsUnicos, obtenerDefinicionStrong } from '../lib/biblia.js';
import { consumirCuota, respuestaCuotaAgotada } from '../lib/quota.js';

// Esquema exacto del análisis exegético. Con esto el proveedor genera JSON
// válido garantizado por esquema (salida estructurada), en vez de que el
// modelo "redacte" JSON en texto libre y lo parseemos a mano — eso era lo que
// producía los cortes a mitad de cadena en respuestas largas.
const ESQUEMA_EXEGESIS = z.object({
  referencia: z.string().describe('Cita canónica normalizada o pasaje base representativo.'),
  comentarioMacArthur: z.string().describe('Resumen exegético breve de 2 o 3 párrafos; no atribuyas citas textuales a autores.'),
  aplicacion: z.string().describe('Una aplicación concreta, prudente y breve.'),
  contexto: z.string().describe('Contexto histórico-literario breve.'),
  exegesis: z.string().describe('Observación e interpretación breve del texto.'),
  idiomaOriginal: z.object({
    termino: z.string(),
    strong: z.string(),
    analisis: z.string(),
  }).describe('Usa solo los datos de Strong suministrados; deja vacío si no hay datos.'),
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método no permitido.' });
  }

  const user = await authenticate(req);
  if (!user) return res.status(401).json({ error: 'Sesión inválida o vencida.' });
  const cuota = await consumirCuota(req, user, 'exegesis');
  if (!cuota.allowed) return cuota.code === 'AI_QUOTA_EXCEEDED' || cuota.reason ? respuestaCuotaAgotada(res, cuota) : res.status(cuota.status || 503).json({ error: cuota.error });

  const consulta = typeof req.body?.consulta === 'string' ? req.body.consulta.trim() : '';
  if (!consulta || consulta.length > 300) {
    return res.status(400).json({ error: 'Escribe una consulta de entre 1 y 300 caracteres.' });
  }
  if (!hayMotorIA()) {
    return res.status(503).json({ error: 'El motor de IA todavía no está configurado.' });
  }

  // Si la consulta es una referencia reconocible, trae el texto original real
  // (griego/hebreo con Strong's) y sus definiciones léxicas reales (BDBT/Thayer)
  // ANTES de llamar a la IA, para que el análisis se apoye en datos verificables
  // en vez de que el modelo "recuerde" el griego/hebreo de memoria (y a veces
  // invente el número de Strong).
  let contextoOriginal = '';
  try {
    const ref = parsearReferencia(consulta);
    if (ref && ref.versoInicio) {
      const original = await obtenerOriginal(ref);
      if (original) {
        const plano = originalComoTextoPlano(original);
        const codigos = strongsUnicos(original).slice(0, 12);
        const definiciones = (await Promise.all(codigos.slice(0, 6).map((c) => obtenerDefinicionStrong(c).catch(() => null)))).filter(Boolean);
        const lineas = definiciones.map((d) => `${d.codigo}: ${d.lexema} (${d.transliteracion}) — ${d.definicionCorta || d.definicion.split('\n')[0]}`);
        contextoOriginal = `\n\nCONTEXTO REAL VERIFICADO (no inventes sobre esto, básate en él; viene de fuentes reales: ${original.etiqueta}, y el diccionario Brown-Driver-Briggs/Thayer):\nTexto original palabra por palabra con Strong's: ${plano}\nDefiniciones léxicas reales:\n${lineas.join('\n')}` + (original.septuaginta ? `\n\nSeptuaginta (LXX, griego, solo informativo — ${original.septuaginta.nota}): ${original.septuaginta.texto}` : '');
      }
    }
  } catch (_e) { /* si falla, el análisis sigue sin este contexto extra */ }

  try {
    const data = await generarObjeto(`Eres el motor exegético de RevelatiO by Efata, plataforma de estudio bíblico en español.

La consulta puede ser (a) una referencia bíblica concreta (ej. "Juan 3:16", "Salmos 23:1") o (b) un tema o pregunta ("el perdón", "¿qué es la gracia?").

Genera un análisis base breve siguiendo el esquema proporcionado. Las perspectivas y expansiones se solicitan por separado.

Reglas:
- "referencia": la cita canónica normalizada (ej. "Juan 3:16"). Si es un tema, coloca el pasaje base más representativo.
- "idiomaOriginal": término griego o hebreo clave, número Strong y un breve análisis morfológico/etimológico. Si se te da un CONTEXTO REAL VERIFICADO más abajo, tu término y número de Strong DEBEN salir de ahí, no de tu memoria.
- "comentarioMacArthur": comentario exegético pastoral, riguroso y expositivo.
- "contexto": contexto histórico, literario y canónico del pasaje, distinguiendo hechos del texto de interpretación.
- "exegesis": desarrolla una explicación versículo por versículo, señalando observación, interpretación y aplicación.
- "aplicacion": aplicación ministerial que refleje el camino del evangelio: confesión y arrepentimiento (1 Juan 1:9), conversión y estudio de la Palabra (1 Pedro 2:2), y permanecer firmes y constantes en la fe (1 Corintios 15:58).
- No inventes citas: si no puedes confirmar un texto exacto, deja ese campo vacío y explícalo en el comentario.
- Escribe en español claro. PROHIBIDO usar LaTeX o notación matemática (nada de \\rightarrow, $...$, \\text, símbolos de fórmula). Usa palabras y flechas simples como "->".

Consulta: ${consulta}${contextoOriginal}`, { schema: ESQUEMA_EXEGESIS, reintentos: 1, maxOutputTokens: 1200 });
    return res.status(200).json({ success: true, data: {
      ...data,
      versiones: { rvr1960: '', nvi: '', ntv: '', lbla: '', pdt: '', btx3: '', rv2004: '', peshitta: '' },
      objetivo: '', estructura: '', analisisGramatical: '', hermeneutica: '',
      hitos: [], comparaciones: [], comentarios: [],
      predica: { titulo: '', texto: '', puntos: [], aplicaciones: [], cierre: '' },
    } });
  } catch (error) {
    console.error('Error en el motor exegético:', error?.message);
    return res.status(502).json({ error: 'El proveedor de IA no pudo completar el análisis. Intenta de nuevo más tarde.' });
  }
}
