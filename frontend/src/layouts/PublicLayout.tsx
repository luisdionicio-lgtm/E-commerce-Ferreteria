import { Link, NavLink, useNavigate } from '../state/navigation';
import {
  ShoppingCart,
  Search,
  ArrowUpRight,
  Phone,
  MapPin,
  ShieldCheck,
  Truck,
  Store,
  Headphones,
  Mail,
  Menu,
  X,
  UserRound,
} from 'lucide-react';
import { useState } from 'react';
import { useApp } from '../state/context';
import BrandLogo from '../components/BrandLogo';
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const { cart, settings, user } = useApp();
  const [term, setTerm] = useState('');
  const [open, setOpen] = useState(false);
  const go = useNavigate();
  return (
    <div className="public-shell">
      <a className="skip-content" href="#store-content">
        Saltar al contenido
      </a>
      <div className="announcement">
        <div className="announcement-inner">
          <div className="announcement-benefits">
            <span><Truck size={16} /> Envíos a todo Lima</span>
            <span><ShieldCheck size={16} /> Compra segura</span>
            <span><Store size={16} /> Retiro coordinado</span>
          </div>
          <div className="announcement-contact">
            <span><MapPin size={15} /> {settings?.address || 'Lima, Perú'}</span>
            <span><Phone size={15} /> {settings?.phone || '999123456'}</span>
          </div>
        </div>
      </div>
      <header className="public-header">
        <Link to="/" className="brand" aria-label="FerreMax - Inicio">
          <BrandLogo />
        </Link>
        <nav
          id="store-navigation"
          aria-label="Navegación de la tienda"
          className={open ? 'open' : ''}
        >
          <NavLink to="/" end onClick={() => setOpen(false)}>
            Inicio
          </NavLink>
          <NavLink to="/catalogo" onClick={() => setOpen(false)}>
            Productos
          </NavLink>
          <Link to="/#categorias" onClick={() => setOpen(false)}>
            Categorías
          </Link>
          <Link to="/catalogo?orden=destacados" onClick={() => setOpen(false)}>
            Ofertas
          </Link>
        </nav>
        <div className="public-tools">
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
              placeholder="¿Qué necesitas para tu proyecto?"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
            />
          </form>
          <NavLink className="account-link" to={user ? '/mi-cuenta' : '/ingresar'}>
            <UserRound size={18} aria-hidden="true" />
            <span>{user ? 'Mi cuenta' : 'Ingresar'}</span>
          </NavLink>
          <Link className="cart-link" to="/carrito" aria-label="Ver carrito">
            <ShoppingCart size={24} />
            <span>{cart.reduce((n: number, c: any) => n + c.quantity, 0)}</span>
          </Link>
          <button
            className="icon-button public-menu"
            onClick={() => setOpen(!open)}
            aria-label="Mostrar menú"
            aria-expanded={open}
            aria-controls="store-navigation"
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      <main id="store-content" tabIndex={-1}>
        {children}
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
        <div className="footer-brand-block">
          <Link to="/" className="brand light" aria-label="FerreMax - Inicio">
            <BrandLogo />
          </Link>
        </div>
        <div className="footer-contact-row">
          <span><MapPin size={17} /> {settings?.address || 'Lima, Perú'}</span>
          <span><Phone size={17} /> {settings?.phone || '999123456'}</span>
          <span><Mail size={17} /> {settings?.email || 'hola@ferremax.pe'}</span>
        </div>
        <div className="footer-links-row">
          <Link to="/catalogo">Productos</Link>
          <Link to="/#categorias">Categorías</Link>
          <Link to="/login">Administración</Link>
        </div>
        <div className="footer-bottom">
          © {new Date().getFullYear()} FerreMax · Proyecto académico
        </div>
      </footer>
    </div>
  );
}
