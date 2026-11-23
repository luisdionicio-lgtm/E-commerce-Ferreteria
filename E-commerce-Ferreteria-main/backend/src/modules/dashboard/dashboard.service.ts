import type { Unit } from '../../shared/types.js';
import { catalog } from '../catalog/catalog.service.js';
export async function dashboard(u: Unit) {
  const products = (await catalog(u, true)).filter((p) => p.active);
  const sales = (await u.all('sales')).filter((s) => s.status === 'CONFIRMADA');
  const orders = await u.all('orders');
  const lots = await u.all('lots');
  const today = new Date().toISOString().slice(0, 10);
  const end = new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10);
  const expiring = lots
    .filter((l) => l.expiresAt && l.expiresAt <= end && l.quantity > 0)
    .map((l) => ({
      ...l,
      product: products.find((p) => p.id === l.productId)?.name,
      expired: l.expiresAt < today,
    }));
  const low = products.filter((p) => p.availableStock <= p.minStock);
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(Date.now() - (6 - i) * 86400000).toISOString().slice(0, 10);
    return {
      date,
      label: new Date(date + 'T12:00:00').toLocaleDateString('es-PE', {
        weekday: 'short',
        timeZone: 'UTC',
      }),
      total:
        sales.filter((s) => s.createdAt.startsWith(date)).reduce((n, s) => n + s.total, 0) / 100,
    };
  });
  return {
    revenue: sales.reduce((n, s) => n + s.total, 0),
    todayRevenue: sales
      .filter((s) => s.createdAt.startsWith(today))
      .reduce((n, s) => n + s.total, 0),
    salesCount: sales.length,
    productCount: products.length,
    inventoryValue: lots.reduce((n, l) => n + l.cost * l.quantity, 0),
    pendingOrders: orders.filter((o) => o.status === 'PENDIENTE').length,
    low,
    expiring,
    days,
    recentSales: sales.slice(-5).reverse(),
  };
}
