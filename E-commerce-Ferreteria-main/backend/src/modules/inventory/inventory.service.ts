import { randomUUID } from 'node:crypto';
import type { Unit } from '../../shared/types.js';
import { ensure } from '../../shared/errors.js';
export async function movement(
  u: Unit,
  productId: string,
  lotId: string,
  type: string,
  quantity: number,
  reason: string,
  userId: string,
  reference: string,
) {
  return u.create('movements', {
    id: randomUUID(),
    productId,
    lotId,
    type,
    quantity,
    reason,
    userId,
    reference,
    createdAt: new Date().toISOString(),
  });
}
export async function deduct(
  u: Unit,
  productId: string,
  quantity: number,
  userId: string,
  reference: string,
) {
  const today = new Date().toISOString().slice(0, 10);
  const lots = (await u.all('lots'))
    .filter(
      (l) => l.productId === productId && l.quantity > 0 && (!l.expiresAt || l.expiresAt >= today),
    )
    .sort((a, b) => (a.expiresAt || '9999').localeCompare(b.expiresAt || '9999'));
  ensure(
    lots.reduce((n, l) => n + l.quantity, 0) >= quantity,
    'Stock insuficiente o lotes vencidos',
    409,
  );
  let left = quantity;
  for (const lot of lots) {
    if (!left) break;
    const take = Math.min(lot.quantity, left);
    await u.update('lots', lot.id, { quantity: lot.quantity - take });
    await movement(u, productId, lot.id, 'SALIDA', -take, 'Venta confirmada', userId, reference);
    left -= take;
  }
}
export async function adjust(u: Unit, input: any, userId: string) {
  const lot = await u.get('lots', input.lotId);
  ensure(lot, 'Lote no encontrado', 404);
  ensure(lot.quantity + input.delta >= 0, 'El ajuste dejaría stock negativo');
  await u.update('lots', lot.id, { quantity: lot.quantity + input.delta });
  await movement(
    u,
    lot.productId,
    lot.id,
    'AJUSTE',
    input.delta,
    input.reason,
    userId,
    randomUUID(),
  );
  return { message: 'Stock actualizado' };
}
