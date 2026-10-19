import 'dotenv/config';
import { randomBytes } from 'node:crypto';
const production = process.env.NODE_ENV === 'production';
const driver = process.env.DATA_DRIVER || 'json';
if (!['json', 'mysql'].includes(driver)) throw new Error('DATA_DRIVER debe ser json o mysql');
if (
  (production || driver === 'mysql') &&
  (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)
)
  throw new Error('Configura JWT_SECRET de al menos 32 caracteres');
if (production && driver === 'json') throw new Error('Usa MySQL para producción');
if (production && !process.env.FRONTEND_URL?.startsWith('https://'))
  throw new Error('FRONTEND_URL debe usar HTTPS en producción');
export const env = {
  port: Number(process.env.PORT || 3001),
  production,
  driver,
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  secret: process.env.JWT_SECRET || randomBytes(48).toString('hex'),
};
