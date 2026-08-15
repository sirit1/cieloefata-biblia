import { createClient } from '@supabase/supabase-js';
import { generarJSON, hayMotorIA } from '../lib/ai.js';
import { parsearReferencia, obtenerOriginal, originalComoTextoPlano, strongsUnicos, obtenerDefinicionStrong } from '../lib/biblia.js';

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
        const definiciones = (await Promise.all(codigos.map((c) => obtenerDefinicionStrong(c).catch(() => null)))).filter(Boolean);
        const lineas = definiciones.map((d) => `${d.codigo}: ${d.lexema} (${d.transliteracion}) — ${d.definicionCorta || d.definicion.split('\n')[0]}`);
        contextoOriginal = `\n\nCONTEXTO REAL VERIFICADO (no inventes sobre esto, básate en él; viene de fuentes reales: ${original.etiqueta}, y el diccionario Brown-Driver-Briggs/Thayer):\nTexto original palabra por palabra con Strong's: ${plano}\nDefiniciones léxicas reales:\n${lineas.join('\n')}` + (original.septuaginta ? `\n\nSeptuaginta (LXX, griego, solo informativo — ${original.septuaginta.nota}): ${original.septuaginta.texto}` : '');
      }
    }
  } catch (_e) { /* si falla, el análisis sigue sin este contexto extra */ }

  try {
    const data = await generarJSON(`Eres el motor exegético de RevelatiO by Efata, plataforma de estudio bíblico en español.

La consulta puede ser (a) una referencia bíblica concreta (ej. "Juan 3:16", "Salmos 23:1") o (b) un tema o pregunta ("el perdón", "¿qué es la gracia?").

Responde ÚNICAMENTE con JSON válido y esta estructura exacta:
{"referencia":"","versiones":{"rvr1960":"","nvi":"","ntv":"","lbla":"","pdt":"","btx3":"","rv2004":"","peshitta":""},"idiomaOriginal":{"termino":"","strong":"","analisis":""},"objetivo":"","contextoHistoricoLiterario":"","estructuraLiteraria":"","analisisGramatical":"","hermeneutica":"","exegesisVersiculoVersiculo":"","comentarioMacArthur":"","aplicacion":""}

Reglas:
- "referencia": la cita canónica normalizada (ej. "Juan 3:16"). Si es un tema, coloca el pasaje base más representativo.
- "versiones": incluye siempre las ocho claves: rvr1960, nvi, ntv, lbla, pdt, btx3, rv2004 y peshitta. Escribe el texto solo si puedes confirmarlo con seguridad; si no, deja el campo vacío "". No inventes una traducción ni presentes una paráfrasis como texto bíblico.
- "idiomaOriginal": término griego o hebreo clave, número Strong y un breve análisis morfológico/etimológico. Si se te da un CONTEXTO REAL VERIFICADO más abajo, tu término y número de Strong DEBEN salir de ahí, no de tu memoria.
- "objetivo": propósito concreto del estudio y pregunta que debe responder.
- "contextoHistoricoLiterario": autor, audiencia, situación, género y contexto histórico solo cuando sea razonablemente verificable.
- "estructuraLiteraria": movimientos y argumento del pasaje.
- "analisisGramatical": observaciones de sintaxis, términos y conexiones; usa el contexto Strong real si fue proporcionado.
- "hermeneutica": interpretación responsable conectada con el conjunto de la Escritura.
- "exegesisVersiculoVersiculo": recorrido por cada versículo o unidad disponible; si la consulta es temática, explica que se trata de un pasaje base.
- "comentarioMacArthur": comentario exegético pastoral, riguroso y expositivo. Debe servir como respaldo si alguna sección no puede desarrollarse.
- "aplicacion": aplicación ministerial que refleje el camino del evangelio: confesión y arrepentimiento (1 Juan 1:9), conversión y estudio de la Palabra (1 Pedro 2:2), y permanecer firmes y constantes en la fe (1 Corintios 15:58).
- Completa todas las secciones con contenido útil. No dejes campos vacíos salvo que falten datos verificables de una traducción.
- No inventes citas: si no puedes confirmar un texto exacto, deja ese campo vacío y explícalo en el comentario.
- Escribe en español claro. PROHIBIDO usar LaTeX o notación matemática (nada de \\rightarrow, $...$, \\text, símbolos de fórmula). Usa palabras y flechas simples como "->".

Consulta: ${consulta}${contextoOriginal}`, { maxOutputTokens: 5000, reintentos: 1 });
    const base = typeof data === 'object' && data ? data : {};
    const textoRespaldo = String(base.comentarioMacArthur || base.aplicacion || '').trim();
    const completar = (valor, etiqueta) => String(valor || '').trim() || (textoRespaldo ? `${etiqueta}: ${textoRespaldo}` : 'No se pudo desarrollar esta sección con los datos disponibles.');
    const normalizado = {
      referencia: base.referencia || consulta,
      versiones: base.versiones || {},
      idiomaOriginal: base.idiomaOriginal || {},
      objetivo: completar(base.objetivo, 'Objetivo del estudio'),
      contextoHistoricoLiterario: completar(base.contextoHistoricoLiterario, 'Contexto histórico y literario'),
      estructuraLiteraria: completar(base.estructuraLiteraria, 'Estructura literaria'),
      analisisGramatical: completar(base.analisisGramatical, 'Análisis gramatical'),
      hermeneutica: completar(base.hermeneutica, 'Hermenéutica'),
      exegesisVersiculoVersiculo: completar(base.exegesisVersiculoVersiculo, 'Exégesis versículo a versículo'),
      comentarioMacArthur: base.comentarioMacArthur || '',
      aplicacion: base.aplicacion || ''
    };
    return res.status(200).json({ success: true, data: normalizado });
  } catch (error) {
    console.error('Error en el motor exegético:', error?.message);
    if (error?.code === 'RATE_LIMIT') {
      return res.status(429).json({ error: 'RevelatiO IA está recibiendo muchas consultas ahora mismo. Espera unos segundos e inténtalo de nuevo.' });
    }
    return res.status(502).json({ error: 'No fue posible completar el análisis. Intenta nuevamente.' });
  }
}
