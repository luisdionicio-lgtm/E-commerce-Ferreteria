import { useState, type ReactNode } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Clock3,
  Package,
  RefreshCw,
  ShoppingBag,
  Truck,
  UserRound,
  X,
  WalletCards,
} from 'lucide-react';
import { Link, Navigate, useNavigate } from '../../state/navigation';
import { useApp, money, dateLabel } from '../../state/context';
import { ErrorBox, Loading } from '../../components/ui';
import { send } from '../../services/api';
import { toast } from 'sonner';
import { usePrivateResource } from './usePrivateResource';
import {
  fulfillmentLabels,
  orderCode,
  orderLabels,
  paymentLabels,
  type CustomerOrder,
  type OrderPage,
} from './types';

export function CustomerGate({
  children,
  returnTo = '/mis-pedidos',
}: {
  children: ReactNode;
  returnTo?: string;
}) {
  const { user, ready } = useApp();
  if (!ready) return <Loading />;
  if (!user) return <Navigate to={`/ingresar?volver=${encodeURIComponent(returnTo)}`} replace />;
  return <>{children}</>;
}
export function CustomerTabs({ current = 'orders' }: { current?: 'orders' | 'profile' }) {
  return (
    <nav className="customer-tabs" aria-label="Cuenta de cliente">
      <Link to="/mi-cuenta" aria-current={current === 'profile' ? 'page' : undefined}>
        <UserRound size={17} /> Mi cuenta
      </Link>
      <Link to="/mis-pedidos" aria-current={current === 'orders' ? 'page' : undefined}>
        <Package size={17} /> Mis pedidos
      </Link>
      <Link to="/carrito">
        <ShoppingBag size={17} /> Mi carrito
      </Link>
    </nav>
  );
}
export function OrderBadge({ order }: { order: CustomerOrder }) {
  const label =
    order.status === 'CONFIRMADO' && order.fulfillmentStatus !== 'POR_PREPARAR'
      ? fulfillmentLabels[order.fulfillmentStatus]
      : orderLabels[order.status];
  return (
    <span
      className={`order-badge ${order.status === 'CONFIRMADO' ? 'positive' : order.status === 'ANULADO' ? 'negative' : 'waiting'}`}
    >
      {order.status === 'CONFIRMADO' ? (
        <CheckCircle2 size={14} />
      ) : order.status === 'ANULADO' ? (
        <X size={14} />
      ) : (
        <Clock3 size={14} />
      )}
      {label}
    </span>
  );
}
export function OrdersList() {
  const [page, setPage] = useState(1);
  const { data, loading, error, refresh } = usePrivateResource<OrderPage>(
    `/me/orders?page=${page}`,
  );
  if (loading)
    return (
      <div className="store-container orders-page">
        <Loading />
      </div>
    );
  return (
    <section className="store-container orders-page">
      <CustomerTabs />
      <header className="orders-heading">
        <div>
          <h1>Mis pedidos</h1>
          <p>Tu selección, tus pagos y cada paso de la entrega. Todo en un lugar.</p>
        </div>
        <button className="btn secondary" onClick={refresh}>
          <RefreshCw size={16} /> Actualizar
        </button>
      </header>
      {error ? (
        <ErrorBox message={error} />
      ) : !data?.orders.length ? (
        <div className="orders-empty">
          <Package size={48} strokeWidth={1.3} />
          <h2>Tu próximo proyecto empieza con una buena elección.</h2>
          <p>
            Los pedidos que hagas con tu cuenta aparecerán aquí, con sus productos, pagos y estado.
          </p>
          <Link className="btn primary" to="/catalogo">
            Explorar productos <ArrowUpRight size={18} />
          </Link>
        </div>
      ) : (
        <>
          <div className="order-list">
            {data.orders.map((order) => (
              <article className="customer-order-card" key={order.id}>
                <header>
                  <div>
                    <strong className="order-code">{orderCode(order.id)}</strong>
                    <time dateTime={order.createdAt}>{dateLabel(order.createdAt)}</time>
                  </div>
                  <OrderBadge order={order} />
                </header>
                <div className="order-card-body">
                  <div className="order-card-products">
                    <div className="order-preview-images">
                      {order.items.slice(0, 3).map((item) => (
                        <img
                          src={item.image}
                          alt={item.name}
                          width={72}
                          height={72}
                          key={item.id}
                          loading="lazy"
                        />
                      ))}
                    </div>
                    <div>
                      <h2>{order.items[0]?.name || 'Pedido FerreMax'}</h2>
                      <p>
                        {order.items.reduce((sum, item) => sum + item.quantity, 0)} artículos
                        {order.items.length > 1 ? ` · ${order.items.length} productos` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="order-card-total">
                    <span>Total del pedido</span>
                    <strong>{money(order.total)}</strong>
                  </div>
                </div>
                <footer>
                  <span className="order-payment-caption">
                    {order.payment
                      ? `${order.payment.mode === 'demo' ? 'Demo · ' : ''}${paymentLabels[order.payment.status]}`
                      : order.status === 'CONFIRMADO'
                        ? 'Pago coordinado con la tienda'
                        : order.status === 'ANULADO'
                          ? 'Pedido cancelado'
                          : 'Pago a coordinar con la tienda'}
                  </span>
                  <Link className="order-detail-link" to={`/mis-pedidos/${order.id}`}>
                    Ver pedido <ArrowRight size={17} />
                  </Link>
                </footer>
              </article>
            ))}
          </div>
          <div className="order-pagination">
            <span>{data.total} pedidos en tu cuenta</span>
            <div>
              <button
                className="btn secondary"
                disabled={page === 1}
                onClick={() => setPage((value) => value - 1)}
                aria-label="Página anterior"
              >
                <ArrowLeft size={16} />
              </button>
              <span>Página {page}</span>
              <button
                className="btn secondary"
                disabled={page * data.pageSize >= data.total}
                onClick={() => setPage((value) => value + 1)}
                aria-label="Página siguiente"
              >
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </>
      )}
      <p className="orders-privacy">
        <UserRound size={15} /> Solo ves los pedidos realizados con esta cuenta. Las compras como
        invitado no se vinculan por correo.
      </p>
    </section>
  );
}

function OrderTimeline({ order }: { order: CustomerOrder }) {
  if (order.status === 'ANULADO')
    return (
      <div className="order-cancel-notice">
        <X size={18} />
        <p>
          Este pedido está cancelado.
          {order.payment?.status === 'REEMBOLSO_PENDIENTE'
            ? ' La tienda tiene una devolución pendiente de resolver.'
            : ''}
        </p>
      </div>
    );
  const current =
    order.status !== 'CONFIRMADO'
      ? 1
      : { POR_PREPARAR: 2, EN_PREPARACION: 3, LISTO: 4, ENTREGADO: 5 }[order.fulfillmentStatus];
  const steps = [
    'Pedido recibido',
    'Confirmación del pedido',
    'En preparación',
    'Listo para entregar',
    'Entregado',
  ];
  return (
    <ol className="order-timeline" aria-label="Seguimiento del pedido">
      {steps.map((label, index) => (
        <li
          key={label}
          className={index < current ? 'complete' : ''}
          aria-current={index === current - 1 ? 'step' : undefined}
        >
          <span>{index < current ? <Check size={15} /> : <span>{index + 1}</span>}</span>
          <div>
            <strong>{label}</strong>
            {index === 0 && <small>{dateLabel(order.createdAt)}</small>}
            {index === current && <small>Próximo paso</small>}
          </div>
        </li>
      ))}
    </ol>
  );
}
export function OrderDetails({ id }: { id: string }) {
  const {
    data: order,
    loading,
    error,
    refresh,
  } = usePrivateResource<CustomerOrder>(`/me/orders/${id}`, true);
  const { data: options } = usePrivateResource<{ enabled: boolean; mode: string }>(
    '/payment-options',
  );
  const [busy, setBusy] = useState(false);
  const [cancel, setCancel] = useState(false);
  const navigate = useNavigate();
  const { reload } = useApp();
  const pay = async () => {
    setBusy(true);
    try {
      await send(`/me/orders/${id}/payment`, {});
      await navigate(`/mis-pedidos/${id}/pago`);
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : 'No se pudo preparar el pago');
    } finally {
      setBusy(false);
    }
  };
  if (loading && !order) return <Loading />;
  if (!order || error)
    return (
      <div className="store-container orders-page">
        <Link to="/mis-pedidos" className="order-back">
          <ArrowLeft size={16} /> Mis pedidos
        </Link>
        <ErrorBox message={error || 'Pedido no encontrado'} />
        <button className="btn secondary" onClick={refresh}>
          Reintentar
        </button>
      </div>
    );
  const canCancel =
    order.status === 'PENDIENTE' &&
    (!order.payment || ['CREADO', 'RECHAZADO', 'CANCELADO'].includes(order.payment.status));
  return (
    <section className="store-container orders-page">
      <CustomerTabs />
      <Link to="/mis-pedidos" className="order-back">
        <ArrowLeft size={16} /> Todos mis pedidos
      </Link>
      <header className="orders-heading">
        <div>
          <h1>Pedido {orderCode(order.id)}</h1>
          <p>Creado el {dateLabel(order.createdAt)}</p>
        </div>
        <OrderBadge order={order} />
      </header>
      <div className="customer-order-layout">
        <div className="order-main-stack">
          <section className="order-surface">
            <header className="order-surface-title">
              <Package size={20} />
              <h2>Productos de tu pedido</h2>
            </header>
            <div className="customer-order-items">
              {order.items.map((item) => (
                <div key={item.id}>
                  <img src={item.image} alt={item.name} width={72} height={72} />
                  <div>
                    <h3>{item.name}</h3>
                    <p>
                      {item.quantity} × {money(item.price)}
                    </p>
                  </div>
                  <strong>{money(item.subtotal)}</strong>
                </div>
              ))}
            </div>
            <div className="customer-order-total">
              <span>Total del pedido</span>
              <strong>{money(order.total)}</strong>
            </div>
            <p className="order-inline-note">
              Importes guardados al crear el pedido. La entrega se coordina con la tienda.
            </p>
          </section>
          <section className="order-surface">
            <header className="order-surface-title">
              <Truck size={20} />
              <h2>Así va tu pedido</h2>
            </header>
            <OrderTimeline order={order} />
          </section>
        </div>
        <aside className="order-side-stack" aria-label="Pago y datos del pedido">
          <section className="order-surface order-payment-summary">
            <header>
              {order.payment || order.status === 'PENDIENTE' ? (
                <img src="/images/payments/yape.png" alt="Yape" width={48} height={48} />
              ) : (
                <WalletCards size={24} />
              )}
              <h2>Tu pago</h2>
            </header>
            <strong>
              {order.payment
                ? paymentLabels[order.payment.status]
                : order.status === 'CONFIRMADO'
                  ? 'Pago coordinado'
                  : order.status === 'ANULADO'
                    ? 'Pedido cancelado'
                    : 'Pendiente de coordinar'}
            </strong>
            {order.payment?.mode === 'demo' && (
              <span className="payment-demo-badge">Demostración · sin cobros reales</span>
            )}
            <p>
              {!order.payment && order.status === 'CONFIRMADO'
                ? 'La tienda confirmó el pedido. El pago se coordinó directamente.'
                : order.payment?.status === 'EN_REVISION'
                  ? 'La tienda está revisando la operación. El estado se actualizará aquí.'
                  : order.payment?.status === 'APROBADO'
                    ? 'Pago registrado y pedido confirmado. Puedes seguir su preparación.'
                    : order.payment?.reviewNote ||
                      'Puedes continuar con Yape o coordinar el pago con la tienda.'}
            </p>
            {order.status === 'PENDIENTE' &&
              options?.enabled &&
              (!order.payment || ['CREADO', 'RECHAZADO'].includes(order.payment.status)) && (
                <button className="btn yape-action" disabled={busy} onClick={pay}>
                  {busy
                    ? 'Preparando…'
                    : options.mode === 'demo'
                      ? 'Probar pago con Yape'
                      : 'Pagar con Yape'}
                  <ArrowRight size={17} />
                </button>
              )}
            {order.payment && (
              <Link to={`/mis-pedidos/${id}/pago`} className="order-detail-link">
                Ver detalle del pago <ArrowRight size={16} />
              </Link>
            )}
          </section>
          <section className="order-surface order-contact">
            <h2>Datos de contacto</h2>
            <dl>
              <div>
                <dt>A nombre de</dt>
                <dd>{order.customerName}</dd>
              </div>
              <div>
                <dt>Celular</dt>
                <dd>{order.phone}</dd>
              </div>
              {order.email && (
                <div>
                  <dt>Correo</dt>
                  <dd>{order.email}</dd>
                </div>
              )}
              <div>
                <dt>Dirección</dt>
                <dd>{order.address || 'A coordinar con la tienda'}</dd>
              </div>
            </dl>
          </section>
          {canCancel && (
            <div className="order-cancel-action">
              {!cancel ? (
                <button onClick={() => setCancel(true)}>Cancelar este pedido</button>
              ) : (
                <>
                  <p>¿Cancelar este pedido pendiente?</p>
                  <div>
                    <button
                      className="btn secondary"
                      disabled={busy}
                      onClick={() => setCancel(false)}
                    >
                      Conservar
                    </button>
                    <button
                      className="btn danger"
                      disabled={busy}
                      onClick={async () => {
                        setBusy(true);
                        try {
                          await send(`/me/orders/${id}/cancel`, {});
                          setCancel(false);
                          reload();
                          refresh();
                          toast.success('Pedido cancelado');
                        } catch (reason) {
                          toast.error(
                            reason instanceof Error ? reason.message : 'No se pudo cancelar',
                          );
                        } finally {
                          setBusy(false);
                        }
                      }}
                    >
                      Sí, cancelar
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
