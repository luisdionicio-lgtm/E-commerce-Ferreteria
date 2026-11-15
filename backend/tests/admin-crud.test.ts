import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { JsonRepository } from '../src/config/repository.js';
import { seedData } from '../src/config/seed-data.js';

test('Panel: crear, leer, editar y desactivar catálogo, contactos, renovaciones y usuarios', async () => {
  const repo = new JsonRepository(await seedData());
  const server = createApp(repo).listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const url = `http://127.0.0.1:${(server.address() as any).port}/api`;
  try {
    const login = await fetch(url + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@ferremax.pe', password: 'FerreMax2026!' }),
    });
    const session = await login.json();
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.accessToken}`,
    };
    const fixtures: [string, Record<string, unknown>][] = [
      ['categories', { name: 'Categoría de prueba', active: true }],
      [
        'products',
        {
          name: 'Producto de prueba',
          sku: 'VERIFY-CRUD',
          brand: 'DEMO',
          categoryId: 'cat-1',
          price: 12345,
          minStock: 2,
          unit: 'unidad',
          image: '/images/reference/drill-kit-bosch.png',
          description: 'Referencial',
          active: true,
          featured: false,
        },
      ],
      [
        'suppliers',
        {
          name: 'Proveedor de prueba',
          ruc: '20123456789',
          contact: 'Contacto demo',
          phone: '999123456',
          email: 'supplier@example.test',
          active: true,
        },
      ],
      [
        'customers',
        {
          name: 'Cliente de prueba',
          document: '12345678',
          phone: '999123456',
          email: 'customer@example.test',
          active: true,
        },
      ],
      [
        'renewals',
        {
          name: 'Renovación de prueba',
          dueDate: '2999-12-31',
          responsible: 'Operador demo',
          status: 'PENDIENTE',
          notes: 'Registro automatizado',
        },
      ],
      [
        'users',
        {
          name: 'Empleado de prueba',
          email: 'employee@example.test',
          role: 'EMPLOYEE',
          password: 'EmpleadoPrueba2026!',
          active: true,
        },
      ],
    ];
    for (const [resource, input] of fixtures) {
      const endpoint = url + '/admin/' + resource;
      const created = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(input),
      });
      assert.equal(created.status, 201, resource);
      const record = await created.json();
      assert.ok(record.id);
      assert.ok(!record.passwordHash);
      const rows = await (await fetch(endpoint, { headers })).json();
      assert.ok(rows.some((r: any) => r.id === record.id));
      const updated = await fetch(endpoint + '/' + record.id, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ ...input, name: input.name + ' editado' }),
      });
      assert.equal(updated.status, 200, resource);
      const deleted = await fetch(endpoint + '/' + record.id, { method: 'DELETE', headers });
      assert.equal(deleted.status, 200, resource);
      const saved = await repo.read((u) => u.get(resource as any, record.id));
      assert.ok(saved, 'El historial debe conservarse');
      assert.equal(
        resource === 'renewals' ? saved.status : saved.active,
        resource === 'renewals' ? 'COMPLETADO' : false,
      );
    }
    assert.equal((await fetch(url + '/admin/settings', { headers })).status, 200);
    assert.equal((await fetch(url + '/admin/audit', { headers })).status, 200);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((e) => (e ? reject(e) : resolve())));
  }
});
