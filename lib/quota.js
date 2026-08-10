import { createClient } from '@supabase/supabase-js';



const LIMITES = {

  exegesis: { tier: 'deep', requests: 3, tokens: 36000, costLabel: 'estudio profundo' },

  lente: { tier: 'standard', requests: 12, tokens: 18000, costLabel: 'lentes de estudio' },

  referencias: { tier: 'standard', requests: 10, tokens: 12000, costLabel: 'referencias cruzadas' },

  lexico: { tier: 'standard', requests: 25, tokens: 7500, costLabel: 'consultas léxicas' },

};



function config() {

  return {

    url: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,

    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY,

  };

}



// Cliente de servicio: evade RLS de forma legítima en código de servidor.

// La identidad del usuario ya se verifica con getUser(token) antes de llamar aquí,

// y toda la contabilidad se limita al user.id verificado.

function servicio() {

  const { url, serviceKey } = config();

  if (!url || !serviceKey) return null;

  return createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

}



async function esAdministrador(supabase, email) {

  if (!email) return false;

  const { data } = await supabase.from('admin_allowlist').select('email').eq('email', email).maybeSingle();

  return !!data;

}



export async function consumirCuota(req, user, endpoint) {

  const limite = LIMITES[endpoint];

  if (!limite) return { allowed: true, bypass: true };



  const supabase = servicio();

  if (!supabase || !user?.id) {

    return { allowed: false, status: 503, error: 'El control de consumo no está disponible.' };

  }



  // Los administradores (admin_allowlist) no tienen límites de consumo.

  if (await esAdministrador(supabase, user.email)) {

    return { allowed: true, bypass: true, unlimited: true, endpoint, tier: limite.tier, costLabel: limite.costLabel };

  }



  const hoy = new Date().toISOString().slice(0, 10);

  const requestLimit = limite.requests;

  const tokenLimit = limite.tokens * limite.requests;

  const estimados = limite.tokens;



  try {

    // Asegura la fila del día sin sobrescribir el acumulado existente.

    await supabase.from('ai_usage_daily').upsert(

      { user_id: user.id, usage_date: hoy },

      { onConflict: 'user_id,usage_date', ignoreDuplicates: true },

    );



    const { data: fila, error: leerError } = await supabase

      .from('ai_usage_daily')

      .select('requests_used, estimated_tokens')

      .eq('user_id', user.id)

      .eq('usage_date', hoy)

      .maybeSingle();

    if (leerError) throw leerError;



    let usados = fila?.requests_used || 0;

    let tokens = fila?.estimated_tokens || 0;



    const permitido = usados < requestLimit && tokens + estimados <= tokenLimit;

    const reason = permitido ? null : usados >= requestLimit ? 'requests' : 'tokens';



    await supabase.from('ai_usage_events').insert({

      user_id: user.id,

      endpoint,

      tier: limite.tier,

      estimated_tokens: estimados,

      status: permitido ? 'allowed' : 'blocked',

    });



    if (permitido) {

      usados += 1;

      tokens += estimados;

      await supabase

        .from('ai_usage_daily')

        .update({ requests_used: usados, estimated_tokens: tokens, updated_at: new Date().toISOString() })

        .eq('user_id', user.id)

        .eq('usage_date', hoy);

    }



    return {

      allowed: permitido,

      reason,

      requests_used: usados,

      estimated_tokens: tokens,

      request_limit: requestLimit,

      token_limit: tokenLimit,

      endpoint,

      tier: limite.tier,

      costLabel: limite.costLabel,

    };

  } catch (error) {

    console.error('[v0] quota error:', error?.message || error);

    return { allowed: false, status: 503, error: 'No se pudo comprobar tu límite de uso.' };

  }

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
