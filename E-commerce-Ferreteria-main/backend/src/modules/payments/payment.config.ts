import { env } from '../../config/env.js';

export type PaymentMode = 'demo' | 'manual' | 'disabled';
export type PaymentConfig = {
  mode: PaymentMode;
  merchantName: string;
  merchantPhone: string;
  qrPayload: string;
  origin: string;
  production: boolean;
};
export function paymentConfig(
  source: NodeJS.ProcessEnv = process.env,
  production = env.production,
): PaymentConfig {
  const mode = source.PAYMENT_MODE || (production ? 'disabled' : 'demo');
  if (!['demo', 'manual', 'disabled'].includes(mode))
    throw new Error('PAYMENT_MODE debe ser demo, manual o disabled');
  if (production && mode === 'demo')
    throw new Error('Los pagos de demostración no están permitidos en producción');
  const qrPayload = source.YAPE_QR_PAYLOAD?.trim() || '';
  if (
    mode === 'manual' &&
    (!qrPayload || qrPayload.length > 2048 || !source.YAPE_MERCHANT_NAME?.trim())
  )
    throw new Error('Configura YAPE_QR_PAYLOAD y YAPE_MERCHANT_NAME para usar el QR comercial');
  return {
    mode: mode as PaymentMode,
    merchantName: source.YAPE_MERCHANT_NAME || 'FerreMax · demostración',
    merchantPhone: source.YAPE_MERCHANT_PHONE || '',
    qrPayload,
    origin: env.origin,
    production,
  };
}
