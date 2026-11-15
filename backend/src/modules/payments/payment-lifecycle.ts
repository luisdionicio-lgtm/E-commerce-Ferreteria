import type { Unit, Row } from '../../shared/types.js';

export function paymentSummary(payment?: Row) {
  return payment
    ? {
        id: payment.id,
        method: payment.method,
        mode: payment.mode,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        reference: payment.reference,
        reviewNote: payment.reviewNote,
        refundReference: payment.refundReference,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
      }
    : null;
}

export async function paymentForOrder(u: Unit, orderId: string) {
  return (await u.all('payments')).find((payment) => payment.orderId === orderId);
}
export async function cancelOrderPayment(u: Unit, orderId: string) {
  const payment = await paymentForOrder(u, orderId);
  if (!payment || ['CANCELADO', 'REEMBOLSADO'].includes(payment.status)) return;
  await u.update('payments', payment.id, {
    status: payment.status === 'APROBADO' ? 'REEMBOLSO_PENDIENTE' : 'CANCELADO',
    reviewNote:
      payment.status === 'APROBADO'
        ? 'La venta fue anulada. La tienda debe resolver la devolución.'
        : 'El pedido se canceló antes de confirmar el pago.',
    updatedAt: new Date().toISOString(),
  });
}
