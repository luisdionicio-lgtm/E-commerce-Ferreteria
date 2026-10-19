import { randomUUID } from 'node:crypto';
import type { Unit } from '../../shared/types.js';
import { ensure } from '../../shared/errors.js';
import { deduct, movement } from '../inventory/inventory.service.js';
export async function createOrder(u: Unit, input: any) {
  const quantities = new Map<string, number>();
  for (const item of input.items)
    quantities.set(item.productId, (quantities.get(item.productId) || 0) + item.quantity);
  input = {
    ...input,
    items: [...quantities].map(([productId, quantity]) => ({ productId, quantity })),
  };
  const id = randomUUID();
  let total = 0;
  const items = [];
  const today = new Date().toISOString().slice(0, 10);
  for (const item of input.items) {
    const p = await u.get('products', item.productId);
    ensure(p?.active, 'Producto no disponible');
    const available = (await u.all('lots'))
      .filter((l) => l.productId === p.id && (!l.expiresAt || l.expiresAt >= today))
      .reduce((n, l) => n + l.quantity, 0);
    ensure(available >= item.quantity, 'Cantidad superior al stock disponible', 409);
    total += p.price * item.quantity;
    items.push({
      id: randomUUID(),
      orderId: id,
      productId: p.id,
      quantity: item.quantity,
      price: p.price,
    });
  }
  ensure(Number.isSafeInteger(total) && total <= 2000000000, 'El total supera el límite permitido');
  const order = await u.create('orders', {
    id,
    customerName: input.customerName,
    phone: input.phone,
    email: input.email || '',
    address: input.address || '',
    status: 'PENDIENTE',
    total,
    createdAt: new Date().toISOString(),
  });
  for (const item of items) await u.create('orderItems', item);
  return order;
}
export async function createSale(u: Unit, input: any, userId: string) {
  const id = randomUUID();
  let total = 0;
  const items = [];
  if (input.customerId)
    ensure(await u.get('customers', input.customerId), 'Cliente no encontrado', 404);
  if (input.orderId) {
    const order = await u.get('orders', input.orderId);
    ensure(order && order.status === 'PENDIENTE', 'El pedido ya fue procesado', 409);
    const existing = await u.all('sales');
    ensure(!existing.some((s) => s.orderId === input.orderId), 'Pedido ya vendido', 409);
    input = {
      ...input,
      items: (await u.all('orderItems'))
        .filter((i) => i.orderId === input.orderId)
        .map((i) => ({ productId: i.productId, quantity: i.quantity })),
    };
  }
  for (const item of input.items) {
    const p = await u.get('products', item.productId);
    ensure(p?.active, 'Producto no disponible');
    await deduct(u, p.id, item.quantity, userId, id);
    total += p.price * item.quantity;
    items.push({
      id: randomUUID(),
      saleId: id,
      productId: p.id,
      quantity: item.quantity,
      price: p.price,
    });
  }
  ensure(Number.isSafeInteger(total) && total <= 2000000000, 'El total supera el límite permitido');
  const sale = await u.create('sales', {
    id,
    customerId: input.customerId || null,
    orderId: input.orderId || null,
    userId,
    status: 'CONFIRMADA',
    total,
    payment: input.payment || 'EFECTIVO',
    createdAt: new Date().toISOString(),
  });
  for (const item of items) await u.create('saleItems', item);
  if (input.orderId) await u.update('orders', input.orderId, { status: 'CONFIRMADO' });
  return sale;
}
export async function cancelSale(u: Unit, id: string, userId: string) {
  const sale = await u.get('sales', id);
  ensure(sale, 'Venta no encontrada', 404);
  ensure(sale.status === 'CONFIRMADA', 'La venta ya está anulada', 409);
  const outs = (await u.all('movements')).filter((m) => m.reference === id && m.type === 'SALIDA');
  for (const m of outs) {
    const lot = await u.get('lots', m.lotId);
    ensure(lot, 'Lote no encontrado', 404);
    await u.update('lots', lot.id, { quantity: lot.quantity - m.quantity });
    await movement(
      u,
      m.productId,
      m.lotId,
      'DEVOLUCION',
      -m.quantity,
      'Anulación de venta',
      userId,
      id,
    );
  }
  await u.update('sales', id, { status: 'ANULADA' });
  if (sale.orderId) await u.update('orders', sale.orderId, { status: 'ANULADO' });
  return { message: 'Venta anulada y stock devuelto' };
}
export async function createPurchase(u: Unit, input: any, userId: string) {
  ensure((await u.get('suppliers', input.supplierId))?.active, 'Proveedor no disponible');
  const id = randomUUID();
  let total = 0;
  for (const item of input.items) {
    ensure((await u.get('products', item.productId))?.active, 'Producto no disponible');
    total += item.cost * item.quantity;
  }
  ensure(Number.isSafeInteger(total) && total <= 2000000000, 'El total supera el límite permitido');
  const purchase = await u.create('purchases', {
    id,
    supplierId: input.supplierId,
    userId,
    status: 'PENDIENTE',
    total,
    createdAt: new Date().toISOString(),
  });
  for (const item of input.items)
    await u.create('purchaseItems', {
      id: randomUUID(),
      purchaseId: id,
      productId: item.productId,
      quantity: item.quantity,
      cost: item.cost,
      expiresAt: item.expiresAt || null,
    });
  return purchase;
}
export async function receivePurchase(u: Unit, id: string, userId: string) {
  const purchase = await u.get('purchases', id);
  ensure(purchase, 'Compra no encontrada', 404);
  ensure(purchase.status === 'PENDIENTE', 'La compra ya fue recibida', 409);
  for (const item of (await u.all('purchaseItems')).filter((i) => i.purchaseId === id)) {
    const lotId = randomUUID();
    await u.create('lots', {
      id: lotId,
      productId: item.productId,
      code: `REC-${id.slice(0, 8)}-${lotId.slice(0, 4)}`,
      quantity: item.quantity,
      cost: item.cost,
      expiresAt: item.expiresAt,
    });
    await movement(
      u,
      item.productId,
      lotId,
      'ENTRADA',
      item.quantity,
      'Compra recibida',
      userId,
      id,
    );
  }
  return u.update('purchases', id, { status: 'RECIBIDA' });
}
