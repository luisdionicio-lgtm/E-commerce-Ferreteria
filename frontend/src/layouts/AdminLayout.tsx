import { useState } from 'react';
import { NavLink, Outlet, Link, useNavigate, Navigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Boxes,
  ShoppingBag,
  ShoppingCart,
  Receipt,
  Users,
  Truck,
  CalendarClock,
  Clock,
  ChartNoAxesCombined,
  Settings,
  LogOut,
  ArrowUpRight,
  PanelLeftClose,
  Menu,
  Tags,
  ShieldCheck,
  Search,
  Bell,
  X,
} from 'lucide-react';
import { useApp } from '../app/context';
import { Loading } from '../components/ui';
const groups = [
  {
    title: 'PRINCIPAL',
    items: [
      ['dashboard', 'Vista general', LayoutDashboard],
      ['productos', 'Productos', Package],
      ['categorias', 'Categorías', Tags],
      ['inventario', 'Inventario', Boxes],
    ],
  },
  {
    title: 'OPERACIONES',
    items: [
      ['compras', 'Compras', ShoppingCart],
      ['ventas', 'Ventas', Receipt],
      ['pedidos', 'Pedidos web', ShoppingBag],
      ['proveedores', 'Proveedores', Truck],
      ['clientes', 'Clientes', Users],
    ],
  },
  {
    title: 'CONTROL',
    items: [
      ['vencimientos', 'Vencimientos', CalendarClock],
      ['renovaciones', 'Renovaciones', Clock],
      ['reportes', 'Reportes', ChartNoAxesCombined],
      ['usuarios', 'Usuarios', ShieldCheck],
      ['configuracion', 'Configuración', Settings],
    ],
  },
];
export default function AdminLayout() {
  const { user, ready, signOut } = useApp();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  if (!ready) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  if (!['ADMIN', 'EMPLOYEE'].includes(user.role)) return <Navigate to="/mi-cuenta" replace />;
  return (
    <div className="admin-shell">
      {open && (
        <button className="sidebar-scrim" aria-label="Cerrar menú" onClick={() => setOpen(false)} />
      )}
      <aside className={'sidebar ' + (open ? 'open' : '')}>
        <Link className="brand light" to="/admin/dashboard">
          <span className="brand-icon">F</span>Ferre<span>Max</span>
          <small>GESTIÓN</small>
        </Link>
        <button
          className="mobile-close icon-button"
          onClick={() => setOpen(false)}
          aria-label="Cerrar menú"
        >
          <X />
        </button>
        <div className="workspace-chip">
          <span className="workspace-avatar">FM</span>
          <div>
            <strong>FerreMax · Lima</strong>
            <small>Espacio de trabajo</small>
          </div>
          <PanelLeftClose size={15} />
        </div>
        <nav>
          {groups.map((g) => (
            <div className="nav-group" key={g.title}>
              <p>{g.title}</p>
              {g.items
                .filter(
                  ([key]) =>
                    user.role === 'ADMIN' || !['usuarios', 'configuracion'].includes(key as string),
                )
                .map(([key, label, Icon]: any) => (
                  <NavLink key={key} to={'/admin/' + key} onClick={() => setOpen(false)}>
                    <Icon size={18} />
                    <span>{label}</span>
                    {key === 'dashboard' && <span className="nav-dot" />}
                  </NavLink>
                ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <Link to="/" className="store-link">
            Ver tienda online
            <ArrowUpRight size={17} />
          </Link>
          <div className="sidebar-user">
            <span className="avatar">
              {user.name
                .split(' ')
                .map((x: string) => x[0])
                .slice(0, 2)
                .join('')}
            </span>
            <div>
              <strong>{user.name}</strong>
              <small>{user.role === 'ADMIN' ? 'Administrador' : 'Empleado'}</small>
            </div>
            <button
              className="icon-button"
              aria-label="Cerrar sesión"
              onClick={async () => {
                await signOut();
                navigate('/login');
              }}
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>
      <div className="admin-main">
        <header className="admin-top">
          <div className="top-left">
            <button
              className="icon-button menu-toggle"
              aria-label="Abrir menú"
              onClick={() => setOpen(true)}
            >
              <Menu />
            </button>
            <span className="breadcrumb">
              Espacio de trabajo <span>/</span> <strong>Administración</strong>
            </span>
          </div>
          <div className="top-right">
            <Link to="/admin/productos" className="top-search">
              <Search size={16} />
              <span>Buscar productos</span>
            </Link>
            <span className="online">
              <i />
              Sistema activo
            </span>
            <Link to="/admin/vencimientos" className="icon-button" aria-label="Ver alertas">
              <Bell size={19} />
            </Link>
            <span className="avatar small">{user.name.slice(0, 1)}</span>
          </div>
        </header>
        <main className="admin-content">
          <Outlet />
        </main>
        <footer className="admin-footer">
          FerreMax · Cada producto, bajo control.<span>Moneda: PEN · Modo demostración local</span>
        </footer>
      </div>
    </div>
  );
}
