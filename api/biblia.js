// api/biblia.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://xzjoruazhlwmaebnnqqbv.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'sb_publishable_AVcvj1Bq_uD7sYhbJZeHWA_NobPb...'
);

export default async function handler(req, res) {
  // Configurar CORS para permitir peticiones locales y de producción
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { libro, capitulo, versiculo } = req.query;

  if (!libro || !capitulo || !versiculo) {
    return res.status(400).json({ error: 'Faltan parámetros obligatorios: libro, capitulo, versiculo' });
  }

  try {
    const { data, error } = await supabase
      .from('textos_biblicos')
      .select('*')
      .eq('libro_key', libro)
      .eq('capitulo', parseInt(capitulo))
      .eq('versiculo', parseInt(versiculo));

    if (error) throw error;

    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}