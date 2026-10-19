import { useState } from 'react';
import { BarChart, Bar, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { useResource, money, dateLabel } from '../../app/context';
import {
  PageHeader,
  DataTable,
  Loading,
  ErrorBox,
  ExportButton,
  Status,
} from '../../components/ui';
export default function Reports() {
  const { data: d, loading, error } = useResource('/admin/reports/sales');
  const { data: products } = useResource<any[]>('/admin/products');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} />;
  const sales = d.sales.filter(
    (s: any) =>
      (!from || s.createdAt.slice(0, 10) >= from) && (!to || s.createdAt.slice(0, 10) <= to),
  );
  const valid = sales.filter((s: any) => s.status === 'CONFIRMADA');
  const revenue = valid.reduce((n: number, s: any) => n + s.total, 0);
  const top = (products || [])
    .map((p) => ({
      ...p,
      units: d.items
        .filter((i: any) => i.productId === p.id && valid.some((s: any) => s.id === i.saleId))
        .reduce((n: number, i: any) => n + i.quantity, 0),
    }))
    .filter((p) => p.units > 0)
    .sort((a, b) => b.units - a.units)
    .slice(0, 5);
  const byDay = Object.entries(
    valid.reduce(
      (o: any, s: any) => ({
        ...o,
        [s.createdAt.slice(0, 10)]: (o[s.createdAt.slice(0, 10)] || 0) + s.total / 100,
      }),
      {},
    ),
  )
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, total]) => ({ date, total }));
  return (
    <>
      <PageHeader title="Reportes" subtitle="Convierte tus operaciones en decisiones claras.">
        <ExportButton
          rows={sales.map((s: any) => ({
            codigo: s.id,
            fecha: s.createdAt,
            estado: s.status,
            pago: s.payment,
            total_soles: (s.total / 100).toFixed(2),
          }))}
          name="reporte-ventas"
        />
      </PageHeader>
      <section className="panel report-filters">
        <div>
          <h3>Período de consulta</h3>
          <p>Filtra las ventas por fecha de registro.</p>
        </div>
        <label>
          Desde
          <input
            type="date"
            value={from}
            max={to || undefined}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label>
          Hasta
          <input
            type="date"
            value={to}
            min={from || undefined}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
        <button
          className="btn secondary"
          onClick={() => {
            setFrom('');
            setTo('');
          }}
        >
          Limpiar
        </button>
      </section>
      <div className="mini-stats">
        <div>
          <span>Ventas confirmadas</span>
          <strong>{valid.length}</strong>
        </div>
        <div>
          <span>Ingresos del período</span>
          <strong>{money(revenue)}</strong>
        </div>
        <div>
          <span>Ticket promedio</span>
          <strong>{money(valid.length ? Math.round(revenue / valid.length) : 0)}</strong>
        </div>
        <div>
          <span>Ventas anuladas</span>
          <strong>{sales.filter((s: any) => s.status === 'ANULADA').length}</strong>
        </div>
      </div>
      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h3>Ingresos por fecha</h3>
              <p>Solo ventas confirmadas · S/</p>
            </div>
          </div>
          <div className="chart">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={byDay}>
                <CartesianGrid vertical={false} stroke="#eceee8" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: any) => 'S/ ' + Number(v).toFixed(2)} />
                <Bar
                  dataKey="total"
                  fill="#69816b"
                  radius={[5, 5, 0, 0]}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h3>Los más vendidos</h3>
              <p>Unidades confirmadas en el período</p>
            </div>
          </div>
          <DataTable
            rows={top}
            columns={[
              {
                label: 'Producto',
                render: (p: any) => (
                  <div className="product-cell">
                    <img src={p.image} alt="" />
                    <strong>{p.name}</strong>
                  </div>
                ),
              },
              { label: 'Unidades', render: (p: any) => <strong>{p.units}</strong> },
            ]}
            emptyText="Aún no hay ventas en este período"
          />
        </section>
      </div>
      <section className="panel report-table">
        <div className="panel-heading">
          <h3>Detalle de ventas</h3>
        </div>
        <DataTable
          rows={[...sales].reverse()}
          columns={[
            {
              label: 'Código',
              render: (s: any) => <span className="mono">#{s.id.slice(0, 8).toUpperCase()}</span>,
            },
            { label: 'Fecha', render: (s: any) => dateLabel(s.createdAt) },
            { label: 'Medio de pago', render: (s: any) => s.payment },
            { label: 'Estado', render: (s: any) => <Status value={s.status} /> },
            { label: 'Total', render: (s: any) => <strong>{money(s.total)}</strong> },
          ]}
        />
      </section>
    </>
  );
}
