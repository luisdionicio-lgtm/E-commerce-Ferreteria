import { Router } from 'express';
import { z } from 'zod';
import type { Repository } from '../../shared/types.js';
import { authenticate } from '../../middlewares/security.js';
import { wrap } from '../admin/admin.routes.js';
import { customerOrders, orderView, ownedOrder } from './orders.service.js';

export function customerOrderRoutes(repo: Repository) {
  const router = Router();
  router.use(authenticate(repo));
  router.use((_q, res, next) => {
    res.set('Cache-Control', 'private, no-store');
    next();
  });
  router.get(
    '/',
    wrap(async (req: any, res: any) => {
      const page = z.coerce.number().int().min(1).max(100000).default(1).parse(req.query.page);
      res.json(await repo.read((u) => customerOrders(u, res.locals.user.id, page)));
    }),
  );
  router.get(
    '/:id',
    wrap(async (req: any, res: any) => {
      res.json(
        await repo.read(async (u) =>
          orderView(u, await ownedOrder(u, req.params.id, res.locals.user.id)),
        ),
      );
    }),
  );
  return router;
}
