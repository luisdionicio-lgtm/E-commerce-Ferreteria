import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Search,
  ArrowUpRight,
  Phone,
  MapPin,
  ShieldCheck,
  Truck,
  Headphones,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { useApp } from '../app/context';
export default function PublicLayout() {
  const { cart, settings, user } = useApp();
  const [term, setTerm] = useState('');
  const [open, setOpen] = useState(false);
  const go = useNavigate();
  return (
    <div className="public-shell">
      <div className="announcement">
        <span>Herramientas para grandes ideas.</span>
        <span>
          <MapPin size={13} />
          {settings?.address || 'Lima, Perú'}
          <span className="divider">|</span>
          <Phone size={13} />
          {settings?.phone || '999123456'}
        </span>
      </div>
      <header className="public-header">
        <Link to="/" className="brand">
          <span className="brand-icon">F</span>Ferre<span>Max</span>
          <span className="brand-period">.</span>
        </Link>
        <nav className={open ? 'open' : ''}>
          <NavLink to="/" end onClick={() => setOpen(false)}>
            Inicio
          </NavLink>
          <NavLink to="/catalogo" onClick={() => setOpen(false)}>
            Productos
          </NavLink>
          <Link to="/catalogo?categoria=cat-1" onClick={() => setOpen(false)}>
            Herramientas
          </Link>
          <Link to="/catalogo?categoria=cat-2" onClick={() => setOpen(false)}>
            Pinturas
          </Link>
        </nav>
        <div className="public-tools">
          <Link className="account-link" to={user ? '/mi-cuenta' : '/ingresar'}>
            {user ? 'Mi cuenta' : 'Ingresar'}
          </Link>
          <form
            className="public-search"
            onSubmit={(e) => {
              e.preventDefault();
              go('/catalogo?q=' + encodeURIComponent(term));
            }}
          >
            <Search size={17} />
            <input
              aria-label="Buscar en el catálogo"
              placeholder="¿Qué necesitas?"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
            />
          </form>
          <Link className="cart-link" to="/carrito" aria-label="Ver carrito">
            <ShoppingBag size={22} />
            <span>{cart.reduce((n: number, c: any) => n + c.quantity, 0)}</span>
          </Link>
          <button
            className="icon-button public-menu"
            onClick={() => setOpen(!open)}
            aria-label="Mostrar menú"
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
      <section className="trust-strip">
        <div>
          <ShieldCheck />
          <span>
            <strong>Compra con confianza</strong>
            <small>Precios claros y stock disponible</small>
          </span>
        </div>
        <div>
          <Truck />
          <span>
            <strong>Coordina tu entrega</strong>
            <small>Atención directa con nuestra tienda</small>
          </span>
        </div>
        <div>
          <Headphones />
          <span>
            <strong>Te ayudamos a elegir</strong>
            <small>Asesoría para cada proyecto</small>
          </span>
        </div>
      </section>
      <footer className="public-footer">
        <div>
          <Link to="/" className="brand light">
            <span className="brand-icon">F</span>Ferre<span>Max</span>.
          </Link>
          <p>
            Todo empieza con una buena herramienta.
            <br />
            Nosotros te ayudamos a encontrarla.
          </p>
        </div>
        <div>
          <span className="eyebrow">ENCUÉNTRANOS</span>
          <p>
            {settings?.address}
            <br />
            {settings?.email}
            <br />
            {settings?.phone}
          </p>
        </div>
        <div>
          <span className="eyebrow">TU PRÓXIMO PROYECTO</span>
          <Link to="/catalogo" className="footer-cta">
            Explorar el catálogo
            <ArrowUpRight />
          </Link>
          <Link to="/login" className="admin-entry">
            Acceso de administración
          </Link>
        </div>
        <div className="footer-bottom">
          © {new Date().getFullYear()} FerreMax. Proyecto de demostración.
          <span>Pedidos sujetos a confirmación · Sin cobros online</span>
        </div>
      </footer>
    </div>
  );
}
