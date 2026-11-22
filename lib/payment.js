import { createHmac, timingSafeEqual } from 'node:crypto';
import QRCode from 'qrcode';

export const AMOUNT = 247;
export const WHATSAPP = '5575988393742';
export const REFUND_URL = 'https://reembolso-de-alunos.vercel.app/';
export const PLANS = { safira: 'T8 RAT BLACK SAFIRA', gold: 'T8 RAT BLACK GOLD' };
const API = 'https://atlaspags.com/api/v1';

export class CheckoutError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}
export function validCPF(value) {
  const cpf = String(value || '').replace(/\D/g, '');
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  for (let n = 9; n < 11; n++) {
    let sum = 0;
    for (let i = 0; i < n; i++) sum += Number(cpf[i]) * (n + 1 - i);
    const digit = (sum * 10) % 11;
    if ((digit === 10 ? 0 : digit) !== Number(cpf[n])) return false;
  }
  return true;
}
export function validateOrder(body) {
  if (!body || typeof body !== 'object') throw new CheckoutError('Confira os dados da inscrição.');
  const name = String(body.name || '').trim().replace(/\s+/g, ' ');
  const email = String(body.email || '').trim().toLowerCase();
  const document = String(body.document || '').replace(/\D/g, '');
  let phone = String(body.phone || '').replace(/\D/g, '');
  if (phone.length === 10 || phone.length === 11) phone = '55' + phone;
  if (name.length < 3 || name.length > 120 || !name.includes(' ')) throw new CheckoutError('Informe seu nome completo.');
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new CheckoutError('Informe um e-mail válido.');
  if (!validCPF(document)) throw new CheckoutError('Confira o CPF informado.');
  if (!/^55[1-9]\d\d{8,9}$/.test(phone)) throw new CheckoutError('Informe seu WhatsApp com DDD.');
  if (!Object.hasOwn(PLANS, body.plan)) throw new CheckoutError('Selecione o programa.');
  if (body.deliveryAccepted !== true) throw new CheckoutError('Confirme o prazo de liberação do acesso.');
  if (!/^[a-f0-9-]{36}$/i.test(body.orderKey || '')) throw new CheckoutError('Atualize a página e tente novamente.');
  return { name, email, document, phone, plan: body.plan, orderKey: body.orderKey };
}
function secret(env) {
  if (!env.CHECKOUT_SESSION_SECRET || env.CHECKOUT_SESSION_SECRET.length < 32) throw new CheckoutError('O pagamento está temporariamente indisponível. Fale com o atendimento.', 503);
  return env.CHECKOUT_SESSION_SECRET;
}
function sign(value, env) { return createHmac('sha256', secret(env)).update(value).digest('base64url'); }
export function issueToken(id, plan, env = process.env, now = Date.now()) {
  const data = Buffer.from(JSON.stringify({ id, plan, exp: now + 90 * 86400000 })).toString('base64url');
  return data + '.' + sign(data, env);
}
export function verifyToken(token, env = process.env, now = Date.now()) {
  try {
    if (typeof token !== 'string' || token.length > 2000) throw Error();
    const parts = token.split('.');
    if (parts.length !== 2) throw Error();
    const [data, signature] = parts, expected = sign(data, env);
    if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) throw Error();
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString());
    if (!/^[a-zA-Z0-9_-]{1,150}$/.test(payload.id) || !Object.hasOwn(PLANS, payload.plan) || !Number.isFinite(payload.exp) || payload.exp < now) throw Error();
    return payload;
  } catch { throw new CheckoutError('Não encontramos uma sessão válida. Volte ao checkout ou fale com o atendimento.', 401); }
}
async function atlas(path, { method = 'GET', body, key } = {}, env = process.env, fetcher = fetch) {
  if (!env.ATLAS_SECRET_KEY) throw new CheckoutError('O pagamento está temporariamente indisponível. Fale com o atendimento.', 503);
  let response;
  try {
    response = await fetcher(API + path, {
      method, headers: { Authorization: `Bearer ${env.ATLAS_SECRET_KEY}`, ...(body ? { 'Content-Type': 'application/json', 'Idempotency-Key': key } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(20000)
    });
  } catch { throw new CheckoutError('Não foi possível consultar o pagamento agora. Tente novamente; seu pedido será mantido.', 502); }
  let data;
  try { data = await response.json(); } catch { throw new CheckoutError('O serviço de pagamento não respondeu. Tente novamente.', 502); }
  if (!response.ok) {
    const messages = { 400: 'O Pix não pôde ser criado. Confira os dados ou fale com o atendimento.', 409: 'Este pedido já está em processamento. Recarregue a página para acompanhar.', 422: 'Confira nome, e-mail e CPF antes de tentar novamente.', 429: 'Aguarde um minuto antes de tentar novamente.' };
    throw new CheckoutError(messages[response.status] || 'O serviço de pagamento está indisponível. Tente novamente mais tarde ou fale com o atendimento.', response.status === 429 ? 429 : response.status >= 500 || [401,403].includes(response.status) ? 503 : 400);
  }
  return data;
}
export function assertCharge(charge, plan) {
  if (!charge || Number(charge.amount) !== AMOUNT || charge.method !== 'pix' || charge.metadata?.checkout !== 'rat-v1' || charge.metadata?.plan !== plan || !charge.id) throw new CheckoutError('Não foi possível validar este pagamento. Fale com o atendimento.', 502);
  if (charge.livemode !== true) throw new CheckoutError('O pagamento ainda não está disponível em produção. Fale com o atendimento.', 503);
}
export async function createPayment(input, origin, env = process.env, fetcher = fetch) {
  secret(env);
  const order = validateOrder(input);
  const name = PLANS[order.plan];
  const externalId = 'rat-' + order.orderKey;
  const body = {
    amount: AMOUNT, method: 'pix', customer: { name: order.name, email: order.email, document: order.document, phone: order.phone },
    description: name, external_id: externalId,
    metadata: { checkout: 'rat-v1', plan: order.plan, access_delay: '48h', delivery_terms: '48h-v1' },
    checkout_url: origin + '/checkout', items: [{ name, quantity: 1, unit_amount: AMOUNT }]
  };
  const key = 'rat-' + sign(externalId + JSON.stringify(body), env);
  const charge = await atlas('/charges', { method: 'POST', body, key }, env, fetcher);
  assertCharge(charge, order.plan);
  if (!charge.pix?.code || !charge.pix?.expires_at || !Number.isFinite(Date.parse(charge.pix.expires_at))) throw new CheckoutError('O Pix ainda está sendo preparado. Tente novamente com os mesmos dados.', 502);
  return {
    token: issueToken(charge.id, order.plan, env), id: charge.id, amount: AMOUNT, plan: order.plan,
    status: charge.status, code: charge.pix.code,
    qr: await QRCode.toDataURL(charge.pix.code, { width: 360, margin: 3, errorCorrectionLevel: 'M' }),
    expiresAt: charge.pix.expires_at
  };
}
export async function paymentStatus(token, env = process.env, fetcher = fetch) {
  const session = verifyToken(token, env);
  const charge = await atlas('/charges/' + encodeURIComponent(session.id), {}, env, fetcher);
  assertCharge(charge, session.plan);
  if (charge.id !== session.id) throw new CheckoutError('Não foi possível validar este pedido.', 502);
  const paid = charge.status === 'paid' && Number(charge.refunded || 0) === 0;
  const paidAt = paid && Number.isFinite(Date.parse(charge.paid_at)) ? charge.paid_at : null;
  const text = `Olá! Quero receber as orientações de acesso ao ${PLANS[session.plan]}. Meu pedido é ${charge.id}.`;
  return { id: charge.id, status: charge.status, paid, amount: AMOUNT, plan: session.plan, product: PLANS[session.plan], paidAt,
    releaseAt: paidAt ? new Date(Date.parse(paidAt) + 48 * 3600000).toISOString() : null,
    whatsappUrl: 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(text), refundUrl: REFUND_URL,
    ...(paid ? { guideUrl: '/guia-de-boas-vindas.pdf' } : {})
  };
}
