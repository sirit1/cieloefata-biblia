// api/consultar.js (Vercel Serverless Function)
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    const { libro, capitulo, versiculo } = req.body;

    try {
        const { data, error } = await supabase
            .from('textos_biblicos')
            .select('*')
            .eq('libro_key', libro)
            .eq('capitulo', capitulo)
            .eq('versiculo', versiculo)
            .single();

        if (error) throw error;

        return res.status(200).json({ success: true, data });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
}
