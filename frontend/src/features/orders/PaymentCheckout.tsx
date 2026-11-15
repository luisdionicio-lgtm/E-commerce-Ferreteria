import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Copy,
  Download,
  Info,
  QrCode,
  RefreshCw,
  ShieldCheck,
  XCircle,
  RotateCcw,
} from 'lucide-react';
import { Link } from '../../state/navigation';
import { useApp, money } from '../../state/context';
import { ErrorBox, Loading } from '../../components/ui';
import { send } from '../../services/api';
import { toast } from 'sonner';
import { usePrivateResource } from './usePrivateResource';
import { orderCode, paymentLabels, type PaymentScreen } from './types';

export default function PaymentCheckout({ id }: { id: string }) {
  const { data, loading, error, refresh } = usePrivateResource<PaymentScreen>(
    `/me/orders/${id}/payment`,
    true,
  );
  const { reload } = useApp();
  const [busy, setBusy] = useState(false);
  const [reference, setReference] = useState('');
  const act = async (path: string, body: object, message: string) => {
    if (busy) return;
    setBusy(true);
    try {
      await send(`/me/orders/${id}/payment${path}`, body);
      refresh();
      reload();
      toast.success(message);
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : 'No se pudo actualizar el pago');
    } finally {
      setBusy(false);
    }
  };
  if (loading && !data) return <Loading />;
  if (!data)
    return (
      <section className="store-container orders-page">
        <Link to={`/mis-pedidos/${id}`} className="order-back">
          <ArrowLeft size={16} /> Volver al pedido
        </Link>
        <ErrorBox message={error || 'No se encontró un pago iniciado'} />
        <button
          className="btn primary"
          disabled={busy}
          onClick={() => act('', {}, 'Pago preparado')}
        >
          Preparar QR
        </button>
      </section>
    );
  const { order, payment, demo } = data;
  const approved = payment.status === 'APROBADO';
  const reviewing = payment.status === 'EN_REVISION';
  const refunded = payment.status === 'REEMBOLSADO';
  return (
    <section className="store-container payment-page">
      <Link to={`/mis-pedidos/${id}`} className="order-back">
        <ArrowLeft size={16} /> Volver al pedido {orderCode(id)}
      </Link>
      <header className="payment-page-heading">
        <div>
          <h1>
            {approved
              ? 'Tu pago está registrado.'
              : reviewing
                ? 'Estamos revisando tu pago.'
                : refunded
                  ? 'Devolución registrada.'
                  : payment.status === 'REEMBOLSO_PENDIENTE'
                    ? 'Tu devolución está pendiente.'
                    : payment.status === 'CANCELADO'
                      ? 'Este pago está cancelado.'
                      : 'Un paso más para tu proyecto.'}
          </h1>
          <p>Pedido {orderCode(id)} · Pago con Yape</p>
        </div>
        <img src="/images/payments/yape.png" alt="Yape" width={64} height={64} />
      </header>
      {demo && (
        <div className="payment-demo-notice" role="note">
          <Info size={20} />
          <div>
            <strong>Estás en una demostración. No envíes dinero.</strong>
            <p>
              El QR es de prueba y no sirve para transferir desde Yape. Las aprobaciones y
              devoluciones de esta demo son simuladas.
            </p>
          </div>
        </div>
      )}
      {error && <ErrorBox message={error} />}
      <div className="payment-layout">
        <section className="payment-checkout-card" aria-label="Código QR y estado del pago">
          <header>
            <span
              className={`order-badge ${approved ? 'positive' : payment.status === 'RECHAZADO' ? 'negative' : 'waiting'}`}
            >
              {approved ? <CheckCircle2 size={15} /> : <Clock3 size={15} />}
              {paymentLabels[payment.status]}
            </span>
            <span className="payment-currency">PEN · Soles</span>
          </header>
          <div className="payment-amount">
            <span>Importe del pedido</span>
            <strong>{money(payment.amount)}</strong>
            <button
              type="button"
              aria-label="Copiar importe"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText((payment.amount / 100).toFixed(2));
                  toast.success('Importe copiado');
                } catch {
                  toast.error('No se pudo copiar. Puedes seleccionar el importe.');
                }
              }}
            >
              <Copy size={16} />
            </button>
          </div>
          {data.qr && data.canPay ? (
            <>
              <div className="payment-qr-frame">
                <img
                  src={data.qr}
                  width={288}
                  height={288}
                  alt={
                    demo
                      ? 'QR de demostración del pedido; no realiza transferencias'
                      : 'Código QR comercial de Yape configurado por la tienda'
                  }
                />
                <span>{demo ? 'QR DE DEMOSTRACIÓN' : 'QR DEL COMERCIO'}</span>
              </div>
              <div className="payment-merchant">
                <strong>{data.merchant.name}</strong>
                {data.merchant.phone && <span>{data.merchant.phone}</span>}
                <small>
                  {demo
                    ? 'No es un código bancario de Yape.'
                    : 'Comprueba el titular en Yape antes de confirmar.'}
                </small>
              </div>
              <a
                className="payment-download"
                href={data.qr}
                download={`ferremax-${demo ? 'demo' : 'yape'}-${id.slice(0, 8)}.png`}
              >
                <Download size={17} /> Descargar QR
              </a>
            </>
          ) : (
            <div className={`payment-result ${approved || refunded ? 'approved' : ''}`}>
              {refunded ? (
                <RotateCcw size={62} strokeWidth={1.3} />
              ) : approved ? (
                <CheckCircle2 size={62} strokeWidth={1.3} />
              ) : reviewing ? (
                <Clock3 size={62} strokeWidth={1.3} />
              ) : (
                <XCircle size={62} strokeWidth={1.3} />
              )}
              <h2>
                {approved
                  ? 'Todo listo para continuar.'
                  : reviewing
                    ? 'Tu operación fue enviada.'
                    : paymentLabels[payment.status]}
              </h2>
              <p>
                {approved
                  ? `${demo ? 'La aprobación es simulada. ' : ''}El pedido está confirmado y la tienda puede preparar tu selección.`
                  : reviewing
                    ? 'El personal verificará la operación. Reportarla no equivale a un pago aprobado.'
                    : payment.reviewNote ||
                      'Consulta el detalle del pedido para conocer el siguiente paso.'}
              </p>
              <Link className="btn secondary" to={`/mis-pedidos/${id}`}>
                Seguir mi pedido <ArrowRight size={17} />
              </Link>
            </div>
          )}
          {payment.reviewNote && !approved && (
            <p className="payment-review-note">{payment.reviewNote}</p>
          )}
          {payment.reference && (
            <p className="payment-operation">
              Operación registrada <strong>{payment.reference}</strong>
            </p>
          )}
          {payment.refundReference && (
            <p className="payment-operation">
              Referencia de devolución <strong>{payment.refundReference}</strong>
            </p>
          )}
        </section>
        <aside className="payment-instructions">
          <h2>{demo ? 'Conoce el flujo completo.' : 'Paga desde tu app de Yape.'}</h2>
          <ol>
            <li>
              <span>1</span>
              <div>
                <strong>{demo ? 'Revisa tu pedido' : 'Escanea el QR comercial'}</strong>
                <p>
                  {demo
                    ? 'El importe viene del pedido y no puede modificarse desde esta pantalla.'
                    : 'Abre Yape y comprueba que el titular corresponda a la tienda.'}
                </p>
              </div>
            </li>
            <li>
              <span>2</span>
              <div>
                <strong>{demo ? 'Prueba el resultado' : 'Introduce el importe exacto'}</strong>
                <p>
                  {demo
                    ? 'Simula una aprobación o un rechazo, o envía el pago a revisión del administrador.'
                    : `Ingresa ${money(payment.amount)} en Yape y confirma allí la transferencia.`}
                </p>
              </div>
            </li>
            <li>
              <span>3</span>
              <div>
                <strong>{demo ? 'Sigue la preparación' : 'Reporta la operación'}</strong>
                <p>
                  {demo
                    ? 'Al aprobar se confirma el pedido y se actualiza el inventario. Después la tienda avanza la entrega.'
                    : 'La tienda verifica el abono y confirma el pedido. No basta con presionar “Ya pagué”.'}
                </p>
              </div>
            </li>
          </ol>
          {data.canPay && demo && (
            <div className="payment-demo-actions">
              <button
                className="btn yape-action"
                disabled={busy}
                onClick={() =>
                  act(
                    '/simulate',
                    { outcome: 'approved' },
                    'Pago demo aprobado. No se transfirió dinero.',
                  )
                }
              >
                <CheckCircle2 size={18} /> {busy ? 'Procesando…' : 'Simular pago aprobado'}
              </button>
              <button
                className="btn secondary"
                disabled={busy}
                onClick={() =>
                  act('/simulate', { outcome: 'rejected' }, 'Rechazo de demostración registrado')
                }
              >
                <XCircle size={17} /> Simular rechazo
              </button>
              <button
                className="payment-review-link"
                disabled={busy}
                onClick={() =>
                  act(
                    '/report',
                    { reference: `DEMO-${crypto.randomUUID()}` },
                    'Pago demo enviado a revisión',
                  )
                }
              >
                Probar revisión manual <ArrowRight size={16} />
              </button>
            </div>
          )}
          {data.canPay && !demo && (
            <form
              className="payment-reference-form"
              onSubmit={(event) => {
                event.preventDefault();
                void act(
                  '/report',
                  { reference: reference.trim() },
                  'Operación enviada a revisión',
                );
              }}
            >
              <label>
                Número de operación
                <input
                  value={reference}
                  onChange={(event) => setReference(event.target.value)}
                  required
                  minLength={6}
                  maxLength={50}
                  pattern="[A-Za-z0-9 -]+"
                  placeholder="La referencia de tu comprobante"
                  autoComplete="off"
                  aria-describedby="payment-reference-help"
                />
              </label>
              <p id="payment-reference-help">
                Solo la referencia de la operación. Nunca ingreses tu PIN, contraseña o código de
                aprobación.
              </p>
              <button className="btn yape-action" disabled={busy}>
                {busy ? 'Enviando…' : 'Ya pagué · enviar a revisión'}
                <ArrowRight size={17} />
              </button>
            </form>
          )}
          {reviewing && (
            <button className="btn secondary" onClick={refresh}>
              <RefreshCw size={17} /> Consultar estado
            </button>
          )}
          <div className="payment-assurance">
            <ShieldCheck size={19} />
            <p>
              {demo
                ? 'Simulación local. No hay comunicación con servidores bancarios.'
                : 'La transferencia se hace en Yape. Este sistema registra la revisión manual del comercio.'}
            </p>
          </div>
          <div className="payment-order-mini">
            <QrCode size={20} />
            <div>
              <strong>Un pago asociado a tu pedido</strong>
              <span>
                El estado se actualiza automáticamente mientras esta pantalla está abierta.
              </span>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
