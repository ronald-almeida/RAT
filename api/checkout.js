import { createPayment, paymentStatus, CheckoutError } from '../lib/payment.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  try {
    if (req.method === 'GET') {
      const token = /^Bearer (.+)$/.exec(req.headers.authorization || '')?.[1];
      return res.status(200).json(await paymentStatus(token));
    }
    if (req.method !== 'POST') { res.setHeader('Allow', 'GET, POST'); return res.status(405).json({ error: 'Método não permitido.' }); }
    const origin = process.env.SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? 'https://' + process.env.VERCEL_PROJECT_PRODUCTION_URL : 'http://localhost:3000');
    const allowed = new Set([origin, ...(process.env.VERCEL_URL ? ['https://' + process.env.VERCEL_URL] : [])]);
    if (!req.headers.origin || !allowed.has(req.headers.origin)) throw new CheckoutError('Origem da requisição inválida.', 403);
    if (!String(req.headers['content-type'] || '').startsWith('application/json')) throw new CheckoutError('Formato inválido.', 415);
    if (Number(req.headers['content-length'] || 0) > 12000) throw new CheckoutError('Requisição muito grande.', 413);
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (JSON.stringify(body || {}).length > 12000) throw new CheckoutError('Requisição muito grande.', 413);
    return res.status(200).json(await createPayment(body, origin));
  } catch (error) {
    const status = error instanceof CheckoutError ? error.status : 500;
    return res.status(status).json({ error: error instanceof CheckoutError ? error.message : 'Não foi possível concluir agora. Tente novamente.' });
  }
}
