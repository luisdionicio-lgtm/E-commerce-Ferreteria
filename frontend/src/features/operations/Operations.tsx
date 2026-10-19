import { useState } from 'react';
import { Plus, Trash2, Check, Eye, RotateCcw, PackageCheck, ShoppingBag } from 'lucide-react';
import { useApp, useResource, money, dateLabel } from '../../app/context';
import {
  PageHeader,
  DataTable,
  Modal,
  Loading,
  ErrorBox,
  SearchInput,
  ExportButton,
  Status,
} from '../../components/ui';
import { send } from '../../services/api';
import { toast } from 'sonner';
type Line = { productId: string; quantity: number; cost: string; expiresAt: string };
export default function Operations({ module }: { module: 'compras' | 'ventas' | 'pedidos' }) {
  const kind = module === 'compras' ? 'purchases' : module === 'ventas' ? 'sales' : 'orders';
  const { data: d, loading, error } = useResource('/admin/' + kind);
  const { data: products } = useResource<any[]>('/admin/products');
  const { data: suppliers } = useResource<any[]>('/admin/suppliers');
  const { data: customers } = useResource<any[]>('/admin/customers');
  const { user, reload } = useApp();
  const [term, setTerm] = useState('');
  const [status, setStatus] = useState('all');
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<any>(null);
  const [action, setAction] = useState<{ record: any; type: string } | null>(null);
  const [lines, setLines] = useState<Line[]>([
    { productId: '', quantity: 1, cost: '', expiresAt: '' },
  ]);
  const [party, setParty] = useState('');
  const [payment, setPayment] = useState('EFECTIVO');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} />;
  const product = (id: string) => products?.find((p) => p.id === id);
  const rows = d.records.filter(
    (r: any) =>
      JSON.stringify(r).toLowerCase().includes(term.toLowerCase()) &&
      (status === 'all' || r.status === status),
  );
  const total = lines.reduce(
    (n, l) =>
      n +
      (module === 'compras' ? Math.round(Number(l.cost) * 100) : product(l.productId)?.price || 0) *
        l.quantity,
    0,
  );
  const change = (i: number, key: keyof Line, value: any) =>
    setLines((old) => old.map((l, j) => (j === i ? { ...l, [key]: value } : l)));
  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFormError('');
    try {
      const items = lines.map((l) => ({
        productId: l.productId,
        quantity: Number(l.quantity),
        ...(module === 'compras'
          ? { cost: Math.round(Number(l.cost) * 100), expiresAt: l.expiresAt || null }
          : {}),
      }));
      await send(
        '/admin/' + kind,
        module === 'compras'
          ? { supplierId: party, items }
          : { customerId: party || undefined, items, payment },
      );
      setOpen(false);
      reload();
      toast.success(
        module === 'compras'
          ? 'Compra registrada. Confirma recepción para ingresar stock.'
          : 'Venta confirmada y stock actualizado',
      );
    } catch (e: any) {
      setFormError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const perform = async () => {
    if (!action) return;
    setBusy(true);
    try {
      if (action.type === 'confirm')
        await send('/admin/sales', { orderId: action.record.id, items: [], payment: 'EFECTIVO' });
      else await send('/admin/' + kind + '/' + action.record.id + '/' + action.type, {});
      setAction(null);
      reload();
      toast.success('Operación completada');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <PageHeader
        title={module === 'compras' ? 'Compras' : module === 'ventas' ? 'Ventas' : 'Pedidos web'}
        subtitle={
          module === 'compras'
            ? 'Recibe productos y mantén tu inventario abastecido.'
            : module === 'ventas'
              ? 'Cada venta confirmada actualiza tu stock.'
              : 'Solicitudes de clientes, listas para revisar y confirmar.'
        }
      >
        <ExportButton rows={rows} name={module} />
        {module !== 'pedidos' && (
          <button
            className="btn primary"
            onClick={() => {
              setOpen(true);
              setParty('');
              setLines([{ productId: '', quantity: 1, cost: '', expiresAt: '' }]);
              setFormError('');
            }}
          >
            <Plus size={17} />
            Nueva {module === 'compras' ? 'compra' : 'venta'}
          </button>
        )}
      </PageHeader>
      <div className="mini-stats three">
        <div>
          <span>Operaciones registradas</span>
          <strong>{d.records.length}</strong>
        </div>
        <div>
          <span>
            Importe{' '}
            {module === 'compras' ? 'recibido' : module === 'ventas' ? 'confirmado' : 'solicitado'}
          </span>
          <strong>
            {money(
              d.records
                .filter((x: any) =>
                  module === 'compras'
                    ? x.status === 'RECIBIDA'
                    : module === 'ventas'
                      ? x.status === 'CONFIRMADA'
                      : x.status !== 'ANULADO',
                )
                .reduce((n: number, x: any) => n + x.total, 0),
            )}
          </strong>
        </div>
        <div>
          <span>{module === 'ventas' ? 'Ventas anuladas' : 'Pendientes'}</span>
          <strong className="orange-text">
            {
              d.records.filter(
                (x: any) => x.status === (module === 'ventas' ? 'ANULADA' : 'PENDIENTE'),
              ).length
            }
          </strong>
        </div>
      </div>
      <section className="panel">
        <div className="table-toolbar">
          <div className="table-tabs">
            <button className={status === 'all' ? 'active' : ''} onClick={() => setStatus('all')}>
              Todas<span>{d.records.length}</span>
            </button>
            {[...new Set(d.records.map((r: any) => r.status))].map((s: any) => (
              <button className={status === s ? 'active' : ''} key={s} onClick={() => setStatus(s)}>
                {s.toLowerCase()}
              </button>
            ))}
          </div>
          <SearchInput value={term} onChange={setTerm} placeholder="Buscar código o cliente…" />
        </div>
        <DataTable
          rows={rows}
          columns={[
            {
              label: 'Operación',
              render: (r: any) => (
                <div>
                  <strong className="mono">#{r.id.slice(0, 8).toUpperCase()}</strong>
                  <small className="cell-sub">{dateLabel(r.createdAt)}</small>
                </div>
              ),
            },
            {
              label: module === 'compras' ? 'Proveedor' : 'Cliente',
              render: (r: any) =>
                module === 'pedidos' ? (
                  <div>
                    <strong>{r.customerName}</strong>
                    <small className="cell-sub">{r.phone}</small>
                  </div>
                ) : module === 'compras' ? (
                  suppliers?.find((x) => x.id === r.supplierId)?.name
                ) : (
                  customers?.find((x) => x.id === r.customerId)?.name || 'Venta al público'
                ),
            },
            {
              label: 'Productos',
              render: (r: any) =>
                d.items
                  .filter(
                    (i: any) =>
                      i[
                        kind === 'purchases'
                          ? 'purchaseId'
                          : kind === 'sales'
                            ? 'saleId'
                            : 'orderId'
                      ] === r.id,
                  )
                  .reduce((n: number, i: any) => n + i.quantity, 0),
            },
            { label: 'Total', render: (r: any) => <strong>{money(r.total)}</strong> },
            { label: 'Estado', render: (r: any) => <Status value={r.status} /> },
            {
              label: 'Acciones',
              render: (r: any) => (
                <div className="row-actions">
                  <button
                    className="icon-button"
                    onClick={() => setDetail(r)}
                    aria-label="Ver detalle"
                  >
                    <Eye size={17} />
                  </button>
                  {module === 'compras' && r.status === 'PENDIENTE' && (
                    <button
                      className="btn tiny secondary"
                      onClick={() => setAction({ record: r, type: 'receive' })}
                    >
                      <PackageCheck size={15} />
                      Recibir
                    </button>
                  )}
                  {module === 'ventas' && r.status === 'CONFIRMADA' && user.role === 'ADMIN' && (
                    <button
                      className="icon-button danger"
                      aria-label="Anular venta"
                      onClick={() => setAction({ record: r, type: 'cancel' })}
                    >
                      <RotateCcw size={17} />
                    </button>
                  )}
                  {module === 'pedidos' && r.status === 'PENDIENTE' && (
                    <>
                      <button
                        className="btn tiny secondary"
                        onClick={() => setAction({ record: r, type: 'confirm' })}
                      >
                        <Check size={15} />
                        Confirmar
                      </button>
                      <button
                        className="icon-button danger"
                        aria-label="Anular pedido"
                        onClick={() => setAction({ record: r, type: 'cancel' })}
                      >
                        <RotateCcw size={17} />
                      </button>
                    </>
                  )}
                </div>
              ),
            },
          ]}
          emptyText={
            module === 'pedidos'
              ? 'Los pedidos de la tienda aparecerán aquí'
              : 'Registra tu primera operación'
          }
        />
      </section>
      {open && (
        <Modal
          wide
          title={'Nueva ' + (module === 'compras' ? 'compra' : 'venta')}
          onClose={() => !busy && setOpen(false)}
        >
          <form onSubmit={create}>
            <div className="form-grid">
              <label>
                {module === 'compras' ? 'Proveedor' : 'Cliente (opcional)'}
                <select
                  value={party}
                  onChange={(e) => setParty(e.target.value)}
                  required={module === 'compras'}
                >
                  <option value="">
                    {module === 'compras' ? 'Seleccionar proveedor' : 'Venta al público'}
                  </option>
                  {(module === 'compras' ? suppliers : customers)
                    ?.filter((x) => x.active)
                    .map((x) => (
                      <option value={x.id} key={x.id}>
                        {x.name}
                      </option>
                    ))}
                </select>
              </label>
              {module === 'ventas' && (
                <label>
                  Medio de pago
                  <select value={payment} onChange={(e) => setPayment(e.target.value)}>
                    <option>EFECTIVO</option>
                    <option>YAPE</option>
                    <option>TARJETA</option>
                  </select>
                </label>
              )}
            </div>
            <div className="form-section-title">
              <h3>Detalle de productos</h3>
              <button
                type="button"
                className="btn tiny secondary"
                onClick={() =>
                  setLines([...lines, { productId: '', quantity: 1, cost: '', expiresAt: '' }])
                }
              >
                <Plus size={15} />
                Añadir línea
              </button>
            </div>
            <div className="operation-lines">
              {lines.map((l, i) => (
                <div
                  className={'operation-line ' + (module === 'compras' ? 'purchase-line' : '')}
                  key={i}
                >
                  <label>
                    Producto
                    <select
                      required
                      value={l.productId}
                      onChange={(e) => change(i, 'productId', e.target.value)}
                    >
                      <option value="">Seleccionar producto</option>
                      {products
                        ?.filter((p) => p.active)
                        .map((p) => (
                          <option value={p.id} key={p.id}>
                            {p.name}
                            {module === 'ventas' ? ` · ${p.availableStock} disponibles` : ''}
                          </option>
                        ))}
                    </select>
                  </label>
                  <label>
                    Cantidad
                    <input
                      required
                      type="number"
                      min={1}
                      max={100000}
                      step="1"
                      value={l.quantity}
                      onChange={(e) => change(i, 'quantity', Number(e.target.value))}
                    />
                  </label>
                  {module === 'compras' ? (
                    <>
                      <label>
                        Costo S/
                        <input
                          required
                          type="number"
                          min={0}
                          max={1000000}
                          step=".01"
                          value={l.cost}
                          onChange={(e) => change(i, 'cost', e.target.value)}
                        />
                      </label>
                      <label>
                        Vence (opcional)
                        <input
                          type="date"
                          value={l.expiresAt}
                          onChange={(e) => change(i, 'expiresAt', e.target.value)}
                        />
                      </label>
                    </>
                  ) : (
                    <div className="line-total">
                      <small>Subtotal</small>
                      <strong>{money((product(l.productId)?.price || 0) * l.quantity)}</strong>
                    </div>
                  )}
                  <button
                    type="button"
                    className="icon-button danger"
                    disabled={lines.length === 1}
                    onClick={() => setLines(lines.filter((_, j) => i !== j))}
                    aria-label="Quitar línea"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              ))}
            </div>
            <div className="operation-total">
              <span>Total de {module === 'compras' ? 'compra' : 'venta'}</span>
              <strong>{money(total)}</strong>
            </div>
            <div className="form-note">
              {module === 'compras'
                ? 'Registrar la compra no aumenta el stock. Usa “Recibir” cuando lleguen los productos.'
                : 'El servidor valida existencias, recalcula el precio y descuenta los lotes con vencimiento más cercano.'}
            </div>
            {formError && <p className="field-error">{formError}</p>}
            <div className="form-actions">
              <button
                type="button"
                className="btn secondary"
                disabled={busy}
                onClick={() => setOpen(false)}
              >
                Cancelar
              </button>
              <button className="btn primary" disabled={busy}>
                {busy ? 'Registrando…' : 'Registrar ' + (module === 'compras' ? 'compra' : 'venta')}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {detail && (
        <Modal
          title={'Detalle #' + detail.id.slice(0, 8).toUpperCase()}
          onClose={() => setDetail(null)}
        >
          <div className="detail-operation-header">
            <Status value={detail.status} />
            <span>{dateLabel(detail.createdAt)}</span>
          </div>
          {module === 'pedidos' && (
            <div className="order-contact">
              <h3>{detail.customerName}</h3>
              <p>
                {detail.phone} · {detail.email || 'Sin correo'}
              </p>
              <p>{detail.address || 'Entrega a coordinar'}</p>
            </div>
          )}
          <div className="detail-operation-lines">
            {d.items
              .filter(
                (i: any) =>
                  i[
                    kind === 'purchases' ? 'purchaseId' : kind === 'sales' ? 'saleId' : 'orderId'
                  ] === detail.id,
              )
              .map((i: any) => (
                <div key={i.id}>
                  <span>
                    {product(i.productId)?.name || i.productId}
                    <small>
                      {i.quantity} × {money(i.price ?? i.cost)}
                    </small>
                  </span>
                  <strong>{money(i.quantity * (i.price ?? i.cost))}</strong>
                </div>
              ))}
          </div>
          <div className="operation-total">
            <span>Total registrado</span>
            <strong>{money(detail.total)}</strong>
          </div>
          {module === 'ventas' && (
            <p className="form-note">
              Registro interno de venta. No es una boleta o factura electrónica SUNAT.
            </p>
          )}
        </Modal>
      )}
      {action && (
        <Modal
          title={
            action.type === 'receive'
              ? 'Confirmar recepción'
              : action.type === 'confirm'
                ? 'Confirmar venta del pedido'
                : 'Anular operación'
          }
          onClose={() => !busy && setAction(null)}
        >
          <p className="confirm-copy">
            {action.type === 'receive'
              ? 'Los productos se ingresarán como nuevos lotes y aumentarán el stock.'
              : action.type === 'confirm'
                ? 'Se creará una venta con precios actuales y se descontará el stock disponible. Registra la confirmación después de verificar el pago.'
                : module === 'ventas'
                  ? 'Se anulará la venta y se devolverán las unidades a sus lotes originales.'
                  : 'Se anulará el pedido. No se modificará el stock.'}
          </p>
          <div className="operation-total">
            <span>Importe registrado</span>
            <strong>{money(action.record.total)}</strong>
          </div>
          <div className="form-actions">
            <button className="btn secondary" disabled={busy} onClick={() => setAction(null)}>
              Volver
            </button>
            <button className="btn primary" disabled={busy} onClick={perform}>
              {busy ? 'Procesando…' : 'Confirmar operación'}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
