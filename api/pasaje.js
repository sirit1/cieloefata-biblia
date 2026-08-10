import { createClient } from '@supabase/supabase-js';
import { parsearReferencia, obtenerCapitulo, extraerTexto, extraerVersos, obtenerOriginal, VERSIONES } from '../lib/biblia.js';

// Texto bíblico REAL (no generado por IA): se sirve desde Bolls Bible
// (bolls.life), una API pública gratuita y sin clave, para que la lectura
// sea instantánea y fiel a traducciones reales, en lugar de esperar a que
// un modelo de IA "recuerde" el versículo (lento y con riesgo de inexactitud
// en un texto sagrado). También incluye el idioma original (griego/hebreo
// con números de Strong) y, en el Antiguo Testamento, la Septuaginta griega.

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

// La fuente peshitta.onrender.com solo tiene el campo translation_es
// (traducción al español) poblado para el Nuevo Testamento: en el Antiguo
// Testamento devuelve vacío/null para prácticamente todos los versículos.
// Por eso el catálogo se limita al NT — pedir libros del AT nunca produce
// texto y solo desperdicia una llamada a un servicio externo lento.
const PESHITTA_LIBROS = {
  'Mateo': 'Matthew', 'Marcos': 'Mark', 'Lucas': 'Luke', 'Juan': 'John', 'Hechos': 'Acts',
  'Romanos': 'Romans', '1 Corintios': '1 Corinthians', '2 Corintios': '2 Corinthians',
  'Gálatas': 'Galatians', 'Efesios': 'Ephesians', 'Filipenses': 'Philippians', 'Colosenses': 'Colossians',
  '1 Tesalonicenses': '1 Thessalonians', '2 Tesalonicenses': '2 Thessalonians', '1 Timoteo': '1 Timothy',
  '2 Timoteo': '2 Timothy', 'Tito': 'Titus', 'Filemón': 'Philemon', 'Hebreos': 'Hebrews',
  'Santiago': 'James', '1 Pedro': '1 Peter', '2 Pedro': '2 Peter', '1 Juan': '1 John',
  '2 Juan': '2 John', '3 Juan': '3 John', 'Judas': 'Jude', 'Apocalipsis': 'Revelation'
};

// El servicio free de Render "duerme" si está inactivo y puede tardar
// decenas de segundos en despertar (cold start). Se limita cada llamada a
// 6s para que un arranque en frío no bloquee el resto de versiones (que sí
// responden rápido) ni haga esperar de más al lector.
async function obtenerVersoPeshitta(query) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const respuesta = await fetch(`https://peshitta.onrender.com/api/verse?ref=${query}&lang=es`, { signal: controller.signal });
    if (!respuesta.ok) return null;
    return await respuesta.json();
  } catch (_e) {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function obtenerPeshitta(ref) {
  const libro = PESHITTA_LIBROS[ref.libro];
  if (!libro) return { texto: '', versos: [] };
  // Sin versículo puntual (lectura de capítulo completo): la API de Peshitta
  // no expone un endpoint de capítulo, así que no se pueden recorrer decenas
  // de versículos uno por uno sin arriesgar timeout. Se omite en ese caso;
  // el resto de versiones sigue disponible para el lector.
  if (!ref.versoInicio) return { texto: '', versos: [] };
  const versos = [];
  for (let numero = ref.versoInicio; numero <= (ref.versoFin || ref.versoInicio); numero += 1) {
    const query = encodeURIComponent(`${libro} ${ref.capitulo}:${numero}`);
    const dato = await obtenerVersoPeshitta(query);
    if (dato?.translation_es) versos.push({ n: numero, texto: dato.translation_es });
  }
  const texto = versos.map((v) => v.texto).join(' ').trim();
  return { texto, versos };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método no permitido.' });
  }

  // La lectura bíblica es contenido público; no debe quedar bloqueada por una
  // sesión ausente o vencida. Las funciones privadas siguen autenticándose.
  const referencia = typeof req.body?.referencia === 'string' ? req.body.referencia.trim() : '';
  if (!referencia || referencia.length > 60) {
    return res.status(400).json({ error: 'La referencia bíblica no es válida.' });
  }

  const ref = parsearReferencia(referencia);
  if (!ref) {
    return res.status(400).json({ error: 'No se pudo interpretar esa referencia. Usa el formato "Libro capítulo:versículo".' });
  }

  try {
    const [resultados, original, peshitta] = await Promise.all([
      Promise.all(
        VERSIONES.map(async (v) => {
          const data = await obtenerCapitulo(v.bolls, ref.libroId, ref.capitulo);
          const texto = extraerTexto(data, ref.versoInicio, ref.versoFin);
          const versos = extraerVersos(data, ref.versoInicio, ref.versoFin);
          return { ...v, texto, versos };
        })
      ),
      obtenerOriginal(ref).catch(() => null),
      obtenerPeshitta(ref).catch(() => ({ texto: '', versos: [] }))
    ]);

    const versiones = {};
    const versionesVersos = {};
    const versionesLista = [];
    for (const r of resultados) {
      if (r.texto) {
        versiones[r.key] = r.texto;
        versionesVersos[r.key] = r.versos;
        versionesLista.push({ key: r.key, etiqueta: r.etiqueta });
      }
    }
    if (peshitta.texto) {
      versiones.peshitta = peshitta.texto;
      versionesVersos.peshitta = peshitta.versos;
      versionesLista.push({ key: 'peshitta', etiqueta: 'Peshitta · español' });
    }

    if (!versionesLista.length) {
      return res.status(502).json({ error: 'No fue posible obtener el texto bíblico en este momento. Intenta de nuevo.' });
    }

    const referenciaNormalizada = ref.versoInicio
      ? `${ref.libro} ${ref.capitulo}:${ref.versoInicio}${ref.versoFin && ref.versoFin !== ref.versoInicio ? `-${ref.versoFin}` : ''}`
      : `${ref.libro} ${ref.capitulo}`;

    return res.status(200).json({
      success: true,
      data: { referencia: referenciaNormalizada, versiones, versionesVersos, versionesLista, original }
    });
  } catch (error) {
    console.error('Error obteniendo pasaje real:', error?.message);
    return res.status(502).json({ error: 'No fue posible obtener el texto bíblico en este momento. Intenta de nuevo.' });
  }
}
