import { createClient } from '@supabase/supabase-js';
import { obtenerDefinicionStrong, DICCIONARIO_STRONG } from '../lib/biblia.js';
import { consultarDiccionario } from '../lib/diccionario.js';
import { entradaStrongLocal } from '../lib/strong.js';
import { generarJSON, hayMotorIA } from '../lib/ai.js';
import { consumirCuota, respuestaCuotaAgotada } from '../lib/quota.js';

function limpiarTextoLexico(texto) {
  return String(texto || '')
    .replace(/(^|\\n)\\s*[-–]?\\s*(original|transliteration|transliteración|phonetic|pronunciación|definition|definición|origin|origen|tdnt entry|part\\(s\\) of speech|categoría gramatical|strongs?)\\s*:?/gim, '$1')
    .replace(/\\b(from|compare|perhaps|to be|of persons|of things|verb|adverb|noun|preposition|conjunction)\\b/gi, '')
    .replace(/\\n{3,}/g, '\\n\\n')
    .trim();
}

// Toda entrada Strong consultada DEBE devolver una traducción estricta real al
// español (nunca el lexema original hebreo/griego sin traducir, ni un texto en
// inglés). Se intenta primero con la entrada completa del diccionario; si esa
// llamada falla o vuelve vacía, se reintenta con un prompt más simple basado
// solo en la definición corta, antes de rendirse.
async function traducirConIA(prompt) {
  const traduccion = await generarJSON(prompt, { reintentos: 2 });
  const definicionEs = limpiarTextoLexico(traduccion?.definicion_es);
  const traduccionEstricta = limpiarTextoLexico(traduccion?.traduccion_estricta);
  if (!traduccionEstricta || !definicionEs) return null;
  return { traduccionEstricta, definicionEs };
}

async function traducirDefinicion(definicion) {
  const base = { ...definicion };
  if (!hayMotorIA()) {
    return { ...base, traduccionEstricta: 'Traducción no disponible: falta configurar RevelatiO IA.', definicionEs: 'No se pudo preparar la traducción al español en este momento.' };
  }

  const instruccionComun = 'NO incluyas inglés ni etiquetas de campos, tampoco Original, Transliteration, Phonetic, Definition, Origin, TDNT, Part(s) of speech o Strong\'s. traduccion_estricta debe ser SIEMPRE en español: una lista breve de equivalentes españoles directos del término, separados por comas, NUNCA la palabra hebrea o griega original ni texto en inglés.';

  try {
    const resultado = await traducirConIA(`Eres un lexicógrafo bíblico. Traduce esta entrada al español claro. Devuelve SOLO JSON válido con dos claves: traduccion_estricta y definicion_es. ${instruccionComun} definicion_es debe explicar el uso léxico en una frase, en español.\n\nCódigo: ${definicion.codigo}\nLexema original: ${definicion.lexema}\nEntrada fuente: ${definicion.definicion || definicion.definicionCorta || 'Sin entrada disponible.'}`);
    if (resultado) return { ...base, ...resultado };
  } catch (_) {}

  // Segundo intento con un prompt mínimo (más robusto ante entradas fuente
  // vacías o mal formateadas que pudieron causar el primer fallo).
  try {
    const resultado = await traducirConIA(`Traduce al español el término bíblico Strong ${definicion.codigo} (${definicion.lexema || 'sin lexema disponible'}, transliteración: ${definicion.transliteracion || 'no disponible'}). Devuelve SOLO JSON con dos claves: traduccion_estricta (equivalentes españoles directos, separados por comas) y definicion_es (una frase en español sobre su significado y uso bíblico). ${instruccionComun}`);
    if (resultado) return { ...base, ...resultado };
  } catch (_) {}

  return { ...base, traduccionEstricta: 'Traducción al español no disponible temporalmente. Vuelve a intentarlo.', definicionEs: 'No se pudo preparar la traducción al español en este momento.' };
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
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Método no permitido.' });
  }

  const user = await authenticate(req);
  if (user) {
    const cuota = await consumirCuota(req, user, 'lexico');
    if (!cuota.allowed) {
      return cuota.reason
        ? respuestaCuotaAgotada(res, cuota)
        : res.status(cuota.status || 503).json({ error: cuota.error });
    }
  }

  const q = { ...(req.query || {}), ...((req.body && typeof req.body === 'object') ? req.body : {}) };
  const codigo = String(q.codigo || q.c || '').trim().toUpperCase().replace(/^([GH])0*(\d+)$/, '$1$2');
  const passage = String(q.passage || q.referencia || q.ref || '').trim();

  if (passage && !/^[GH]\d{1,5}$/.test(codigo)) {
    const { contextoConsulta, formatearLexico } = await import('../lib/consulta-contexto.js');
    const ctx = await contextoConsulta({ passage, referencia: passage });
    const entradas = Array.isArray(ctx?.strongs) ? ctx.strongs : [];
    return res.status(200).json({
      success: true,
      found: entradas.length > 0,
      answer: formatearLexico(ctx || {}),
      data: {
        referencia: ctx?.etiqueta || passage,
        entradas,
        resultados: entradas,
      },
    });
  }

  if (!/^[GH]\d{1,5}$/.test(codigo)) {
    return res.status(400).json({ error: 'Código de Strong inválido.' });
  }

  try {
    const local = entradaStrongLocal(codigo);
    if (local?.definicion) {
      const contexto = await consultarDiccionario(codigo);
      return res.status(200).json({ success: true, data: contexto || {
        codigo,
        lexema: local.lemma,
        lemma: local.lemma,
        raiz: local.raiz,
        transliteracion: local.translit,
        definicion: local.definicion,
        definicionEs: local.definicion,
        traduccionEstricta: local.definicion,
        idioma: local.idioma,
        fuente: 'Strong · dominio público',
      } });
    }

    let definicion = await obtenerDefinicionStrong(codigo);
    // Bolls devuelve las entradas hebreas con el prefijo H; este respaldo evita
    // que una respuesta transitoria del proveedor rompa H7223, H834, etc.
    if (!definicion) {
      const respuesta = await fetch(`https://bolls.life/dictionary-definition/${DICCIONARIO_STRONG.bolls}/${encodeURIComponent(codigo)}/`);
      const entradas = await respuesta.json();
      const entrada = Array.isArray(entradas) ? entradas[0] : null;
      if (entrada) definicion = { codigo, lexema: entrada.lexeme || entrada.topic || codigo, transliteracion: entrada.transliteration || '', pronunciacion: entrada.pronunciation || '', definicionCorta: entrada.short_definition || '', definicion: String(entrada.definition || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(), fuente: 'Strong / Thayer / BDB · dominio público' };
    }
    if (!definicion) {
      return res.status(404).json({ error: 'No se encontró una definición para ese término.' });
    }
    if (definicion.definicionEs || definicion.fuente?.includes('Strong · dominio público')) {
      const contexto = await consultarDiccionario(codigo);
      return res.status(200).json({ success: true, data: { ...definicion, ...contexto } });
    }
    const resultado = await traducirDefinicion(definicion);
    const contexto = await consultarDiccionario(codigo);
    return res.status(200).json({ success: true, data: { ...resultado, ...contexto } });
  } catch (error) {
    console.error('Error consultando el diccionario léxico:', error?.message);
    return res.status(502).json({ error: 'No fue posible consultar el diccionario en este momento.' });
  }
}
