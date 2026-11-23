import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { JsonRepository } from '../src/config/repository.js';
import { seedData } from '../src/config/seed-data.js';

test('Registro público: validación, hash, duplicados, sesión y aislamiento del panel', async () => {
  const repo = new JsonRepository(await seedData());
  const server = createApp(repo).listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const url = `http://127.0.0.1:${(server.address() as any).port}/api`;
  const post = (path: string, body: unknown) =>
    fetch(url + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  const input = {
    name: 'Cliente de prueba',
    email: 'cliente@example.test',
    password: 'PruebaCliente2026!',
  };
  try {
    assert.equal((await post('/auth/register', { ...input, password: 'corta' })).status, 400);
    assert.equal((await post('/auth/register', { ...input, role: 'ADMIN' })).status, 400);
    const response = await post('/auth/register', input);
    assert.equal(response.status, 201);
    const session = await response.json();
    assert.equal(session.user.role, 'CUSTOMER');
    assert.ok(session.accessToken);
    assert.ok(!session.user.passwordHash);
    assert.match(response.headers.get('set-cookie')!, /HttpOnly/);
    const saved = await repo.read(async (u) =>
      (await u.all('users')).find((u) => u.email === input.email),
    );
    assert.ok(saved?.passwordHash);
    assert.notEqual(saved.passwordHash, input.password);
    assert.equal(
      (await post('/auth/register', { ...input, email: 'CLIENTE@example.test' })).status,
      409,
    );
    const headers = { Authorization: 'Bearer ' + session.accessToken };
    for (const path of ['/admin/products', '/admin/dashboard', '/admin/orders', '/admin/users'])
      assert.equal((await fetch(url + path, { headers })).status, 403, path);
    assert.equal(
      (await post('/auth/login', { email: input.email, password: 'incorrecta' })).status,
      401,
    );
    const login = await post('/auth/login', input);
    assert.equal(login.status, 200);
    const cookie = login.headers.get('set-cookie')!.split(';')[0];
    assert.equal(
      (await fetch(url + '/auth/refresh', { method: 'POST', headers: { Cookie: cookie } })).status,
      200,
    );
    const duplicate = await Promise.all([
      post('/auth/register', { ...input, email: 'parallel@example.test' }),
      post('/auth/register', { ...input, email: 'parallel@example.test' }),
    ]);
    assert.deepEqual(duplicate.map((r) => r.status).sort(), [201, 409]);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((e) => (e ? reject(e) : resolve())));
  }
});
