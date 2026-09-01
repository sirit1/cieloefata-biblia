/**
 * Lentes RevelatiO — cinco oficios.
 * POST { passage, verseText, oficio? } → análisis por título, no dump de Estudio.
 */
import { officeOf, OFICIOS, generarOficioRevelatio, generarTodosLosOficios, oficioComoRespuestaHttp } from '../lib/lentes-oficios.js';

export default async function handler(req, res) {
  res.setHeader?.('Content-Type', 'application/json; charset=utf-8');
  res.setHeader?.('Access-Control-Allow-Origin', '*');

  if (req.method === 'OPTIONS') {
    res.setHeader?.('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader?.('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
    return res.status(204).end();
  }

  const isGet = req.method === 'GET';
  const body = (req.body && typeof req.body === 'object' ? req.body : {}) || {};
  const q = isGet ? req.query || {} : {};
  const passage = String(body.passage || body.referencia || body.ref || body.consulta || q.passage || q.q || 'Romanos 12:2').trim();
  const verseText = String(body.verseText || body.texto || q.verseText || '').trim();
  const oficioRaw = String(body.oficio || body.office || body.officeId || body.lensId || q.oficio || '').trim();
  const wantAll = body.all === true || body.oficios === 'all' || oficioRaw === 'all' || q.all === '1';
  const localOnly = body.localOnly === true || q.local === '1';

  try {
    if (wantAll || !oficioRaw) {
      const pack = await generarTodosLosOficios({ passage, verseText, localOnly });
      const answer = pack.oficios.map((o) => oficioComoRespuestaHttp(o).answer).join('\n\n---\n\n');
      return res.status(200).json({
        success: true,
        ok: true,
        passage: pack.passage,
        verseText: pack.verseText,
        oficios: pack.oficios,
        data: pack.oficios,
        answer,
        text: answer,
        source: pack.oficios.some((o) => o.source === 'revelatio-ia') ? 'revelatio-ia' : 'revelatio-local',
      });
    }

    const office = officeOf(oficioRaw);
    if (!office) {
      return res.status(400).json({
        success: false,
        error: 'Oficio no reconocido.',
        ids: OFICIOS.map((o) => o.id),
      });
    }

    const data = await generarOficioRevelatio({
      passage,
      verseText,
      oficio: office.id,
      localOnly,
    });
    return res.status(200).json(oficioComoRespuestaHttp(data));
  } catch (error) {
    console.error('[api/lentes-oficios]', error?.message || error);
    const office = officeOf(oficioRaw) || OFICIOS[0];
    const { fallbackOficio } = await import('../lib/lentes-oficios.js');
    const data = fallbackOficio(office, {
      etiqueta: passage,
      texto: verseText,
      strongs: [],
    });
    return res.status(200).json(oficioComoRespuestaHttp(data));
  }
}
