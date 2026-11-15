import { Router } from 'express';
import { z } from 'zod';
import type { Repository } from '../../shared/types.js';
import { admin } from '../../middlewares/security.js';
import { wrap } from '../../shared/http.js';
import type { PaymentConfig } from './payment.config.js';
import {
  startPayment,
  paymentScreen,
  reportPayment,
  simulatePayment,
  reviewPayment,
} from './payments.service.js';
import { ensure } from '../../shared/errors.js';
import { randomUUID } from 'node:crypto';

const reference = z
  .string()
  .trim()
  .min(6)
  .max(50)
  .regex(/^[A-Za-z0-9 -]+$/, 'Usa el número de operación, sin claves ni códigos de aprobación');
export function customerPaymentRoutes(repo: Repository, config: PaymentConfig) {
  const router = Router({ mergeParams: true });
  router.post(
    '/',
    wrap(async (req: any, res: any) => {
      z.object({}).strict().parse(req.body);
      res
        .status(201)
        .json(
          await repo.transaction((u) => startPayment(u, req.params.id, res.locals.user.id, config)),
        );
    }),
  );
  router.get(
    '/',
    wrap(async (req: any, res: any) =>
      res.json(await repo.read((u) => paymentScreen(u, req.params.id, res.locals.user.id, config))),
    ),
  );
  router.post(
    '/report',
    wrap(async (req: any, res: any) => {
      const input = z.object({ reference }).strict().parse(req.body);
      res.json(
        await repo.transaction((u) =>
          reportPayment(u, req.params.id, res.locals.user.id, input.reference),
        ),
      );
    }),
  );
  router.post(
    '/simulate',
    wrap(async (req: any, res: any) => {
      const { outcome } = z
        .object({ outcome: z.enum(['approved', 'rejected']) })
        .strict()
        .parse(req.body);
      res.json(
        await repo.transaction((u) =>
          simulatePayment(u, req.params.id, res.locals.user.id, outcome, config),
        ),
      );
    }),
  );
  return router;
}
export function adminPaymentRoutes(repo: Repository) {
  const router = Router();
  router.get(
    '/',
    wrap(async (_req: any, res: any) =>
      res.json(
        await repo.read(async (u) => {
          const orders = new Map((await u.all('orders')).map((order) => [order.id, order]));
          return (await u.all('payments'))
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
            .map((payment) => ({
              ...payment,
              customerName: orders.get(payment.orderId)?.customerName || '',
              orderStatus: orders.get(payment.orderId)?.status,
            }));
        }),
      ),
    ),
  );
  router.post(
    '/:id/review',
    admin,
    wrap(async (req: any, res: any) => {
      const input = z
        .object({
          decision: z.enum(['approve', 'reject']),
          note: z.string().trim().min(5).max(500),
        })
        .strict()
        .parse(req.body);
      res.json(
        await repo.transaction((u) =>
          reviewPayment(u, req.params.id, res.locals.user.id, input.decision, input.note),
        ),
      );
    }),
  );
  router.post(
    '/:id/refund',
    admin,
    wrap(async (req: any, res: any) => {
      const input = z.object({ reference: reference.optional() }).strict().parse(req.body);
      res.json(
        await repo.transaction(async (u) => {
          const payment = await u.get('payments', req.params.id);
          ensure(payment?.status === 'REEMBOLSO_PENDIENTE', 'La devolución no está pendiente', 409);
          ensure(
            payment.mode === 'demo' || input.reference,
            'Registra la referencia de la devolución realizada fuera del sistema',
          );
          const refundReference = input.reference || `DEMO-REF-${randomUUID()}`;
          ensure(
            !(await u.all('payments')).some(
              (row) => row.id !== payment.id && row.refundReference === refundReference,
            ),
            'Esta devolución ya fue registrada',
            409,
          );
          await u.create('auditLogs', {
            id: randomUUID(),
            userId: res.locals.user.id,
            action: payment.mode === 'demo' ? 'SIMULAR_REEMBOLSO' : 'REGISTRAR_REEMBOLSO_MANUAL',
            entity: 'payments',
            entityId: payment.id,
            createdAt: new Date().toISOString(),
          });
          return u.update('payments', payment.id, {
            status: 'REEMBOLSADO',
            refundReference,
            reviewedBy: res.locals.user.id,
            updatedAt: new Date().toISOString(),
          });
        }),
      );
    }),
  );
  return router;
}
