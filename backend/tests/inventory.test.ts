import test from 'node:test';
import assert from 'node:assert/strict';
import { JsonRepository } from '../src/config/repository.js';
import { seedData } from '../src/config/seed-data.js';
import {
  createSale,
  cancelSale,
  createPurchase,
  receivePurchase,
  createOrder,
} from '../src/modules/operations/operations.service.js';
import { catalog } from '../src/modules/catalog/catalog.service.js';
import { adjust } from '../src/modules/inventory/inventory.service.js';
const fixture = async () => new JsonRepository(await seedData());
test('venta recalcula total y anulación restaura exactamente los lotes', async () => {
  const repo = await fixture();
  const before = await repo.read((u) => catalog(u, true));
  const p = before[0];
  const s = await repo.transaction((u) =>
    createSale(
      u,
      { items: [{ productId: p.id, quantity: 2, price: 1 }], payment: 'YAPE' },
      'admin',
    ),
  );
  assert.equal(s.total, p.price * 2);
  assert.equal((await repo.read((u) => catalog(u, true)))[0].stock, p.stock - 2);
  await repo.transaction((u) => cancelSale(u, s.id, 'admin'));
  assert.equal((await repo.read((u) => catalog(u, true)))[0].stock, p.stock);
  await assert.rejects(
    repo.transaction((u) => cancelSale(u, s.id, 'admin')),
    /ya está anulada/,
  );
});
test('stock insuficiente revierte todas las líneas y no crea venta parcial', async () => {
  const repo = await fixture();
  const before = await repo.read((u) => catalog(u, true));
  const sales = await repo.read((u) => u.all('sales'));
  await assert.rejects(
    repo.transaction((u) =>
      createSale(
        u,
        {
          items: [
            { productId: before[0].id, quantity: 1 },
            { productId: before[1].id, quantity: 9999 },
          ],
        },
        'admin',
      ),
    ),
    /Stock insuficiente/,
  );
  assert.equal((await repo.read((u) => catalog(u, true)))[0].stock, before[0].stock);
  assert.equal((await repo.read((u) => u.all('sales'))).length, sales.length);
});
test('dos ventas concurrentes no sobrevenden', async () => {
  const repo = await fixture();
  const p = (await repo.read((u) => catalog(u, true)))[0];
  const results = await Promise.allSettled([
    repo.transaction((u) =>
      createSale(u, { items: [{ productId: p.id, quantity: p.availableStock }] }, 'admin'),
    ),
    repo.transaction((u) =>
      createSale(u, { items: [{ productId: p.id, quantity: p.availableStock }] }, 'admin'),
    ),
  ]);
  assert.equal(results.filter((x) => x.status === 'fulfilled').length, 1);
  assert.equal((await repo.read((u) => catalog(u, true)))[0].stock, 0);
});
test('compra pendiente no cambia stock, recibir una vez crea lote', async () => {
  const repo = await fixture();
  const p = (await repo.read((u) => catalog(u, true)))[0];
  const purchase = await repo.transaction((u) =>
    createPurchase(
      u,
      {
        supplierId: 'sup-1',
        items: [{ productId: p.id, quantity: 5, cost: 25000, expiresAt: null }],
      },
      'admin',
    ),
  );
  assert.equal((await repo.read((u) => catalog(u, true)))[0].stock, p.stock);
  await repo.transaction((u) => receivePurchase(u, purchase.id, 'admin'));
  assert.equal((await repo.read((u) => catalog(u, true)))[0].stock, p.stock + 5);
  await assert.rejects(
    repo.transaction((u) => receivePurchase(u, purchase.id, 'admin')),
    /ya fue recibida/,
  );
});
test('lotes vencidos quedan fuera de stock vendible y venta', async () => {
  const repo = await fixture();
  await repo.transaction((u) => u.update('lots', 'lot-1', { expiresAt: '2020-01-01' }));
  const p = (await repo.read((u) => catalog(u, true)))[0];
  assert.ok(p.stock > 0);
  assert.equal(p.availableStock, 0);
  await assert.rejects(
    repo.transaction((u) => createSale(u, { items: [{ productId: p.id, quantity: 1 }] }, 'admin')),
    /Stock insuficiente/,
  );
});
test('pedido no descuenta stock y no puede confirmarse dos veces', async () => {
  const repo = await fixture();
  const p = (await repo.read((u) => catalog(u, true)))[0];
  const order = await repo.transaction((u) =>
    createOrder(u, {
      customerName: 'Cliente prueba',
      phone: '999123456',
      items: [{ productId: p.id, quantity: 1 }],
    }),
  );
  assert.equal((await repo.read((u) => catalog(u, true)))[0].stock, p.stock);
  await repo.transaction((u) => createSale(u, { orderId: order.id, items: [] }, 'admin'));
  assert.equal((await repo.read((u) => catalog(u, true)))[0].stock, p.stock - 1);
  await assert.rejects(
    repo.transaction((u) => createSale(u, { orderId: order.id, items: [] }, 'admin')),
    /ya fue procesado/,
  );
});
test('ajuste negativo no permite existencias negativas', async () => {
  const repo = await fixture();
  await assert.rejects(
    repo.transaction((u) =>
      adjust(u, { lotId: 'lot-1', delta: -99999, reason: 'Prueba conteo' }, 'admin'),
    ),
    /stock negativo/,
  );
});
