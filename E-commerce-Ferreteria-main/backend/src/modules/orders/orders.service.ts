import type { Row, Unit } from '../../shared/types.js';
import { ensure } from '../../shared/errors.js';
import {
  paymentForOrder,
  paymentSummary,
  cancelOrderPayment,
} from '../payments/payment-lifecycle.js';

export async function ownedOrder(u: Unit, id: string, userId: string) {
  const order = await u.get('orders', id);
  ensure(order && order.userId === userId, 'Pedido no encontrado', 404);
  return order;
}

export async function orderView(u: Unit, order: Row) {
  const products = new Map((await u.all('products')).map((product) => [product.id, product]));
  const items = (await u.all('orderItems'))
    .filter((item) => item.orderId === order.id)
    .map((item) => ({
      id: item.id,
      productId: item.productId,
      name: item.productName || products.get(item.productId)?.name || 'Producto del pedido',
      image: item.productImage || products.get(item.productId)?.image || '/images/mark.svg',
      quantity: item.quantity,
      price: item.price,
      subtotal: item.quantity * item.price,
    }));
  return {
    id: order.id,
    customerName: order.customerName,
    phone: order.phone,
    email: order.email,
    address: order.address,
    status: order.status,
    fulfillmentStatus: order.fulfillmentStatus || 'POR_PREPARAR',
    total: order.total,
    payment: paymentSummary(await paymentForOrder(u, order.id)),
    createdAt: order.createdAt,
    items,
  };
}

export async function cancelCustomerOrder(u: Unit, id: string, userId: string) {
  const order = await ownedOrder(u, id, userId);
  ensure(order.status === 'PENDIENTE', 'Solo puedes cancelar pedidos pendientes', 409);
  const payment = await paymentForOrder(u, id);
  ensure(
    !payment || !['EN_REVISION', 'APROBADO', 'REEMBOLSO_PENDIENTE'].includes(payment.status),
    'El pago requiere revisión de la tienda antes de cancelar',
    409,
  );
  await cancelOrderPayment(u, id);
  return u.update('orders', id, { status: 'ANULADO' });
}

export async function customerOrders(u: Unit, userId: string, page: number) {
  const all = (await u.all('orders'))
    .filter((order) => order.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id));
  const pageSize = 12;
  const orders = await Promise.all(
    all.slice((page - 1) * pageSize, page * pageSize).map((order) => orderView(u, order)),
  );
  return { orders, total: all.length, page, pageSize };
}
