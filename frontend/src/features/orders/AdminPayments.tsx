import { useState } from 'react';
import { CheckCircle2, ReceiptText, RotateCcw, XCircle } from 'lucide-react';
import { useApp, useResource, money, dateLabel } from '../../state/context';
import { DataTable, ErrorBox, Loading, Modal, PageHeader, SearchInput } from '../../components/ui';
import { send } from '../../services/api';
import { Link } from '../../state/navigation';
import { toast } from 'sonner';
import { orderCode, paymentLabels, type Payment } from './types';

type ReviewPayment = Payment & { orderId: string; customerName: string; orderStatus: string };
type Action = { payment: ReviewPayment; decision: 'approve' | 'reject' | 'refund' };
export default function AdminPayments() {
  const { data, loading, error } = useResource<ReviewPayment[]>('/admin/payments');
  const { reload } = useApp();
  const [term, setTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [action, setAction] = useState<Action | null>(null);
  const [note, setNote] = useState('');
  const [reference, setReference] = useState('');
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} />;
  const rows = (data || []).filter(
    (row) =>
      (filter === 'all' || row.status === filter) &&
      `${row.customerName} ${row.orderId} ${row.reference || ''}`
        .toLowerCase()
        .includes(term.toLowerCase()),
  );
  const open = (payment: ReviewPayment, decision: Action['decision']) => {
    setAction({ payment, decision });
    setNote(payment.mode === 'demo' ? 'Revisión de demostración. No se transfirió dinero.' : '');
    setReference('');
    setChecked(false);
    setFormError('');
  };
  return (
    <>
      <PageHeader
        title="Pagos de pedidos"
        subtitle="Revisa operaciones, confirma abonos y resuelve devoluciones."
      />
      <div className="admin-payment-intro">
        <ReceiptText size={23} />
        <div>
          <strong>Una operación reportada todavía no es un pago aprobado.</strong>
          <p>
            En modo manual, comprueba titular, importe y operación en la cuenta del negocio. Los
            registros demo no representan dinero real.
          </p>
        </div>
      </div>
      <section className="panel">
        <div className="table-toolbar">
          <SearchInput
            value={term}
            onChange={setTerm}
            placeholder="Buscar pedido, cliente u operación"
          />
          <label className="payment-admin-filter">
            Estado del pago
            <select value={filter} onChange={(event) => setFilter(event.target.value)}>
              <option value="all">Todos los estados</option>
              {Object.entries(paymentLabels).map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <DataTable
          rows={rows}
          emptyText="Los pagos iniciados desde la tienda aparecerán aquí"
          columns={[
            {
              label: 'Pedido / cliente',
              render: (row: ReviewPayment) => (
                <div>
                  <strong>{orderCode(row.orderId)}</strong>
                  <small className="cell-sub">{row.customerName}</small>
                  <small className="cell-sub">{dateLabel(row.createdAt)}</small>
                </div>
              ),
            },
            {
              label: 'Medio',
              render: (row: ReviewPayment) => (
                <div className="payment-admin-method">
                  <img src="/images/payments/yape.png" alt="" width={32} height={32} />
                  <div>
                    <strong>Yape</strong>
                    <small>{row.mode === 'demo' ? 'Demostración' : 'Verificación manual'}</small>
                  </div>
                </div>
              ),
            },
            {
              label: 'Operación',
              render: (row: ReviewPayment) => (
                <span className="payment-admin-reference">
                  {row.reference || 'Aún no reportada'}
                </span>
              ),
            },
            {
              label: 'Importe',
              render: (row: ReviewPayment) => <strong>{money(row.amount)}</strong>,
            },
            {
              label: 'Estado',
              render: (row: ReviewPayment) => (
                <span
                  className={`order-badge ${['APROBADO', 'REEMBOLSADO'].includes(row.status) ? 'positive' : row.status === 'RECHAZADO' ? 'negative' : 'waiting'}`}
                >
                  {paymentLabels[row.status]}
                </span>
              ),
            },
            {
              label: 'Revisión',
              render: (row: ReviewPayment) => (
                <div className="row-actions">
                  {row.status === 'EN_REVISION' && (
                    <>
                      <button className="btn tiny secondary" onClick={() => open(row, 'approve')}>
                        <CheckCircle2 size={16} /> Revisar pago
                      </button>
                      <button
                        className="icon-button danger"
                        aria-label={`Rechazar pago ${orderCode(row.orderId)}`}
                        onClick={() => open(row, 'reject')}
                      >
                        <XCircle size={18} />
                      </button>
                    </>
                  )}
                  {row.status === 'REEMBOLSO_PENDIENTE' && (
                    <button className="btn tiny secondary" onClick={() => open(row, 'refund')}>
                      <RotateCcw size={16} />{' '}
                      {row.mode === 'demo' ? 'Simular devolución' : 'Registrar devolución'}
                    </button>
                  )}
                  {!['EN_REVISION', 'REEMBOLSO_PENDIENTE'].includes(row.status) && (
                    <span className="cell-sub">{row.reviewNote || 'Sin acciones pendientes'}</span>
                  )}
                </div>
              ),
            },
          ]}
        />
      </section>
      <p className="orders-privacy">
        La preparación y entrega se actualizan desde <Link to="/admin/pedidos">Pedidos web</Link>.
      </p>
      {action && (
        <Modal
          title={
            action.decision === 'refund'
              ? 'Registrar devolución'
              : action.decision === 'reject'
                ? 'Rechazar operación'
                : 'Verificar pago del pedido'
          }
          onClose={() => !busy && setAction(null)}
        >
          <form
            className="payment-review-form"
            onSubmit={async (event) => {
              event.preventDefault();
              setBusy(true);
              setFormError('');
              try {
                await send(
                  `/admin/payments/${action.payment.id}/${action.decision === 'refund' ? 'refund' : 'review'}`,
                  action.decision === 'refund'
                    ? reference
                      ? { reference }
                      : {}
                    : { decision: action.decision, note },
                );
                setAction(null);
                reload();
                toast.success('Revisión registrada');
              } catch (reason) {
                setFormError(reason instanceof Error ? reason.message : 'No se pudo registrar');
              } finally {
                setBusy(false);
              }
            }}
          >
            <div className="payment-review-summary">
              <strong>{orderCode(action.payment.orderId)}</strong>
              <span>{action.payment.customerName}</span>
              <strong>{money(action.payment.amount)}</strong>
              <span>{action.payment.reference || 'Sin referencia reportada'}</span>
            </div>
            {action.payment.mode === 'demo' ? (
              <p className="payment-demo-notice">
                Esta es una operación de demostración. No hay cobro ni devolución bancaria.
              </p>
            ) : (
              <p className="form-note">
                Verifica la operación real fuera del sistema antes de confirmar. Esta acción no
                contacta a Yape ni mueve fondos.
              </p>
            )}
            {action.decision === 'refund' ? (
              action.payment.mode === 'manual' && (
                <label>
                  Referencia de la devolución realizada
                  <input
                    value={reference}
                    onChange={(event) => setReference(event.target.value)}
                    minLength={6}
                    maxLength={50}
                    required
                  />
                </label>
              )
            ) : (
              <label>
                Nota de revisión
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  required
                  minLength={5}
                  maxLength={500}
                  rows={3}
                />
              </label>
            )}
            <label className="checkbox payment-review-check">
              <input
                type="checkbox"
                checked={checked}
                onChange={(event) => setChecked(event.target.checked)}
                required
              />
              {action.payment.mode === 'demo'
                ? 'Entiendo que se trata de una demostración sin dinero real.'
                : action.decision === 'refund'
                  ? 'He realizado y verificado la devolución fuera del sistema.'
                  : action.decision === 'reject'
                    ? 'He revisado la operación y el motivo del rechazo.'
                    : 'He verificado el abono y el importe en la cuenta del negocio.'}
            </label>
            {formError && (
              <p role="alert" className="field-error">
                {formError}
              </p>
            )}
            <div className="form-actions">
              <button
                type="button"
                className="btn secondary"
                disabled={busy}
                onClick={() => setAction(null)}
              >
                Volver
              </button>
              <button className="btn primary" disabled={busy || !checked}>
                {busy
                  ? 'Guardando…'
                  : action.decision === 'refund'
                    ? 'Registrar devolución'
                    : action.decision === 'reject'
                      ? 'Rechazar operación'
                      : 'Aprobar pago'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
