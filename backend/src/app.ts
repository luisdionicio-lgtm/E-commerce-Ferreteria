import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import { z, ZodError } from 'zod';
import { resolve } from 'node:path';
import type { Repository } from './shared/types.js';
import { env } from './config/env.js';
import { AppError, ensure } from './shared/errors.js';
import { sameOrigin } from './middlewares/security.js';
import { adminRoutes, wrap } from './modules/admin/admin.routes.js';
import { catalog } from './modules/catalog/catalog.service.js';
import { createOrder } from './modules/operations/operations.service.js';
import { orderSchema } from './modules/admin/admin.schemas.js';
import { login, refresh, logout, register } from './modules/auth/auth.service.js';
export function createApp(repo: Repository) {
  const app = express();
  app.disable('x-powered-by');
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          'img-src': ["'self'", 'data:'],
          'style-src': ["'self'", "'unsafe-inline'"],
          'script-src': ["'self'"],
          'connect-src': ["'self'"],
        },
      },
    }),
  );
  app.use(cors({ origin: env.origin, credentials: true }));
  app.use(express.json({ limit: '200kb' }));
  app.use(cookieParser());
  app.use('/api', sameOrigin);
  const cookie = {
    httpOnly: true,
    secure: env.production,
    sameSite: 'strict' as const,
    path: '/api/auth',
    maxAge: 7 * 86400000,
  };
  const loginLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 25,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { message: 'Demasiados intentos. Vuelve a probar en 15 minutos.' },
  });
  app.get('/api/health', (_q, s) =>
    s.json({ ok: true, driver: env.driver, mode: env.production ? 'production' : 'development' }),
  );
  app.post(
    '/api/auth/register',
    loginLimit,
    wrap(async (q: any, s: any) => {
      const input = z
        .object({
          name: z.string().trim().min(2).max(100),
          email: z.string().trim().email().max(180),
          password: z.string().min(10).max(72),
        })
        .strict()
        .parse(q.body);
      const { refresh: rt, ...result } = await register(repo, input);
      s.status(201).cookie('refresh', rt, cookie).json(result);
    }),
  );
  app.post(
    '/api/auth/login',
    loginLimit,
    wrap(async (q: any, s: any) => {
      const i = z
        .object({ email: z.string().email(), password: z.string().max(128) })
        .parse(q.body);
      const { refresh: rt, ...result } = await login(repo, i.email, i.password);
      s.cookie('refresh', rt, cookie).json(result);
    }),
  );
  app.post(
    '/api/auth/refresh',
    wrap(async (q: any, s: any) => {
      ensure(q.cookies.refresh, 'Inicia sesión', 401);
      const { refresh: rt, ...result } = await refresh(repo, q.cookies.refresh);
      s.cookie('refresh', rt, cookie).json(result);
    }),
  );
  app.post(
    '/api/auth/logout',
    wrap(async (q: any, s: any) => {
      if (q.cookies.refresh) await logout(repo, q.cookies.refresh);
      s.clearCookie('refresh', { path: '/api/auth' }).json({ ok: true });
    }),
  );
  app.get(
    '/api/catalog/products',
    wrap(async (q: any, s: any) => {
      let rows = await repo.read((u) => catalog(u));
      const term = String(q.query.q || '').toLowerCase();
      rows = rows.filter(
        (p) =>
          (!term || `${p.name} ${p.brand} ${p.sku}`.toLowerCase().includes(term)) &&
          (!q.query.category || p.categoryId === q.query.category),
      );
      s.json(rows);
    }),
  );
  app.get(
    '/api/catalog/products/:slug',
    wrap(async (q: any, s: any) => {
      const product = (await repo.read((u) => catalog(u))).find((p) => p.slug === q.params.slug);
      ensure(product, 'Producto no encontrado', 404);
      s.json(product);
    }),
  );
  app.get(
    '/api/catalog/categories',
    wrap(async (_q: any, s: any) =>
      s.json(await repo.read(async (u) => (await u.all('categories')).filter((c) => c.active))),
    ),
  );
  app.get(
    '/api/catalog/settings',
    wrap(async (_q: any, s: any) => s.json(await repo.read((u) => u.get('settings', 'store')))),
  );
  app.post(
    '/api/orders',
    rateLimit({
      windowMs: 60000,
      limit: 10,
      message: { message: 'Espera un minuto para enviar otro pedido' },
    }),
    wrap(async (q: any, s: any) =>
      s.status(201).json(await repo.transaction((u) => createOrder(u, orderSchema.parse(q.body)))),
    ),
  );
  app.use('/api/admin', adminRoutes(repo));
  app.use('/api', (_q, s) => s.status(404).json({ message: 'Ruta no encontrada' }));
  if (env.production) {
    app.use(express.static(resolve('../frontend/dist')));
    app.get('*', (_q, s) => s.sendFile(resolve('../frontend/dist/index.html')));
  }
  app.use((err: any, _q: any, s: any, _n: any) => {
    if (err instanceof ZodError)
      return s
        .status(400)
        .json({ message: err.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') });
    if (err instanceof AppError) return s.status(err.status).json({ message: err.message });
    if (err.type === 'entity.parse.failed') return s.status(400).json({ message: 'JSON inválido' });
    if (err.code === 'P2002') return s.status(409).json({ message: 'El registro ya existe' });
    if (err.code === 'P2034')
      return s.status(409).json({ message: 'Operación concurrente: vuelve a intentarlo' });
    console.error(err);
    s.status(500).json({ message: 'No se pudo completar la operación' });
  });
  return app;
}
