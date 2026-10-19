import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { JsonRepository } from '../src/config/repository.js';
import { seedData } from '../src/config/seed-data.js';
test('API: login, roles, validación, cookie rotativa y catálogo público', async () => {
  const repo = new JsonRepository(await seedData());
  const server = createApp(repo).listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const port = (server.address() as any).port;
  const url = `http://127.0.0.1:${port}/api`;
  try {
    let response = await fetch(url + '/admin/products');
    assert.equal(response.status, 401);
    response = await fetch(url + '/catalog/products');
    assert.equal(response.status, 200);
    assert.ok((await response.json()).length >= 12);
    response = await fetch(url + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'empleado@ferremax.pe', password: 'Empleado2026!' }),
    });
    assert.equal(response.status, 200);
    const session = await response.json();
    assert.equal(session.user.role, 'EMPLOYEE');
    assert.ok(!session.user.passwordHash);
    const cookie = response.headers.get('set-cookie')!.split(';')[0];
    assert.match(response.headers.get('set-cookie')!, /HttpOnly/);
    const headers = {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + session.accessToken,
    };
    response = await fetch(url + '/admin/users', { headers });
    assert.equal(response.status, 403);
    response = await fetch(url + '/admin/products', { method: 'POST', headers, body: '{}' });
    assert.equal(response.status, 403);
    response = await fetch(url + '/admin/sales', {
      method: 'POST',
      headers,
      body: JSON.stringify({ items: [{ productId: 'prod-1', quantity: -1 }] }),
    });
    assert.equal(response.status, 400);
    response = await fetch(url + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@ferremax.pe', password: 'FerreMax2026!' }),
    });
    const admin = await response.json();
    response = await fetch(url + '/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Cliente API',
        phone: '999123456',
        items: [{ productId: 'prod-1', quantity: 1 }],
      }),
    });
    assert.equal(response.status, 201);
    const order = await response.json();
    response = await fetch(url + '/admin/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + admin.accessToken },
      body: JSON.stringify({ orderId: order.id, items: [], payment: 'EFECTIVO' }),
    });
    assert.equal(response.status, 201);
    response = await fetch(url + '/auth/refresh', { method: 'POST', headers: { Cookie: cookie } });
    assert.equal(response.status, 200);
    response = await fetch(url + '/auth/refresh', { method: 'POST', headers: { Cookie: cookie } });
    assert.equal(response.status, 401);
    response = await fetch(url + '/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'https://otro-dominio.example' },
      body: '{}',
    });
    assert.equal(response.status, 403);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((e) => (e ? reject(e) : resolve())));
  }
});
