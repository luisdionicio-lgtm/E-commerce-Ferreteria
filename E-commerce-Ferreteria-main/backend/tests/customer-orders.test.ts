import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { JsonRepository } from '../src/config/repository.js';
import { seedData } from '../src/config/seed-data.js';

test('Mis pedidos: propiedad por sesión, historial privado e instantáneas de producto', async () => {
  const repo = new JsonRepository(await seedData());
  const server = createApp(repo).listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${(server.address() as { port: number }).port}/api`;
  const post = (path: string, body: unknown, token = '') =>
    fetch(base + path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
  const get = (path: string, token = '') =>
    fetch(base + path, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  try {
    const first = await (
      await post('/auth/register', {
        name: 'Primera cuenta',
        email: 'primera@example.test',
        password: 'PruebaCliente2026!',
      })
    ).json();
    const second = await (
      await post('/auth/register', {
        name: 'Segunda cuenta',
        email: 'segunda@example.test',
        password: 'PruebaCliente2026!',
      })
    ).json();
    const body = {
      customerName: 'Contacto del pedido',
      phone: '999123456',
      email: second.user.email,
      items: [{ productId: 'prod-1', quantity: 1 }],
    };
    assert.equal(
      (await post('/orders', { ...body, userId: second.user.id }, first.accessToken)).status,
      400,
    );
    const created = await post('/orders', body, first.accessToken);
    assert.equal(created.status, 201);
    const order = await created.json();
    assert.equal(order.userId, first.user.id);
    const guest = await (await post('/orders', { ...body, email: first.user.email })).json();
    assert.equal(guest.userId, null);
    assert.equal((await get('/me/orders')).status, 401);
    assert.equal((await get(`/me/orders/${order.id}`, second.accessToken)).status, 404);
    assert.equal((await get(`/me/orders/${guest.id}`, first.accessToken)).status, 404);
    const response = await get('/me/orders', first.accessToken);
    assert.match(response.headers.get('cache-control')!, /no-store/);
    const list = await response.json();
    assert.equal(list.total, 1);
    await repo.transaction((u) =>
      u.update('products', 'prod-1', { name: 'Producto renombrado', price: 99999 }),
    );
    const detail = await (await get(`/me/orders/${order.id}`, first.accessToken)).json();
    assert.equal(detail.items[0].name, 'Taladro percutor Bosch GSB 185-LI 18V');
    assert.equal(detail.items[0].price, 47990);
    assert.equal(detail.total, 47990);
    assert.equal((await (await get('/me/orders', second.accessToken)).json()).total, 0);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
