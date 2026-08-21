import { catalogoPublico } from '../lib/versiones.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Método no permitido.' });
  }
  return res.status(200).json({ success: true, data: catalogoPublico() });
}
