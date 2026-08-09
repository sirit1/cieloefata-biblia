import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const signature = req.headers['stripe-signature'];
  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) return res.status(400).json({ error: 'Webhook no configurado.' });
  const rawBody = req.rawBody || await new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
  try {
    const event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
    if (event.type === 'checkout.session.completed') {
      console.log('[v0] Donación confirmada:', event.data.object.id);
    }
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('[v0] Stripe webhook error:', error.message);
    return res.status(400).json({ error: 'Firma de webhook inválida.' });
  }
}
