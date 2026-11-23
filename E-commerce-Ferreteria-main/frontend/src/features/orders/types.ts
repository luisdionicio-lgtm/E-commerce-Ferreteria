export type PaymentStatus =
  | 'CREADO'
  | 'EN_REVISION'
  | 'APROBADO'
  | 'RECHAZADO'
  | 'CANCELADO'
  | 'REEMBOLSO_PENDIENTE'
  | 'REEMBOLSADO';
export type OrderStatus = 'PENDIENTE' | 'CONFIRMADO' | 'ANULADO';
export type FulfillmentStatus = 'POR_PREPARAR' | 'EN_PREPARACION' | 'LISTO' | 'ENTREGADO';
export type Payment = {
  id: string;
  method: string;
  mode: 'demo' | 'manual';
  status: PaymentStatus;
  amount: number;
  currency: string;
  reference: string | null;
  reviewNote: string;
  refundReference: string | null;
  createdAt: string;
  updatedAt: string;
};
export type OrderItem = {
  id: string;
  productId: string;
  name: string;
  image: string;
  quantity: number;
  price: number;
  subtotal: number;
};
export type CustomerOrder = {
  id: string;
  customerName: string;
  phone: string;
  email: string;
  address: string;
  status: OrderStatus;
  fulfillmentStatus: FulfillmentStatus;
  total: number;
  createdAt: string;
  items: OrderItem[];
  payment: Payment | null;
};
export type OrderPage = { orders: CustomerOrder[]; total: number; page: number; pageSize: number };
export type PaymentScreen = {
  order: CustomerOrder;
  payment: Payment;
  qr: string | null;
  merchant: { name: string; phone: string };
  canPay: boolean;
  demo: boolean;
};
export const orderLabels: Record<OrderStatus, string> = {
  PENDIENTE: 'Por confirmar',
  CONFIRMADO: 'Confirmado',
  ANULADO: 'Cancelado',
};
export const paymentLabels: Record<PaymentStatus, string> = {
  CREADO: 'Pendiente de pago',
  EN_REVISION: 'En revisión',
  APROBADO: 'Pago aprobado',
  RECHAZADO: 'Pago rechazado',
  CANCELADO: 'Pago cancelado',
  REEMBOLSO_PENDIENTE: 'Devolución pendiente',
  REEMBOLSADO: 'Devuelto',
};
export const fulfillmentLabels: Record<FulfillmentStatus, string> = {
  POR_PREPARAR: 'Por preparar',
  EN_PREPARACION: 'En preparación',
  LISTO: 'Listo para entregar',
  ENTREGADO: 'Entregado',
};
export const orderCode = (id: string) => `FM-${id.slice(0, 8).toUpperCase()}`;
