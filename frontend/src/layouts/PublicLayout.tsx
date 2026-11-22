import { Link, NavLink, useNavigate } from '../state/navigation';
import {
  ShoppingCart,
  Search,
  Phone,
  MapPin,
  ShieldCheck,
  Truck,
  Headphones,
  Mail,
  Menu,
  X,
  UserRound,
  Heart,
  RotateCcw,
  ChevronDown,
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
            Productos <ChevronDown size={15} aria-hidden="true" />
          </NavLink>
          <Link to="/#categorias" onClick={() => setOpen(false)}>
            Categorías <ChevronDown size={15} aria-hidden="true" />
          </Link>
          <Link to="/catalogo?orden=destacados" onClick={() => setOpen(false)}>
            Ofertas
          </Link>
          <Link to="/#blog" onClick={() => setOpen(false)}>
            Blog
          </Link>
          <Link to="/#contacto" onClick={() => setOpen(false)}>
            Contacto
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
              placeholder="Buscar productos, marcas o categorías..."
              value={term}
              onChange={(e) => setTerm(e.target.value)}
            />
          </form>
          <NavLink className="account-link" to={user ? '/mi-cuenta' : '/ingresar'}>
            <UserRound size={18} aria-hidden="true" />
            <span>{user ? 'Mi cuenta' : 'Ingresar'}</span>
          </NavLink>
          <Link
            className="favorites-link"
            to="/catalogo?orden=destacados"
            aria-label="Ver productos favoritos"
          >
            <Heart size={25} />
          </Link>
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
      <section className="announcement" aria-label="Beneficios de compra">
        <div className="announcement-inner">
          <div className="announcement-benefit">
            <Truck />
            <span><strong>Envíos a todo Lima</strong><small>Rápido y seguro</small></span>
          </div>
          <div className="announcement-benefit">
            <ShieldCheck />
            <span><strong>Compra segura</strong><small>Tus datos protegidos</small></span>
          </div>
          <div className="announcement-benefit">
            <Headphones />
            <span><strong>Soporte 24/7</strong><small>Contáctanos y te ayudamos</small></span>
          </div>
          <div className="announcement-benefit">
            <RotateCcw />
            <span><strong>30 días de devolución</strong><small>Compra sin complicaciones</small></span>
          </div>
        </div>
      </section>
      <main id="store-content" tabIndex={-1}>
        {children}
      </main>
      <footer id="contacto" className="public-footer">
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
