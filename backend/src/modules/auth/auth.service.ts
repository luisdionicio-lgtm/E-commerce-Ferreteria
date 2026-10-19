import { randomBytes, createHash, randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { compare, hash } from 'bcryptjs';
import type { Repository, Row, Unit } from '../../shared/types.js';
import { ensure } from '../../shared/errors.js';
import { env } from '../../config/env.js';
export const publicUser = (u: Row) => ({ id: u.id, name: u.name, email: u.email, role: u.role });
export async function register(
  repo: Repository,
  input: { name: string; email: string; password: string },
) {
  const passwordHash = await hash(input.password, 12);
  return repo.transaction(async (u) => {
    const email = input.email.trim().toLowerCase();
    ensure(
      !(await u.all('users')).some((x) => x.email.toLowerCase() === email),
      'Este correo ya está registrado',
      409,
    );
    const user = await u.create('users', {
      id: randomUUID(),
      name: input.name.trim(),
      email,
      passwordHash,
      role: 'CUSTOMER',
      active: true,
    });
    return session(u, user);
  });
}
export const token = (u: Row) =>
  jwt.sign({ sub: u.id }, env.secret, {
    expiresIn: '15m',
    issuer: 'ferremax',
    audience: 'ferremax-web',
  });
const digest = (v: string) => createHash('sha256').update(v).digest('hex');
async function session(u: Unit, user: Row) {
  const refresh = randomBytes(48).toString('hex');
  await u.create('sessions', {
    id: randomUUID(),
    userId: user.id,
    tokenHash: digest(refresh),
    expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
  });
  return { accessToken: token(user), user: publicUser(user), refresh };
}
export async function login(repo: Repository, email: string, password: string) {
  return repo.transaction(async (u) => {
    const user = (await u.all('users')).find(
      (x) => x.email.toLowerCase() === email.toLowerCase() && x.active,
    );
    ensure(
      user && (await compare(password, user.passwordHash)),
      'Correo o contraseña incorrectos',
      401,
    );
    for (const s of await u.all('sessions'))
      if (s.expiresAt < new Date().toISOString()) await u.remove('sessions', s.id);
    return session(u, user);
  });
}
export async function refresh(repo: Repository, value: string) {
  return repo.transaction(async (u) => {
    const s = (await u.all('sessions')).find(
      (x) => x.tokenHash === digest(value) && x.expiresAt > new Date().toISOString(),
    );
    ensure(s, 'Sesión vencida', 401);
    const user = await u.get('users', s.userId);
    ensure(user?.active, 'Usuario no disponible', 401);
    await u.remove('sessions', s.id);
    return session(u, user);
  });
}
export async function logout(repo: Repository, value: string) {
  return repo.transaction(async (u) => {
    const s = (await u.all('sessions')).find((x) => x.tokenHash === digest(value));
    if (s) await u.remove('sessions', s.id);
  });
}
