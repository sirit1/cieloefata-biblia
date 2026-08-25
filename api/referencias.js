import { createClient } from '@supabase/supabase-js';
import { consumirCuota, respuestaCuotaAgotada } from '../lib/quota.js';

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
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Método no permitido.' });
  }

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

  const { parseConsultaFlexible } = await import('../lib/consulta-contexto.js');
  const verseRef = parseConsultaFlexible(consulta);
  if (verseRef?.versoInicio) {
    const { obtenerTsk } = await import('../lib/tsk.js');
    const tsk = await obtenerTsk({
      passage: consulta,
      version: q.version || q.traduccion || 'RV1960',
    });
    return res.status(200).json(tsk);
  }

  return res.status(200).json({
    success: true,
    found: false,
    fuente: 'tsk-open-cross-ref',
    data: {
      referencia: consulta,
      fuente: 'tsk-open-cross-ref',
      referencias: [],
      nota: 'Las referencias cruzadas TSK requieren un versículo concreto. No se inventan paralelos temáticos.',
    },
  });
}
