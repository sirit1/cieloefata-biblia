import { createClient } from '@supabase/supabase-js';
import { obtenerDefinicionStrong, DICCIONARIO_STRONG } from '../lib/biblia.js';
import { consultarDiccionario } from '../lib/diccionario.js';
import { entradaStrongLocal } from '../lib/strong.js';
import { consumirCuota, respuestaCuotaAgotada } from '../lib/quota.js';

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
    const entradas = (Array.isArray(ctx?.strongs) ? ctx.strongs : []).map((e) => {
      const catalogada = String(e.definicionEs || e.traduccionEstricta || '').trim();
      const sin = !catalogada;
      return {
        ...e,
        definicionEs: catalogada,
        traduccionEstricta: catalogada,
        sinGlosaEs: sin,
      };
    });
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
    const contexto = await consultarDiccionario(codigo);
    const merged = { ...definicion, ...contexto };
    const catalogada = String(merged.definicionEs || merged.traduccionEstricta || '').trim();
    const sinGlosaEs = !catalogada;
    return res.status(200).json({
      success: true,
      data: {
        ...merged,
        definicionEs: catalogada,
        traduccionEstricta: catalogada,
        sinGlosaEs,
        nota: sinGlosaEs ? 'sin glosa ES catalogada' : undefined,
      },
    });
  } catch (error) {
    console.error('Error consultando el diccionario léxico:', error?.message);
    return res.status(502).json({ error: 'No fue posible consultar el diccionario en este momento.' });
  }
}
