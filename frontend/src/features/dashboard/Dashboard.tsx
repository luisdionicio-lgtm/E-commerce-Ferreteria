import { Link } from 'react-router-dom';
import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  ArrowUpRight,
  ArrowRight,
  Package,
  Wallet,
  ShoppingBag,
  Boxes,
  Plus,
  TriangleAlert,
  CalendarClock,
  Receipt,
  ArrowDownLeft,
} from 'lucide-react';
import { useApp, useResource, money, dateLabel } from '../../app/context';
import { PageHeader, Loading, ErrorBox, Empty, Status } from '../../components/ui';
export default function Dashboard() {
  const { user } = useApp();
  const { data: d, loading, error } = useResource('/admin/dashboard');
  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} />;
  const stats = [
    ['Ventas confirmadas', money(d.revenue), Wallet, 'Desde el inicio del registro'],
    ['Productos activos', String(d.productCount), Package, 'En tu catálogo'],
    ['Valor de inventario', money(d.inventoryValue), Boxes, 'Valorizado al costo'],
    ['Pedidos pendientes', String(d.pendingOrders).padStart(2, '0'), ShoppingBag, 'Por confirmar'],
  ];
  return (
    <>
      <PageHeader title="Vista general" subtitle="Una mirada clara a lo que pasa en tu ferretería.">
        <span className="date-chip">
          <CalendarClock size={16} />
          {dateLabel(new Date().toISOString())}
        </span>
        <Link to="/admin/ventas" className="btn primary">
          <Plus size={17} />
          Nueva venta
        </Link>
      </PageHeader>
      <section className="welcome-banner">
        <div>
          <span className="eyebrow">TU NEGOCIO, EN BUENAS MANOS</span>
          <h2>
            Buen día, {user.name.split(' ')[0]}.<span>Todo empieza con el control.</span>
          </h2>
          <p>
            Tienes <strong>{d.low.length} productos con stock bajo</strong> y {d.pendingOrders}{' '}
            pedidos esperando confirmación.
          </p>
          <Link to="/admin/inventario">
            Revisar inventario
            <ArrowRight size={17} />
          </Link>
        </div>
        <div className="welcome-art">
          <span className="welcome-orbit" />
          <img src="/images/reference/tools-stanley.jpg" alt="Set de herramientas Stanley" />
          <span className="welcome-label">
            <i />
            FERREMAX WORKSPACE
          </span>
        </div>
      </section>
      <section className="stat-grid">
        {stats.map(([label, value, Icon, note]: any, i: number) => (
          <article className="stat-card" key={label}>
            <div>
              <span>{label}</span>
              <span className={'stat-icon stat-' + i}>
                <Icon size={19} />
              </span>
            </div>
            <strong>{value}</strong>
            <small>{note}</small>
          </article>
        ))}
      </section>
      <section className="dashboard-grid">
        <article className="panel revenue-panel">
          <div className="panel-heading">
            <div>
              <h3>Actividad de ventas</h3>
              <p>Ingresos confirmados · últimos 7 días</p>
            </div>
            <Link to="/admin/reportes" className="icon-button" aria-label="Ver reportes">
              <ArrowUpRight size={19} />
            </Link>
          </div>
          <div className="chart-summary">
            <strong>{money(d.days.reduce((n: number, x: any) => n + x.total * 100, 0))}</strong>
            <span className="chart-legend">
              <i />
              Ventas en soles
            </span>
          </div>
          <div className="chart">
            <ResponsiveContainer width="100%" height={235}>
              <AreaChart data={d.days} margin={{ left: 0, right: 15, top: 16, bottom: 0 }}>
                <defs>
                  <linearGradient id="sales-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7a957f" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#7a957f" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#eceee8" strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#8a9189', fontSize: 11 }}
                  dy={8}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#8a9189', fontSize: 11 }}
                  width={45}
                />
                <Tooltip
                  formatter={(v: any) => ['S/ ' + Number(v).toFixed(2), 'Ventas']}
                  contentStyle={{ border: '1px solid #e6e8e0', borderRadius: 12, fontSize: 12 }}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#526f59"
                  strokeWidth={2.5}
                  fill="url(#sales-fill)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>
        <article className="panel alert-panel">
          <div className="panel-heading">
            <div>
              <h3>Requieren tu atención</h3>
              <p>Anticípate a lo importante</p>
            </div>
            <span className="alert-number">{d.low.length + d.expiring.length}</span>
          </div>
          <Link className="alert-summary" to="/admin/inventario">
            <span className="alert-symbol orange">
              <TriangleAlert size={20} />
            </span>
            <div>
              <strong>Stock por reponer</strong>
              <small>{d.low.length} productos bajo el mínimo</small>
            </div>
            <ArrowUpRight size={17} />
          </Link>
          <Link className="alert-summary" to="/admin/vencimientos">
            <span className="alert-symbol sage">
              <CalendarClock size={20} />
            </span>
            <div>
              <strong>Vencimientos próximos</strong>
              <small>{d.expiring.length} lotes en los próximos 60 días</small>
            </div>
            <ArrowUpRight size={17} />
          </Link>
          <div className="alert-products">
            {d.low.slice(0, 3).map((p: any) => (
              <div key={p.id}>
                <img src={p.image} alt="" />
                <span>
                  <strong>{p.name}</strong>
                  <small>Mínimo: {p.minStock} unidades</small>
                </span>
                <b>{p.availableStock}</b>
              </div>
            ))}
          </div>
          <Link className="text-link" to="/admin/inventario">
            Ver todos los productos
            <ArrowRight size={16} />
          </Link>
        </article>
      </section>
      <section className="dashboard-grid bottom">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <h3>Últimas ventas</h3>
              <p>Operaciones registradas recientemente</p>
            </div>
            <Link className="text-link" to="/admin/ventas">
              Ver todas
              <ArrowUpRight size={16} />
            </Link>
          </div>
          {d.recentSales.length ? (
            <div className="recent-sales">
              {d.recentSales.map((s: any) => (
                <div key={s.id}>
                  <span className="sale-icon">
                    <Receipt size={19} />
                  </span>
                  <div>
                    <strong>Venta #{s.id.slice(0, 8).toUpperCase()}</strong>
                    <small>
                      {dateLabel(s.createdAt)} · {s.payment.toLowerCase()}
                    </small>
                  </div>
                  <Status value={s.status} />
                  <strong>{money(s.total)}</strong>
                </div>
              ))}
            </div>
          ) : (
            <Empty title="Registra tu primera venta" />
          )}
        </article>
        <article className="quick-panel">
          <span className="eyebrow">MENOS CLICS. MÁS ACCIÓN.</span>
          <h3>Tu siguiente paso.</h3>
          <p>Registra las operaciones que mantienen tu negocio en movimiento.</p>
          <Link to="/admin/compras">
            <span className="quick-icon">
              <ArrowDownLeft size={18} />
            </span>
            <span>
              Registrar compra<small>Recibe y repón tus productos</small>
            </span>
            <ArrowUpRight size={18} />
          </Link>
          <Link to="/admin/productos">
            <span className="quick-icon">
              <Package size={18} />
            </span>
            <span>
              Gestionar productos<small>Un catálogo siempre al día</small>
            </span>
            <ArrowUpRight size={18} />
          </Link>
        </article>
      </section>
    </>
  );
}
