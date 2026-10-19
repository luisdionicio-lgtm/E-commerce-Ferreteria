import { z } from 'zod';
const text = z.string().trim().min(1).max(180);
const money = z.number().int().min(0).max(100000000);
const qty = z.number().int().min(1).max(100000);
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (s) => !isNaN(Date.parse(s)) && new Date(s).toISOString().slice(0, 10) === s,
    'Fecha inválida',
  );
export const schemas = {
  products: z.object({
    name: text,
    sku: text,
    brand: text,
    categoryId: text,
    price: money,
    minStock: z.number().int().min(0).max(100000),
    unit: text,
    image: z.string().regex(/^\/images\/(?:reference\/)?[a-z0-9-]+\.(?:svg|jpe?g|png|webp)$/i),
    description: z.string().max(2000),
    active: z.boolean().default(true),
    featured: z.boolean().default(false),
  }),
  categories: z.object({ name: text, active: z.boolean().default(true) }),
  suppliers: z.object({
    name: text,
    ruc: z.string().regex(/^\d{11}$/, 'RUC de 11 dígitos'),
    contact: text,
    phone: text,
    email: z.string().email(),
    active: z.boolean().default(true),
  }),
  customers: z.object({
    name: text,
    document: z.string().regex(/^\d{8}$|^\d{11}$/, 'DNI de 8 o RUC de 11 dígitos'),
    phone: text,
    email: z.string().email(),
    active: z.boolean().default(true),
  }),
  renewals: z.object({
    name: text,
    dueDate: date,
    responsible: text,
    status: z.enum(['PENDIENTE', 'COMPLETADO']),
    notes: z.string().max(2000),
  }),
  users: z.object({
    name: text,
    email: z.string().email(),
    role: z.enum(['ADMIN', 'EMPLOYEE']),
    active: z.boolean(),
    password: z.string().min(10).max(128).optional(),
  }),
  settings: z.object({
    name: text,
    phone: z.string().regex(/^\d{9,15}$/),
    address: text,
    email: z.string().email(),
    currency: z.literal('PEN'),
  }),
};
export const items = z
  .array(z.object({ productId: text, quantity: qty }))
  .min(1)
  .max(100);
export const saleSchema = z
  .object({
    items: items.min(0).default([]),
    customerId: z.string().optional(),
    orderId: z.string().optional(),
    payment: z.enum(['EFECTIVO', 'YAPE', 'TARJETA']).default('EFECTIVO'),
  })
  .refine((x) => Boolean(x.orderId) || x.items.length > 0, 'Agrega al menos un producto');
export const purchaseSchema = z.object({
  supplierId: text,
  items: z
    .array(
      z.object({
        productId: text,
        quantity: qty,
        cost: money,
        expiresAt: date.nullable().optional(),
      }),
    )
    .min(1)
    .max(100),
});
export const orderSchema = z.object({
  customerName: text,
  phone: z.string().regex(/^\+?[0-9 ]{9,16}$/, 'Teléfono inválido'),
  email: z.union([z.string().email(), z.literal('')]).optional(),
  address: z.string().max(500).optional(),
  items,
});
export const adjustmentSchema = z.object({
  lotId: text,
  delta: z
    .number()
    .int()
    .min(-100000)
    .max(100000)
    .refine((n) => n !== 0),
  reason: z.string().trim().min(5).max(500),
});
