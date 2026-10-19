import { useState } from 'react';
import {
  Boxes,
  SlidersHorizontal,
  ArrowDownLeft,
  ArrowUpRight,
  CalendarClock,
  TriangleAlert,
} from 'lucide-react';
import { useResource, useApp, money, dateLabel } from '../../app/context';
import {
  PageHeader,
  DataTable,
  Modal,
  Status,
  Loading,
  ErrorBox,
  SearchInput,
  ExportButton,
} from '../../components/ui';
import { send } from '../../services/api';
import { toast } from 'sonner';
export function Inventory() {
  const { data: d, loading, error } = useResource('/admin/inventory');
  const { reload } = useApp();
  const [tab, setTab] = useState('products');
  const [term, setTerm] = useState('');
  const [low, setLow] = useState(false);
  const [adjust, setAdjust] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} />;
  const product = (id: string) => d.products.find((p: any) => p.id === id);
  const lot = (id: string) => d.lots.find((p: any) => p.id === id);
  const rows = (tab === 'products' ? d.products : tab === 'lots' ? d.lots : d.movements).filter(
    (r: any) =>
      JSON.stringify({ ...r, name: product(r.productId)?.name })
        .toLowerCase()
        .includes(term.toLowerCase()) &&
      (!low || tab !== 'products' || r.availableStock <= r.minStock),
  );
  const cols =
    tab === 'products'
      ? [
          {
            label: 'Producto',
            render: (p: any) => (
              <div className="product-cell">
                <img src={p.image} alt="" />
                <div>
                  <strong>{p.name}</strong>
                  <small>{p.sku}</small>
                </div>
              </div>
            ),
          },
          { label: 'Stock total', render: (p: any) => <strong>{p.stock}</strong> },
          { label: 'Stock vendible', render: (p: any) => <strong>{p.availableStock}</strong> },
          { label: 'Mínimo', render: (p: any) => p.minStock },
          {
            label: 'Situación',
            render: (p: any) => (
              <Status
                value={
                  !p.availableStock
                    ? 'Agotado'
                    : p.availableStock <= p.minStock
                      ? 'Stock bajo'
                      : 'Disponible'
                }
              />
            ),
          },
        ]
      : tab === 'lots'
        ? [
            { label: 'Lote', render: (r: any) => <span className="mono">{r.code}</span> },
            { label: 'Producto', render: (r: any) => product(r.productId)?.name },
            { label: 'Cantidad', render: (r: any) => <strong>{r.quantity}</strong> },
            { label: 'Costo unitario', render: (r: any) => money(r.cost) },
            {
              label: 'Vencimiento',
              render: (r: any) => (r.expiresAt ? dateLabel(r.expiresAt) : 'No aplica'),
            },
            {
              label: 'Acción',
              render: (r: any) => (
                <button
                  className="btn tiny secondary"
                  onClick={() => {
                    setAdjust(r);
                    setFormError('');
                  }}
                >
                  <SlidersHorizontal size={15} />
                  Ajustar
                </button>
              ),
            },
          ]
        : [
            { label: 'Fecha', render: (r: any) => dateLabel(r.createdAt) },
            {
              label: 'Producto / lote',
              render: (r: any) => (
                <div>
                  <strong>{product(r.productId)?.name}</strong>
                  <small className="cell-sub">{lot(r.lotId)?.code}</small>
                </div>
              ),
            },
            {
              label: 'Tipo',
              render: (r: any) => (
                <span className={'movement-type ' + (r.quantity > 0 ? 'positive' : 'negative')}>
                  {r.quantity > 0 ? <ArrowDownLeft size={15} /> : <ArrowUpRight size={15} />}{' '}
                  {r.type.toLowerCase()}
                </span>
              ),
            },
            {
              label: 'Cantidad',
              render: (r: any) => (
                <strong className={r.quantity > 0 ? 'green-text' : 'orange-text'}>
                  {r.quantity > 0 ? '+' : ''}
                  {r.quantity}
                </strong>
              ),
            },
            { label: 'Motivo', render: (r: any) => r.reason },
            {
              label: 'Responsable',
              render: (r: any) => <span className="mono">{r.userId.slice(0, 8)}</span>,
            },
          ];
  return (
    <>
      <PageHeader title="Inventario" subtitle="Cada entrada, salida y ajuste tiene una historia.">
        <ExportButton rows={rows} name={'inventario-' + tab} />
        <button className="btn primary" onClick={() => setTab('lots')}>
          <SlidersHorizontal size={17} />
          Ajustar stock
        </button>
      </PageHeader>
      <div className="mini-stats">
        <div>
          <span>Unidades totales</span>
          <strong>{d.lots.reduce((n: number, l: any) => n + l.quantity, 0)}</strong>
        </div>
        <div>
          <span>Lotes registrados</span>
          <strong>{d.lots.length}</strong>
        </div>
        <div>
          <span>Productos bajo mínimo</span>
          <strong className="orange-text">
            {d.products.filter((p: any) => p.availableStock <= p.minStock && p.active).length}
          </strong>
        </div>
        <div>
          <span>Movimientos</span>
          <strong>{d.movements.length}</strong>
        </div>
      </div>
      <section className="panel">
        <div className="table-toolbar">
          <div className="table-tabs">
            {[
              ['products', 'Existencias'],
              ['lots', 'Lotes'],
              ['movements', 'Movimientos'],
            ].map(([key, label]) => (
              <button className={tab === key ? 'active' : ''} onClick={() => setTab(key)} key={key}>
                {label}
              </button>
            ))}
          </div>
          <SearchInput value={term} onChange={setTerm} placeholder="Buscar producto o lote…" />
        </div>
        {tab === 'products' && (
          <label className="checkbox table-option">
            <input type="checkbox" checked={low} onChange={(e) => setLow(e.target.checked)} />
            Mostrar solo stock bajo
          </label>
        )}
        <DataTable rows={rows} columns={cols} />
      </section>
      {adjust && (
        <Modal title="Ajustar existencias" onClose={() => !busy && setAdjust(null)}>
          <div className="adjust-info">
            <Boxes size={23} />
            <div>
              <strong>{product(adjust.productId)?.name}</strong>
              <p>
                Lote {adjust.code} · Stock actual: {adjust.quantity}
              </p>
            </div>
          </div>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const f = Object.fromEntries(new FormData(e.currentTarget));
              setBusy(true);
              setFormError('');
              try {
                await send('/admin/inventory/adjustments', {
                  lotId: adjust.id,
                  delta: Number(f.delta),
                  reason: f.reason,
                });
                toast.success('Stock ajustado');
                setAdjust(null);
                reload();
              } catch (e: any) {
                setFormError(e.message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <label>
              Cantidad a sumar o restar
              <input
                type="number"
                step="1"
                min={-adjust.quantity}
                max={100000}
                name="delta"
                required
                placeholder="Ejemplo: +5 o -2"
              />
            </label>
            <label>
              Motivo del ajuste
              <textarea
                rows={3}
                name="reason"
                required
                minLength={5}
                maxLength={500}
                placeholder="Indica por qué se corrige el stock"
              />
            </label>
            {formError && <p className="field-error">{formError}</p>}
            <div className="form-actions">
              <button
                type="button"
                className="btn secondary"
                disabled={busy}
                onClick={() => setAdjust(null)}
              >
                Cancelar
              </button>
              <button className="btn primary" disabled={busy}>
                {busy ? 'Guardando…' : 'Confirmar ajuste'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
export function Expirations() {
  const { data: d, loading, error } = useResource('/admin/dashboard');
  const [status, setStatus] = useState('all');
  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} />;
  const rows = d.expiring.filter(
    (r: any) => status === 'all' || (status === 'expired' ? r.expired : !r.expired),
  );
  return (
    <>
      <PageHeader
        title="Vencimientos"
        subtitle="Detecta lotes próximos a vencer y evita vender productos vencidos."
      >
        <ExportButton rows={rows} name="vencimientos" />
      </PageHeader>
      <div className="expiry-banner">
        <CalendarClock size={28} />
        <div>
          <h3>La fecha pertenece al lote.</h3>
          <p>
            Se muestran lotes con unidades y vencimiento dentro de 60 días, incluidos los vencidos.
            Los vencidos se excluyen del stock vendible.
          </p>
        </div>
      </div>
      <div className="mini-stats three">
        <div>
          <span>Lotes por revisar</span>
          <strong>{d.expiring.length}</strong>
        </div>
        <div>
          <span>Ya vencidos</span>
          <strong className="orange-text">{d.expiring.filter((x: any) => x.expired).length}</strong>
        </div>
        <div>
          <span>Próximos a vencer</span>
          <strong>{d.expiring.filter((x: any) => !x.expired).length}</strong>
        </div>
      </div>
      <section className="panel">
        <div className="table-toolbar">
          <div className="table-tabs">
            {[
              ['all', 'Todos'],
              ['upcoming', 'Próximos'],
              ['expired', 'Vencidos'],
            ].map(([k, l]) => (
              <button key={k} className={status === k ? 'active' : ''} onClick={() => setStatus(k)}>
                {l}
              </button>
            ))}
          </div>
          <span className="table-hint">
            <TriangleAlert size={15} />
            Prioriza el lote con vencimiento más cercano
          </span>
        </div>
        <DataTable
          rows={rows}
          columns={[
            { label: 'Producto', render: (r: any) => <strong>{r.product}</strong> },
            { label: 'Lote', render: (r: any) => <span className="mono">{r.code}</span> },
            { label: 'Unidades', render: (r: any) => r.quantity },
            { label: 'Vencimiento', render: (r: any) => dateLabel(r.expiresAt) },
            {
              label: 'Días restantes',
              render: (r: any) =>
                Math.ceil((new Date(r.expiresAt + 'T23:59:59').getTime() - Date.now()) / 86400000),
            },
            {
              label: 'Estado',
              render: (r: any) => <Status value={r.expired ? 'Vencido' : 'Próximo a vencer'} />,
            },
          ]}
          emptyText="No hay vencimientos próximos"
        />
      </section>
    </>
  );
}
