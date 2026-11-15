import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID, randomBytes } from 'node:crypto';

test(
  'MySQL real: compras, recepción, stock, pedido, venta, rollback y roles',
  { skip: !process.env.MYSQL_TEST_URL },
  async () => {
    const url = new URL(process.env.MYSQL_TEST_URL!);
    assert.match(
      url.pathname,
      /^\/ferremax_course_verify_/,
      'Usa una base aislada de verificación',
    );
    process.env.DATA_DRIVER = 'mysql';
    process.env.DATABASE_URL = process.env.MYSQL_TEST_URL;
    process.env.JWT_SECRET ||= randomBytes(48).toString('hex');
    const { createRepository } = await import('../src/config/repository.js');
    const { createApp } = await import('../src/app.js');
    const { catalog } = await import('../src/modules/catalog/catalog.service.js');
    const { createPurchase, receivePurchase, createOrder, createSale, cancelSale } =
      await import('../src/modules/operations/operations.service.js');
    const { startPayment, simulatePayment } =
      await import('../src/modules/payments/payments.service.js');
    const { orderView } = await import('../src/modules/orders/orders.service.js');
    const repo = await createRepository();
    const id = 'verify-' + randomUUID();
    const server = createApp(repo).listen(0, '127.0.0.1');
    await new Promise<void>((resolve) => server.once('listening', resolve));
    try {
      await repo.transaction((u) =>
        u.create('products', {
          id,
          slug: id,
          sku: id,
          name: 'Producto de prueba MySQL',
          brand: 'DEMO',
          categoryId: 'cat-1',
          price: 2000,
          minStock: 0,
          unit: 'unidad',
          image: '/images/reference/drill-bosch.jpg',
          description: 'Solo verificación aislada',
          active: true,
          featured: false,
        }),
      );
      const purchase = await repo.transaction((u) =>
        createPurchase(
          u,
          {
            supplierId: 'sup-1',
            items: [{ productId: id, quantity: 3, cost: 1000, expiresAt: null }],
          },
          'admin',
        ),
      );
      await repo.transaction((u) => receivePurchase(u, purchase.id, 'admin'));
      await assert.rejects(repo.transaction((u) => receivePurchase(u, purchase.id, 'admin')));
      const stock = async () =>
        (await repo.read((u) => catalog(u, true))).find((p) => p.id === id)!.availableStock;
      assert.equal(await stock(), 3);
      await assert.rejects(
        repo.transaction((u) =>
          createSale(u, { items: [{ productId: id, quantity: 4 }], payment: 'EFECTIVO' }, 'admin'),
        ),
      );
      assert.equal(await stock(), 3);
      const order = await repo.transaction((u) =>
        createOrder(u, {
          customerName: 'Prueba MySQL',
          phone: '999123456',
          items: [{ productId: id, quantity: 1 }],
        }),
      );
      assert.equal(await stock(), 3);
      const sale = await repo.transaction((u) =>
        createSale(u, { orderId: order.id, items: [], payment: 'EFECTIVO' }, 'admin'),
      );
      assert.equal(await stock(), 2);
      await assert.rejects(
        repo.transaction((u) =>
          createSale(u, { orderId: order.id, items: [], payment: 'EFECTIVO' }, 'admin'),
        ),
      );
      await repo.transaction((u) => cancelSale(u, sale.id, 'admin'));
      assert.equal(await stock(), 3);
      const paymentConfig = {
        mode: 'demo' as const,
        merchantName: 'Prueba MySQL',
        merchantPhone: '',
        qrPayload: '',
        origin: 'http://localhost:5173',
        production: false,
      };
      const owned = await repo.transaction((u) =>
        createOrder(
          u,
          {
            customerName: 'Pago de prueba MySQL',
            phone: '999123456',
            items: [{ productId: id, quantity: 1 }],
          },
          'admin',
        ),
      );
      await repo.transaction((u) => startPayment(u, owned.id, 'admin', paymentConfig));
      await Promise.all(
        [1, 2].map(() =>
          repo.transaction((u) => simulatePayment(u, owned.id, 'admin', 'approved', paymentConfig)),
        ),
      );
      assert.equal(await stock(), 2);
      const paid = await repo.read(async (u) => orderView(u, (await u.get('orders', owned.id))!));
      assert.equal(paid.payment?.status, 'APROBADO');
      const paymentSales = await repo.read(async (u) =>
        (await u.all('sales')).filter((row) => row.orderId === owned.id),
      );
      assert.equal(paymentSales.length, 1);
      await repo.transaction((u) => cancelSale(u, paymentSales[0].id, 'admin'));
      assert.equal(await stock(), 3);
      const base = `http://127.0.0.1:${(server.address() as any).port}/api`;
      const response = await fetch(base + '/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Cliente MySQL',
          email: `${id}@example.test`,
          password: 'PruebaMySQL2026!',
        }),
      });
      assert.equal(response.status, 201);
      const session = await response.json();
      assert.equal(session.user.role, 'CUSTOMER');
      assert.equal(
        (
          await fetch(base + '/admin/products', {
            headers: { Authorization: `Bearer ${session.accessToken}` },
          })
        ).status,
        403,
      );
    } finally {
      await repo.transaction(async (u) => {
        if (await u.get('products', id)) await u.update('products', id, { active: false });
      });
      await new Promise<void>((resolve, reject) =>
        server.close((e) => (e ? reject(e) : resolve())),
      );
      await repo.close?.();
    }
  },
);
