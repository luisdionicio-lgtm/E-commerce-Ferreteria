import { randomUUID } from 'node:crypto';
import QRCode from 'qrcode';
import type { Unit } from '../../shared/types.js';
import { ensure } from '../../shared/errors.js';
import { ownedOrder, orderView } from '../orders/orders.service.js';
import { createSale } from '../operations/operations.service.js';
import { paymentForOrder, paymentSummary } from './payment-lifecycle.js';
import type { PaymentConfig } from './payment.config.js';

async function audit(u: Unit, actorId: string, action: string, paymentId: string) {
  await u.create('auditLogs', {
    id: randomUUID(),
    userId: actorId,
    action,
    entity: 'payments',
    entityId: paymentId,
    createdAt: new Date().toISOString(),
  });
}
export async function startPayment(
  u: Unit,
  orderId: string,
  userId: string,
  config: PaymentConfig,
) {
  ensure(config.mode !== 'disabled', 'Los pagos no están habilitados', 409);
  const order = await ownedOrder(u, orderId, userId);
  const existing = await paymentForOrder(u, orderId);
  if (existing) return existing;
  ensure(order.status === 'PENDIENTE', 'Este pedido ya fue procesado', 409);
  ensure(order.total > 0, 'Importe de pedido inválido', 409);
  const now = new Date().toISOString();
  const payment = await u.create('payments', {
    id: randomUUID(),
    orderId,
    method: 'YAPE',
    mode: config.mode,
    status: 'CREADO',
    amount: order.total,
    currency: 'PEN',
    reference: null,
    refundReference: null,
    reviewNote: '',
    reviewedBy: null,
    createdAt: now,
    updatedAt: now,
  });
  await audit(u, userId, 'INICIAR_PAGO', payment.id);
  return payment;
}
export async function paymentScreen(
  u: Unit,
  orderId: string,
  userId: string,
  config: PaymentConfig,
) {
  const order = await ownedOrder(u, orderId, userId);
  const payment = await paymentForOrder(u, orderId);
  ensure(payment, 'Primero inicia el pago de este pedido', 404);
  const canPay = order.status === 'PENDIENTE' && ['CREADO', 'RECHAZADO'].includes(payment.status);
  // Un QR demo abre esta misma pantalla privada. Nunca imita un QR bancario.
  const payload =
    payment.mode === 'demo' && config.mode === 'demo' && !config.production
      ? `${config.origin}/mis-pedidos/${encodeURIComponent(order.id)}/pago?demo=1`
      : payment.mode === 'manual' && config.mode === 'manual'
        ? config.qrPayload
        : '';
  const qr =
    canPay && payload
      ? await QRCode.toDataURL(payload, {
          width: 320,
          margin: 4,
          errorCorrectionLevel: 'M',
          color: { dark: '#19241f', light: '#ffffff' },
        })
      : null;
  return {
    order: await orderView(u, order),
    payment: paymentSummary(payment),
    qr,
    merchant: {
      name: payment.mode === 'demo' ? 'FerreMax · demostración' : config.merchantName,
      phone: payment.mode === 'manual' ? config.merchantPhone : '',
    },
    canPay: Boolean(canPay && payload),
    demo: payment.mode === 'demo',
  };
}
export async function reportPayment(
  u: Unit,
  orderId: string,
  userId: string,
  reference: string,
  config: PaymentConfig,
) {
  reference = reference.toUpperCase();
  const order = await ownedOrder(u, orderId, userId);
  ensure(order.status === 'PENDIENTE', 'Pedido ya procesado', 409);
  const payment = await paymentForOrder(u, orderId);
  ensure(
    config.mode !== 'disabled' && (!config.production || payment?.mode !== 'demo'),
    'Este pago no está habilitado',
    403,
  );
  ensure(
    payment && ['CREADO', 'RECHAZADO'].includes(payment.status),
    'Este pago ya está en revisión o fue procesado',
    409,
  );
  ensure(
    !(await u.all('payments')).some(
      (row) => row.id !== payment.id && row.mode === payment.mode && row.reference === reference,
    ),
    'La operación ya fue registrada',
    409,
  );
  await audit(u, userId, 'REPORTAR_PAGO', payment.id);
  return u.update('payments', payment.id, {
    reference,
    status: 'EN_REVISION',
    reviewNote: '',
    updatedAt: new Date().toISOString(),
  });
}
export async function approvePayment(
  u: Unit,
  id: string,
  actorId: string,
  demo = false,
  note = '',
) {
  const payment = await u.get('payments', id);
  ensure(payment, 'Pago no encontrado', 404);
  if (payment.status === 'APROBADO') return payment;
  ensure(payment.mode === 'demo' || payment.reference, 'Falta la referencia de la operación', 409);
  ensure(
    demo
      ? ['CREADO', 'EN_REVISION', 'RECHAZADO'].includes(payment.status)
      : payment.status === 'EN_REVISION',
    'El pago no está disponible para confirmar',
    409,
  );
  const order = await u.get('orders', payment.orderId);
  ensure(order && order.total === payment.amount, 'El importe del pedido no coincide', 409);
  // Pago, venta y salida de inventario se confirman en la misma transacción.
  const sale = await createSale(
    u,
    { orderId: order.id, items: [], payment: 'YAPE' },
    actorId,
    payment.id,
  );
  ensure(sale.total === payment.amount, 'La venta no coincide con el importe del pago', 409);
  await audit(u, actorId, demo ? 'SIMULAR_PAGO_APROBADO' : 'VERIFICAR_PAGO', id);
  return u.update('payments', id, {
    status: 'APROBADO',
    reference: payment.reference || `DEMO-${randomUUID()}`,
    reviewedBy: actorId,
    reviewNote:
      payment.mode === 'demo'
        ? `${note || 'Aprobación simulada.'} No se transfirió dinero.`
        : note || 'Verificado manualmente por el personal.',
    updatedAt: new Date().toISOString(),
  });
}
export async function simulatePayment(
  u: Unit,
  orderId: string,
  userId: string,
  outcome: 'approved' | 'rejected',
  config: PaymentConfig,
) {
  ensure(!config.production && config.mode === 'demo', 'La simulación no está disponible', 403);
  await ownedOrder(u, orderId, userId);
  const payment = await paymentForOrder(u, orderId);
  ensure(payment?.mode === 'demo', 'Este pago no es una demostración', 409);
  if (outcome === 'approved') return approvePayment(u, payment.id, userId, true);
  ensure(['CREADO', 'RECHAZADO'].includes(payment.status), 'El pago ya fue procesado', 409);
  await audit(u, userId, 'SIMULAR_PAGO_RECHAZADO', payment.id);
  return u.update('payments', payment.id, {
    status: 'RECHAZADO',
    reviewNote: 'Rechazo simulado. Puedes volver a intentarlo.',
    updatedAt: new Date().toISOString(),
  });
}
export async function reviewPayment(
  u: Unit,
  id: string,
  actorId: string,
  decision: 'approve' | 'reject',
  note: string,
  production = false,
) {
  const currentPayment = await u.get('payments', id);
  ensure(
    !production || currentPayment?.mode !== 'demo',
    'Los pagos demo no se procesan en producción',
    403,
  );
  if (decision === 'approve') return approvePayment(u, id, actorId, false, note);
  const payment = await u.get('payments', id);
  ensure(payment?.status === 'EN_REVISION', 'Este pago no está en revisión', 409);
  await audit(u, actorId, 'RECHAZAR_PAGO', id);
  return u.update('payments', id, {
    status: 'RECHAZADO',
    reviewedBy: actorId,
    reviewNote: note,
    updatedAt: new Date().toISOString(),
  });
}
