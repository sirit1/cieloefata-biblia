// Recursos de Estudio Histórico: comentarios y diccionarios léxicos para
// CUALQUIER pasaje de los 66 libros (no solo una muestra fija).
//
// - Diccionario Strong: léxico de dominio público (local + Thayer/BDB).
//   Nunca es generado por IA.
// - Comentarios v1.0 (JFB, Matthew Henry, Barnes, Spurgeon): JSON modular
//   en data/commentaries/. No se sintetiza con IA.
import { createClient } from '@supabase/supabase-js';
import { parsearReferencia, obtenerOriginal, originalComoTextoPlano, strongsUnicos, obtenerDefinicionStrong } from '../lib/biblia.js';
import { armarRespuestaComentario } from '../lib/comentarios.js';
import { entradaStrongLocal } from '../lib/strong.js';
import { generarJSON, hayMotorIA } from '../lib/ai.js';

const getSupabaseConfig = () => ({
  url: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  anonKey: process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
});

function getCacheClient() {
  const { url, serviceRoleKey } = getSupabaseConfig();
  if (!url || !serviceRoleKey) return null;
  return createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

function buildCacheKey(referencia, tipo, clave) {
  return ['recursos', referencia.trim().toLowerCase(), tipo, clave].join('::');
}

async function readCache(cacheKey) {
  try {
    const client = getCacheClient();
    if (!client) return null;
    const { data } = await client.from('ai_lente_cache').select('data').eq('cache_key', cacheKey).maybeSingle();
    return data?.data || null;
  } catch (_error) {
    return null;
  }
}

async function writeCache(cacheKey, data) {
  try {
    const client = getCacheClient();
    if (!client) return;
    await client.from('ai_lente_cache').upsert({ cache_key: cacheKey, data, created_at: new Date().toISOString() });
  } catch (_error) {
    // La caché nunca debe bloquear una respuesta válida.
  }
}

async function authenticate(req) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  const { url, anonKey } = getSupabaseConfig();
  if (!token || !url || !anonKey) return null;
  const supabase = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await supabase.auth.getUser(token);
  return error ? null : data.user;
}

function aplanarTexto(valor) {
  if (valor == null) return '';
  if (typeof valor === 'string') return valor;
  if (typeof valor === 'number' || typeof valor === 'boolean') return String(valor);
  if (Array.isArray(valor)) return valor.map(aplanarTexto).filter(Boolean).join('\n\n');
  if (typeof valor === 'object') return Object.values(valor).map(aplanarTexto).filter(Boolean).join('\n\n');
  return String(valor);
}

// Comentaristas: todos son autores reales, fallecidos hace más de 70 años,
// cuya obra es de dominio público.
const COMENTARIOS = {
  jfb: { autor: 'Jamieson-Fausset-Brown', tipo: 'Exegético · crítico versículo a versículo', anio: 1882, enfoque: 'un comentario crítico y exegético, denso y versículo a versículo, atento a la gramática del texto original y a las variantes de interpretación entre comentaristas.' },
  matthew_henry: { autor: 'Matthew Henry', tipo: 'Pastoral y devocional clásico', anio: 1710, enfoque: 'un comentario pastoral y devocional, cálido, que extrae aplicación práctica y espiritual de cada frase del texto.' },
  barnes: { autor: 'Albert Barnes', tipo: 'Notas expositivas y gramaticales', anio: 1834, enfoque: 'notas expositivas cuidadosas del sentido gramatical y contextual de cada frase, con atención al griego o hebreo original y a las opciones de traducción.' },
  spurgeon: { autor: 'C. H. Spurgeon', tipo: 'Homilético', anio: 1870, enfoque: 'una exposición homilética: vívida, ilustrativa y orientada a la predicación, con aplicación evangelística directa al corazón del oyente.' },
};

// Diccionarios temáticos: igual, autores reales de dominio público.
const DICCIONARIOS = {
  easton: { autor: 'Diccionario Bíblico Easton', tipo: 'Arqueología, cultura y lugares', anio: 1897, enfoque: 'una entrada de diccionario bíblico: identifica personas, lugares, objetos o costumbres relevantes del pasaje y describe su trasfondo histórico, geográfico y cultural.' },
  hitchcock: { autor: 'Diccionario de Nombres de Hitchcock', tipo: 'Significado etimológico', anio: 1869, enfoque: 'el significado etimológico de los nombres propios (personas o lugares) que aparecen en el pasaje, en el estilo breve y directo de un diccionario de nombres bíblicos.' },
  trench: { autor: 'Sinónimos del Nuevo Testamento de Trench', tipo: 'Filología y matices léxicos del NT', anio: 1854, enfoque: 'un estudio filológico de los matices de las palabras griegas clave del pasaje, comparándolas con sinónimos cercanos y explicando la diferencia doctrinal o de énfasis entre ellas.' },
};

const CLAVE_AUTOR = {
  jfb: 'jamieson-fausset-brown',
  'jamieson-fausset-brown': 'jamieson-fausset-brown',
  matthew_henry: 'matthew-henry',
  'matthew-henry': 'matthew-henry',
  barnes: 'albert-barnes',
  'albert-barnes': 'albert-barnes',
  spurgeon: 'charles-spurgeon',
  'charles-spurgeon': 'charles-spurgeon',
};

function resolverFuente(tipo, clave) {
  if (tipo === 'commentaries') return COMENTARIOS[clave] || COMENTARIOS[Object.keys(CLAVE_AUTOR).find((k) => CLAVE_AUTOR[k] === clave)] || null;
  if (tipo === 'dictionaries') return DICCIONARIOS[clave] || null;
  return null;
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método no permitido.' });
  }

  const user = await authenticate(req);
  if (!user) return res.status(401).json({ error: 'Sesión inválida o vencida.' });

  const referencia = typeof req.body?.referencia === 'string' ? req.body.referencia.trim() : '';
  const tipo = req.body?.tipo === 'dictionaries' ? 'dictionaries' : req.body?.tipo === 'commentaries' ? 'commentaries' : '';
  const clave = typeof req.body?.clave === 'string' ? req.body.clave.trim() : '';

  if (!referencia || !tipo || !clave) {
    return res.status(400).json({ error: 'Parámetros inválidos.' });
  }

  const ref = parsearReferencia(referencia);
  if (!ref) {
    return res.status(400).json({ error: 'No reconozco esa referencia bíblica.' });
  }

  // Contexto real verificado: texto original (griego/hebreo con Strong's).
  let original = null;
  try {
    original = await obtenerOriginal(ref);
  } catch (_e) { /* si falla, seguimos sin este contexto extra */ }

  // ---- Diccionario Strong: léxico de dominio público, nunca generado por IA ----
  if (tipo === 'dictionaries' && clave === 'strong') {
    const codigos = strongsUnicos(original).slice(0, 12);
    if (!codigos.length) {
      return res.status(200).json({
        success: true,
        data: { autor: 'Concordancia Strong', tipo: 'Griego / hebreo con códigos', items: [] },
      });
    }
    const entradas = (await Promise.all(codigos.map(async (c) => {
      const local = entradaStrongLocal(c);
      if (local?.definicion) {
        return {
          codigo: c,
          lexema: local.lemma || '',
          transliteracion: local.translit || '',
          definicionCorta: local.definicion,
          definicion: local.definicion,
        };
      }
      return obtenerDefinicionStrong(c).catch(() => null);
    }))).filter(Boolean);
    return res.status(200).json({
      success: true,
      data: { autor: 'Concordancia Strong', tipo: 'Griego / hebreo con códigos', items: entradas },
    });
  }

  if (tipo === 'commentaries') {
    const autorKey = CLAVE_AUTOR[clave] || clave;
    const data = armarRespuestaComentario(autorKey, referencia);
    const fuente = resolverFuente('commentaries', clave) || { autor: data.titulo, tipo: 'Comentario clásico' };
    if (data.cuerpo) {
      return res.status(200).json({
        success: true,
        data: {
          autor: data.titulo || fuente.autor,
          tipo: fuente.tipo,
          texto: data.cuerpo,
        },
      });
    }
  }

  const fuente = resolverFuente(tipo, clave);
  if (!fuente) return res.status(400).json({ error: 'Fuente no reconocida.' });

  const cacheKey = buildCacheKey(referencia, tipo, clave);
  const cached = await readCache(cacheKey);
  if (cached) return res.status(200).json({ success: true, data: cached, cached: true });

  if (!hayMotorIA()) {
    return res.status(503).json({ error: 'RevelatiO IA todavía no está configurado.' });
  }

  const contextoOriginal = original
    ? `\n\nCONTEXTO REAL VERIFICADO (${original.etiqueta}): ${originalComoTextoPlano(original)}`
    : '';

  try {
    const data = await generarJSON(`Eres el motor de síntesis histórica de RevelatiO by Efata, una plataforma de estudio bíblico en español. Tu tarea es redactar, para el pasaje indicado, ${fuente.enfoque}

Debes escribir SIGUIENDO FIELMENTE la línea teológica, el énfasis y el estilo ampliamente documentado de ${fuente.autor} (obra original de ${fuente.anio}, hoy de dominio público). No presentes el resultado como una cita textual entrecomillada ni como transcripción literal de su libro: es una síntesis fiel de su enfoque conocido, aplicada a este pasaje concreto.

Responde ÚNICAMENTE con JSON válido y esta estructura exacta:
{"texto":""}

Reglas:
- "texto": 1 a 3 párrafos en español, con el estilo y énfasis de ${fuente.autor}, anclados en el pasaje bíblico indicado. Si se te da un CONTEXTO REAL VERIFICADO más abajo (texto original griego/hebreo con número Strong), apóyate en él para el sentido de las palabras clave en vez de inventar el idioma original.
- No inventes datos históricos o biográficos que no puedas sostener. Sé riguroso, claro y fiel a la tradición del autor.
- PROHIBIDO usar LaTeX o notación matemática.

Pasaje: ${referencia}${contextoOriginal}`);

    const responseData = {
      autor: fuente.autor,
      tipo: fuente.tipo,
      texto: aplanarTexto(data.texto),
      nota: `Síntesis de RevelatiO IA fiel a la línea de ${fuente.autor} (obra de ${fuente.anio}, dominio público), no una cita textual de su libro.`,
    };
    await writeCache(cacheKey, responseData);
    return res.status(200).json({ success: true, data: responseData, cached: false });
  } catch (error) {
    console.error('[v0] Error en api/recursos:', error?.message);
    if (error?.code === 'RATE_LIMIT') {
      return res.status(429).json({ error: 'RevelatiO IA está recibiendo muchas consultas. Espera unos segundos e inténtalo de nuevo.' });
    }
    return res.status(502).json({ error: 'No fue posible generar este recurso. Intenta nuevamente.' });
  }
}
