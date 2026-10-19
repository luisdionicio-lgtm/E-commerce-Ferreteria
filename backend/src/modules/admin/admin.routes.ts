import { Router } from 'express';
import type { Repository, Table, Unit } from '../../shared/types.js';
import { schemas, adjustmentSchema, saleSchema, purchaseSchema } from './admin.schemas.js';
import { authenticate, admin } from '../../middlewares/security.js';
import { catalog } from '../catalog/catalog.service.js';
import { dashboard } from '../dashboard/dashboard.service.js';
import { adjust } from '../inventory/inventory.service.js';
import {
  createSale,
  cancelSale,
  createPurchase,
  receivePurchase,
} from '../operations/operations.service.js';
import { ensure } from '../../shared/errors.js';
import { randomUUID } from 'node:crypto';
import { hash } from 'bcryptjs';
export const wrap = (fn: any) => (req: any, res: any, next: any) =>
  Promise.resolve(fn(req, res)).catch(next);
async function audit(u: Unit, userId: string, action: string, entity: string, entityId: string) {
  await u.create('auditLogs', {
    id: randomUUID(),
    userId,
    action,
    entity,
    entityId,
    createdAt: new Date().toISOString(),
  });
}
export function adminRoutes(repo: Repository) {
  const r = Router();
  r.use(authenticate(repo));
  r.use((_q, s, next) => {
    try {
      ensure(
        ['ADMIN', 'EMPLOYEE'].includes(s.locals.user.role),
        'Esta sección es exclusiva del personal',
        403,
      );
      next();
    } catch (e) {
      next(e);
    }
  });
  r.get(
    '/dashboard',
    wrap(async (_q: any, s: any) => s.json(await repo.read(dashboard))),
  );
  r.get(
    '/inventory',
    wrap(async (_q: any, s: any) =>
      s.json(
        await repo.read(async (u) => ({
          products: await catalog(u, true),
          lots: await u.all('lots'),
          movements: (await u.all('movements')).reverse(),
        })),
      ),
    ),
  );
  r.get(
    '/alerts/:type',
    wrap(async (q: any, s: any) => {
      const d = await repo.read(dashboard);
      s.json(q.params.type === 'low-stock' ? d.low : d.expiring);
    }),
  );
  for (const name of [
    'products',
    'categories',
    'suppliers',
    'customers',
    'renewals',
    'users',
  ] as const) {
    r.get(
      '/' + name,
      ...(name === 'users' ? [admin] : []),
      wrap(async (_q: any, s: any) => {
        const rows = await repo.read((u) => (name === 'products' ? catalog(u, true) : u.all(name)));
        s.json(rows.map(({ passwordHash, ...v }: any) => v));
      }),
    );
    r.post(
      '/' + name,
      admin,
      wrap(async (q: any, s: any) => {
        const input = schemas[name].parse(q.body);
        const result = await repo.transaction(async (u) => {
          const id = randomUUID();
          const row: any = { ...input, id };
          if (name === 'users') {
            ensure(row.password, 'La contraseña es obligatoria');
            row.passwordHash = await hash(row.password, 12);
            delete row.password;
          }
          if (name === 'products') {
            ensure((await u.get('categories', row.categoryId))?.active, 'Categoría no disponible');
            ensure(!(await u.all('products')).some((p) => p.sku === row.sku), 'SKU duplicado', 409);
            row.slug = id;
          }
          if (name === 'users')
            ensure(
              !(await u.all('users')).some(
                (x) => x.email.toLowerCase() === row.email.toLowerCase(),
              ),
              'Correo duplicado',
              409,
            );
          await u.create(name, row);
          await audit(u, s.locals.user.id, 'CREAR', name, id);
          const { passwordHash, ...safe } = row;
          return safe;
        });
        s.status(201).json(result);
      }),
    );
    r.patch(
      '/' + name + '/:id',
      admin,
      wrap(async (q: any, s: any) => {
        const input = schemas[name].parse(q.body);
        s.json(
          await repo.transaction(async (u) => {
            ensure(await u.get(name, q.params.id), 'Registro no encontrado', 404);
            const patch: any = { ...input };
            if (name === 'users') {
              ensure(
                q.params.id !== s.locals.user.id || (patch.active && patch.role === 'ADMIN'),
                'No puedes desactivar o quitar tu propio rol administrador',
              );
              ensure(
                !(await u.all('users')).some(
                  (x) =>
                    x.id !== q.params.id && x.email.toLowerCase() === patch.email.toLowerCase(),
                ),
                'Correo duplicado',
                409,
              );
              if (patch.password) patch.passwordHash = await hash(patch.password, 12);
              delete patch.password;
            }
            if (name === 'products') {
              ensure(
                (await u.get('categories', patch.categoryId))?.active,
                'Categoría no disponible',
              );
              ensure(
                !(await u.all('products')).some((p) => p.id !== q.params.id && p.sku === patch.sku),
                'SKU duplicado',
                409,
              );
            }
            const result = await u.update(name, q.params.id, patch);
            await audit(u, s.locals.user.id, 'EDITAR', name, q.params.id);
            const { passwordHash, ...safe } = result;
            return safe;
          }),
        );
      }),
    );
    r.delete(
      '/' + name + '/:id',
      admin,
      wrap(async (q: any, s: any) => {
        await repo.transaction(async (u) => {
          ensure(await u.get(name, q.params.id), 'Registro no encontrado', 404);
          ensure(
            name !== 'users' || q.params.id !== s.locals.user.id,
            'No puedes desactivar tu usuario',
          );
          await u.update(
            name,
            q.params.id,
            name === 'renewals' ? { status: 'COMPLETADO' } : { active: false },
          );
          await audit(u, s.locals.user.id, 'DESACTIVAR', name, q.params.id);
        });
        s.json({ message: 'Registro actualizado' });
      }),
    );
  }
  r.post(
    '/inventory/adjustments',
    wrap(async (q: any, s: any) =>
      s.json(
        await repo.transaction(async (u) => {
          const result = await adjust(u, adjustmentSchema.parse(q.body), s.locals.user.id);
          await audit(u, s.locals.user.id, 'AJUSTE', 'inventory', q.body.lotId);
          return result;
        }),
      ),
    ),
  );
  for (const table of ['purchases', 'sales', 'orders'] as const)
    r.get(
      '/' + table,
      wrap(async (_q: any, s: any) =>
        s.json(
          await repo.read(async (u) => ({
            records: (await u.all(table)).reverse(),
            items: await u.all(
              table === 'purchases'
                ? 'purchaseItems'
                : table === 'sales'
                  ? 'saleItems'
                  : 'orderItems',
            ),
          })),
        ),
      ),
    );
  r.post(
    '/purchases',
    wrap(async (q: any, s: any) =>
      s
        .status(201)
        .json(
          await repo.transaction((u) =>
            createPurchase(u, purchaseSchema.parse(q.body), s.locals.user.id),
          ),
        ),
    ),
  );
  r.post(
    '/purchases/:id/receive',
    wrap(async (q: any, s: any) =>
      s.json(await repo.transaction((u) => receivePurchase(u, q.params.id, s.locals.user.id))),
    ),
  );
  r.post(
    '/sales',
    wrap(async (q: any, s: any) =>
      s
        .status(201)
        .json(
          await repo.transaction((u) => createSale(u, saleSchema.parse(q.body), s.locals.user.id)),
        ),
    ),
  );
  r.post(
    '/sales/:id/cancel',
    admin,
    wrap(async (q: any, s: any) =>
      s.json(await repo.transaction((u) => cancelSale(u, q.params.id, s.locals.user.id))),
    ),
  );
  r.post(
    '/orders/:id/cancel',
    wrap(async (q: any, s: any) =>
      s.json(
        await repo.transaction(async (u) => {
          const o = await u.get('orders', q.params.id);
          ensure(o?.status === 'PENDIENTE', 'Pedido ya procesado', 409);
          return u.update('orders', q.params.id, { status: 'ANULADO' });
        }),
      ),
    ),
  );
  r.get(
    '/settings',
    wrap(async (_q: any, s: any) => s.json(await repo.read((u) => u.get('settings', 'store')))),
  );
  r.patch(
    '/settings',
    admin,
    wrap(async (q: any, s: any) =>
      s.json(
        await repo.transaction((u) =>
          u.update('settings', 'store', schemas.settings.parse(q.body)),
        ),
      ),
    ),
  );
  r.get(
    '/audit',
    admin,
    wrap(async (_q: any, s: any) =>
      s.json(await repo.read(async (u) => (await u.all('auditLogs')).reverse())),
    ),
  );
  r.get(
    '/reports/sales',
    wrap(async (_q: any, s: any) =>
      s.json(
        await repo.read(async (u) => ({
          summary: await dashboard(u),
          sales: await u.all('sales'),
          items: await u.all('saleItems'),
        })),
      ),
    ),
  );
  return r;
}
