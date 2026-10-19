import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import type { Repository } from '../shared/types.js';
import { env } from '../config/env.js';
import { AppError } from '../shared/errors.js';
export const authenticate =
  (repo: Repository): RequestHandler =>
  async (req, res, next) => {
    try {
      const raw = req.headers.authorization?.replace(/^Bearer /, '');
      if (!raw) throw new AppError(401, 'Inicia sesión');
      let payload: jwt.JwtPayload;
      try {
        payload = jwt.verify(raw, env.secret, {
          issuer: 'ferremax',
          audience: 'ferremax-web',
        }) as jwt.JwtPayload;
      } catch {
        throw new AppError(401, 'Sesión vencida');
      }
      const user = await repo.read((u) => u.get('users', String(payload.sub)));
      if (!user?.active) throw new AppError(401, 'Usuario no disponible');
      res.locals.user = user;
      next();
    } catch (e) {
      next(e);
    }
  };
export const admin: RequestHandler = (_req, res, next) =>
  res.locals.user.role === 'ADMIN'
    ? next()
    : next(new AppError(403, 'Esta operación requiere administrador'));
export const sameOrigin: RequestHandler = (req, _res, next) => {
  const origin = req.headers.origin;
  if (origin && origin !== env.origin) return next(new AppError(403, 'Origen no autorizado'));
  next();
};
