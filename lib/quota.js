import { createClient } from '@supabase/supabase-js';

const LIMITES = {
  exegesis: { tier: 'deep', requests: 3, tokens: 36000, costLabel: 'estudio profundo' },
  lente: { tier: 'standard', requests: 12, tokens: 18000, costLabel: 'lentes de estudio' },
  referencias: { tier: 'standard', requests: 10, tokens: 12000, costLabel: 'referencias cruzadas' },
  discipulado: { tier: 'standard', requests: 5, tokens: 10000, costLabel: 'planes de discipulado' },
  lexico: { tier: 'standard', requests: 25, tokens: 7500, costLabel: 'consultas léxicas' },
};

function config() {
  return {
    url: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}

export async function consumirCuota(req, user, endpoint) {
  const limite = LIMITES[endpoint];
  if (!limite) return { allowed: true, bypass: true };

  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  const { url, anonKey } = config();
  if (!token || !url || !anonKey) {
    return { allowed: false, status: 503, error: 'El control de consumo no está disponible.' };
  }

  const supabase = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.rpc('consume_ai_quota', {
    p_user_id: user.id,
    p_endpoint: endpoint,
    p_tier: limite.tier,
    p_estimated_tokens: limite.tokens,
    p_daily_request_limit: limite.requests,
    p_daily_token_limit: limite.tokens * limite.requests,
  });

  if (error || !data) {
    console.error('[v0] quota RPC error:', error?.message || 'empty response');
    return { allowed: false, status: 503, error: 'No se pudo comprobar tu límite de uso.' };
  }
  return { ...data, endpoint, tier: limite.tier, costLabel: limite.costLabel };
}

export function respuestaCuotaAgotada(res, quota) {
  const limite = quota.reason === 'tokens' ? 'el presupuesto diario de procesamiento' : 'el número diario de consultas';
  return res.status(429).json({
    error: `Has alcanzado ${limite} para ${quota.costLabel}. Tu cuota se renueva mañana.`,
    code: 'AI_QUOTA_EXCEEDED',
    usage: quota,
  });
}

export function limitesPublicos() {
  return Object.fromEntries(Object.entries(LIMITES).map(([key, value]) => [key, { requests: value.requests, tier: value.tier, costLabel: value.costLabel }]));
}
