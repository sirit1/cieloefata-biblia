import { entradaStrongLocal } from '../lib/strong.js';
import { obtenerDefinicionStrong } from '../lib/biblia.js';

function normalizar(codigo) {
  return String(codigo || '').trim().toUpperCase().replace(/^([GH])0*(\d+)$/, '$1$2');
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Método no permitido.' });
  }

  const codigo = normalizar(
    req.method === 'GET' ? req.query?.codigo || req.query?.c : req.body?.codigo
  );
  if (!/^[GH]\d{1,5}$/.test(codigo)) {
    return res.status(400).json({ error: 'Indica un número de Strong válido.' });
  }

  const local = entradaStrongLocal(codigo);
  if (local?.definicion) {
    return res.status(200).json({ success: true, data: local });
  }

  try {
    const remoto = await obtenerDefinicionStrong(codigo);
    if (!remoto) {
      return res.status(404).json({ error: 'No hay entrada léxica para ese Strong.' });
    }
    return res.status(200).json({
      success: true,
      data: {
        codigo,
        idioma: codigo.startsWith('H') ? 'hebreo' : 'griego',
        lemma: remoto.lexema || '',
        raiz: remoto.lexema || '',
        translit: remoto.transliteracion || '',
        definicion: remoto.definicionCorta || remoto.definicion || '',
        fuente: 'Brown-Driver-Briggs / Thayer · dominio público',
      },
    });
  } catch {
    return res.status(502).json({ error: 'El léxico no respondió.' });
  }
}
