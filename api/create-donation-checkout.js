import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido.' });
  if (!process.env.STRIPE_SECRET_KEY) return res.status(503).json({ error: 'Stripe todavía no está configurado en este entorno.' });
  const amount = Number(req.body?.amount);
  const requestId = String(req.body?.requestId || '').trim();
  if (!Number.isInteger(amount) || amount < 300 || amount > 1000000) {
    return res.status(400).json({ error: 'La aportación debe estar entre 3 € y 10.000 €.' });
  }
  if (!/^[a-zA-Z0-9_-]{16,80}$/.test(requestId)) {
    return res.status(400).json({ error: 'Solicitud de apoyo inválida. Inténtalo de nuevo.' });
  }
  const origin = req.headers.origin || `https://${req.headers.host}`;
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price_data: { currency: 'eur', product_data: { name: 'Apoyo voluntario a RevelatiO by Efata', description: 'Contribución voluntaria. Todo el contenido de RevelatiO es gratuito.' }, unit_amount: amount }, quantity: 1 }],
      success_url: `${origin}/?donacion=gracias`,
      cancel_url: `${origin}/?donacion=cancelada`,
      submit_type: 'donate',
      metadata: { proyecto: 'revelatio-by-efata', tipo: 'apoyo-voluntario' },
    }, { idempotencyKey: `donation-${requestId}` });
    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('[v0] Stripe checkout error:', error.message);
    return res.status(500).json({ error: 'No se pudo iniciar el portal de apoyo.' });
  }
}
