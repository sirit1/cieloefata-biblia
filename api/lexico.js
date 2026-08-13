import { createClient } from '@supabase/supabase-js';
import { obtenerDefinicionStrong, DICCIONARIO_STRONG } from '../lib/biblia.js';
import { consultarDiccionario } from '../lib/diccionario.js';
import { generarJSON, hayMotorIA } from '../lib/ai.js';
import { consumirCuota, respuestaCuotaAgotada } from '../lib/quota.js';

function limpiarTextoLexico(texto) {
  return String(texto || '')
    .replace(/(^|\\n)\\s*[-–]?\\s*(original|transliteration|transliteración|phonetic|pronunciación|definition|definición|origin|origen|tdnt entry|part\\(s\\) of speech|categoría gramatical|strongs?)\\s*:?/gim, '$1')
    .replace(/\\b(from|compare|perhaps|to be|of persons|of things|verb|adverb|noun|preposition|conjunction)\\b/gi, '')
    .replace(/\\n{3,}/g, '\\n\\n')
    .trim();
}

async function traducirDefinicion(definicion) {
  if (!hayMotorIA() || !definicion?.definicion) {
    return { ...definicion, traduccionEstricta: limpiarTextoLexico(definicion?.lexema) || 'Sin equivalente disponible.', definicionEs: 'No se pudo preparar la traducción al español en este momento.' };
  }
  try {
    const traduccion = await generarJSON(`Eres un lexicógrafo bíblico. Traduce esta entrada al español claro. Devuelve SOLO JSON válido con dos claves: traduccion_estricta y definicion_es. traduccion_estricta debe ser una lista breve de equivalentes españoles directos, separados por comas; definicion_es debe explicar el uso léxico en una frase. NO incluyas inglés ni etiquetas de campos, tampoco Original, Transliteration, Phonetic, Definition, Origin, TDNT, Part(s) of speech o Strong's. Escribe únicamente una explicación española breve del significado y uso.\n\nCódigo: ${definicion.codigo}\nLexema original: ${definicion.lexema}\nEntrada fuente: ${definicion.definicion}`, { reintentos: 2 });
    const definicionEs = limpiarTextoLexico(traduccion?.definicion_es);
    const traduccionEstricta = limpiarTextoLexico(traduccion?.traduccion_estricta);
    return { ...definicion, traduccionEstricta: traduccionEstricta || limpiarTextoLexico(definicion?.lexema) || 'Sin equivalente disponible.', definicionEs: definicionEs || 'No se pudo preparar la traducción al español en este momento.' };
  } catch (_) {
    return { ...definicion, traduccionEstricta: limpiarTextoLexico(definicion?.lexema) || 'Sin equivalente disponible.', definicionEs: 'No se pudo preparar la traducción al español en este momento.' };
  }
}

// Diccionario léxico REAL (Brown-Driver-Briggs para hebreo, Thayer para
// griego, vía Bolls Bible) para consultar el significado exacto de una
// palabra original al tocarla en el lector. No es texto generado por IA.

const getSupabaseConfig = () => ({
  url: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  anonKey: process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

async function authenticate(req) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  const { url, anonKey } = getSupabaseConfig();
  if (!token || !url || !anonKey) return null;
  const supabase = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
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
  const cuota = await consumirCuota(req, user, 'lexico');
  if (!cuota.allowed) return cuota.reason ? respuestaCuotaAgotada(res, cuota) : res.status(cuota.status || 503).json({ error: cuota.error });

  const codigo = typeof req.body?.codigo === 'string' ? req.body.codigo.trim().toUpperCase().replace(/^([GH])0*(\d+)$/, '$1$2') : '';
  if (!/^[GH]\d{1,4}$/.test(codigo)) {
    return res.status(400).json({ error: 'Código de Strong inválido.' });
  }

  try {
    let definicion = await obtenerDefinicionStrong(codigo);
    // Bolls devuelve las entradas hebreas con el prefijo H; este respaldo evita
    // que una respuesta transitoria del proveedor rompa H7223, H834, etc.
    if (!definicion) {
      const respuesta = await fetch(`https://bolls.life/dictionary-definition/${DICCIONARIO_STRONG.bolls}/${encodeURIComponent(codigo)}/`);
      const entradas = await respuesta.json();
      const entrada = Array.isArray(entradas) ? entradas[0] : null;
      if (entrada) definicion = { codigo, lexema: entrada.lexeme || entrada.topic || codigo, transliteracion: entrada.transliteration || '', pronunciacion: entrada.pronunciation || '', definicionCorta: entrada.short_definition || '', definicion: String(entrada.definition || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() };
    }
    if (!definicion) {
      return res.status(404).json({ error: 'No se encontró una definición para ese término.' });
    }
    const resultado = await traducirDefinicion(definicion);
    const contexto = await consultarDiccionario(codigo);
    return res.status(200).json({ success: true, data: { ...resultado, ...contexto } });
  } catch (error) {
    console.error('Error consultando el diccionario léxico:', error?.message);
    return res.status(502).json({ error: 'No fue posible consultar el diccionario en este momento.' });
  }
}
