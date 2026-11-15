import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { JsonRepository } from '../src/config/repository.js';
import { seedData } from '../src/config/seed-data.js';
import { paymentConfig, type PaymentConfig } from '../src/modules/payments/payment.config.js';
import { createSale } from '../src/modules/operations/operations.service.js';

async function fixture(mode: 'demo' | 'manual' = 'demo') {
  const repo = new JsonRepository(await seedData());
  const config: PaymentConfig = {
    mode,
    merchantName: 'Comercio de prueba',
    merchantPhone: '',
    qrPayload: mode === 'manual' ? 'QR-DE-PRUEBA-NO-BANCARIO' : '',
    origin: 'http://localhost:5173',
    production: false,
  };
  const server = createApp(repo, { payments: config }).listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const url = `http://127.0.0.1:${(server.address() as { port: number }).port}/api`;
  const call = (path: string, token = '', body?: unknown) =>
    fetch(url + path, {
      method: body === undefined ? 'GET' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  const owner = await (
    await call('/auth/register', '', {
      name: 'Cliente de pagos',
      email: 'pagos@example.test',
      password: 'PruebaPagos2026!',
    })
  ).json();
  const admin = await (
    await call('/auth/login', '', { email: 'admin@ferremax.pe', password: 'FerreMax2026!' })
  ).json();
  const order = async () =>
    (
      await call('/orders', owner.accessToken, {
        customerName: 'Cliente de pagos',
        phone: '999123456',
        items: [{ productId: 'prod-1', quantity: 1 }],
      })
    ).json();
  return {
    repo,
    config,
    call,
    owner,
    admin,
    order,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}

test('Pago demo: QR privado, importe inmutable, confirmación concurrente y devolución', async () => {
  const f = await fixture();
  try {
    const order = await f.order();
    const path = `/me/orders/${order.id}/payment`;
    assert.equal((await f.call(path, '', {})).status, 401);
    assert.equal((await f.call(path, f.owner.accessToken, { amount: 1 })).status, 400);
    const payment = await (await f.call(path, f.owner.accessToken, {})).json();
    assert.equal(payment.amount, 47990);
    assert.equal(
      (await f.call('/admin/sales', f.admin.accessToken, { orderId: order.id, items: [] })).status,
      409,
    );
    const screen = await (await f.call(path, f.owner.accessToken)).json();
    assert.equal(screen.demo, true);
    assert.match(screen.qr, /^data:image\/png;base64,/);
    assert.equal(
      (
        await f.call(`/admin/payments/${payment.id}/review`, f.owner.accessToken, {
          decision: 'approve',
          note: 'Intento no autorizado',
        })
      ).status,
      403,
    );
    await f.repo.transaction((u) => u.update('products', 'prod-1', { price: 99999 }));
    const approvals = await Promise.all(
      [1, 2].map(() => f.call(path + '/simulate', f.owner.accessToken, { outcome: 'approved' })),
    );
    assert.deepEqual(
      approvals.map((r) => r.status),
      [200, 200],
    );
    const sales = await f.repo.read(async (u) =>
      (await u.all('sales')).filter((sale) => sale.orderId === order.id),
    );
    assert.equal(sales.length, 1);
    assert.equal(sales[0].total, 47990);
    assert.equal(
      (await f.call(path + '/simulate', f.owner.accessToken, { outcome: 'rejected' })).status,
      409,
    );
    await f.call(`/admin/sales/${sales[0].id}/cancel`, f.admin.accessToken, {});
    const pending = await (await f.call(`/me/orders/${order.id}`, f.owner.accessToken)).json();
    assert.equal(pending.payment.status, 'REEMBOLSO_PENDIENTE');
    assert.equal(
      (await f.call(`/admin/payments/${payment.id}/refund`, f.admin.accessToken, {})).status,
      200,
    );
    assert.equal(
      (await f.call(`/admin/payments/${payment.id}/refund`, f.admin.accessToken, {})).status,
      409,
    );
    assert.equal(
      (await (await f.call(`/me/orders/${order.id}`, f.owner.accessToken)).json()).payment.status,
      'REEMBOLSADO',
    );
  } finally {
    await f.close();
  }
});

test('Pago: stock insuficiente revierte la aprobación completa y la venta', async () => {
  const f = await fixture();
  try {
    const order = await f.order();
    const path = `/me/orders/${order.id}/payment`;
    await f.call(path, f.owner.accessToken, {});
    const remaining = await f.repo.read(async (u) =>
      (await u.all('lots'))
        .filter((lot) => lot.productId === 'prod-1')
        .reduce((sum, lot) => sum + lot.quantity, 0),
    );
    await f.repo.transaction((u) =>
      createSale(u, { items: [{ productId: 'prod-1', quantity: remaining }] }, 'admin'),
    );
    assert.equal(
      (await f.call(path + '/simulate', f.owner.accessToken, { outcome: 'approved' })).status,
      409,
    );
    const detail = await (await f.call(`/me/orders/${order.id}`, f.owner.accessToken)).json();
    assert.equal(detail.status, 'PENDIENTE');
    assert.equal(detail.payment.status, 'CREADO');
    assert.equal(
      (
        await f.repo.read(async (u) =>
          (await u.all('sales')).filter((sale) => sale.orderId === order.id),
        )
      ).length,
      0,
    );
  } finally {
    await f.close();
  }
});

test('QR manual: solo reportar no aprueba; revisión administrativa, rechazo y referencia única', async () => {
  const f = await fixture('manual');
  try {
    const order = await f.order();
    const path = `/me/orders/${order.id}/payment`;
    const payment = await (await f.call(path, f.owner.accessToken, {})).json();
    assert.equal(
      (await f.call(path + '/simulate', f.owner.accessToken, { outcome: 'approved' })).status,
      403,
    );
    assert.equal(
      (await f.call(path + '/report', f.owner.accessToken, { reference: 'OPERACION-123456' }))
        .status,
      200,
    );
    assert.equal(
      (await (await f.call(`/me/orders/${order.id}`, f.owner.accessToken)).json()).status,
      'PENDIENTE',
    );
    const employee = await (
      await f.call('/auth/login', '', { email: 'empleado@ferremax.pe', password: 'Empleado2026!' })
    ).json();
    assert.equal(
      (
        await f.call(`/admin/payments/${payment.id}/review`, employee.accessToken, {
          decision: 'approve',
          note: 'Revisado en cuenta',
        })
      ).status,
      403,
    );
    const other = await f.order();
    await f.call(`/me/orders/${other.id}/payment`, f.owner.accessToken, {});
    assert.equal(
      (
        await f.call(`/me/orders/${other.id}/payment/report`, f.owner.accessToken, {
          reference: 'OPERACION-123456',
        })
      ).status,
      409,
    );
    assert.equal(
      (await f.call(`/me/orders/${order.id}/cancel`, f.owner.accessToken, {})).status,
      409,
    );
    assert.equal(
      (
        await f.call(`/admin/payments/${payment.id}/review`, f.admin.accessToken, {
          decision: 'reject',
          note: 'La operación no corresponde al importe',
        })
      ).status,
      200,
    );
    await f.call(path + '/report', f.owner.accessToken, { reference: 'OPERACION-654321' });
    assert.equal(
      (
        await f.call(`/admin/payments/${payment.id}/review`, f.admin.accessToken, {
          decision: 'approve',
          note: 'Verificado en cuenta del comercio',
        })
      ).status,
      200,
    );
    const detail = await (await f.call(`/me/orders/${order.id}`, f.owner.accessToken)).json();
    assert.equal(detail.payment.status, 'APROBADO');
    assert.equal(detail.status, 'CONFIRMADO');
  } finally {
    await f.close();
  }
});

test('Configuración: simulación bloqueada en producción y QR comercial obligatorio', () => {
  assert.throws(() => paymentConfig({ PAYMENT_MODE: 'demo' }, true), /producción/);
  assert.throws(() => paymentConfig({ PAYMENT_MODE: 'manual' }, false), /YAPE_QR_PAYLOAD/);
  assert.equal(paymentConfig({}, true).mode, 'disabled');
});
