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
  ArrowRight,
  ArrowUp,
} from 'lucide-react';
import { useState } from 'react';
import { useApp } from '../state/context';
import BrandLogo from '../components/BrandLogo';
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const { cart, favorites, settings, user, categories } = useApp();
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
          <details className="nav-dropdown">
            <summary>
              Productos <ChevronDown size={15} aria-hidden="true" />
            </summary>
            <div className="nav-dropdown-menu">
              <Link to="/catalogo" onClick={() => setOpen(false)}>
                Ver todos los productos
              </Link>
              <Link to="/ofertas" onClick={() => setOpen(false)}>
                Productos destacados
              </Link>
              <Link to="/catalogo?categoria=cat-1" onClick={() => setOpen(false)}>
                Herramientas
              </Link>
              <Link to="/catalogo?categoria=cat-2" onClick={() => setOpen(false)}>
                Pinturas
              </Link>
            </div>
          </details>
          <details className="nav-dropdown">
            <summary>
              Categorías <ChevronDown size={15} aria-hidden="true" />
            </summary>
            <div className="nav-dropdown-menu categories-menu">
              <Link to="/#categorias" onClick={() => setOpen(false)}>
                Ver todas las categorías
              </Link>
              {categories.map((category: any) => (
                <Link
                  key={category.id}
                  to={`/catalogo?categoria=${category.id}`}
                  onClick={() => setOpen(false)}
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </details>
          <NavLink to="/ofertas" onClick={() => setOpen(false)}>
            Ofertas
          </NavLink>
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
            to="/favoritos"
            aria-label={`Ver mis favoritos (${favorites.length})`}
          >
            <Heart size={25} />
            {favorites.length > 0 && <span>{favorites.length}</span>}
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
            <span>
              <strong>Envíos a todo Lima</strong>
              <small>Rápido y seguro</small>
            </span>
          </div>
          <div className="announcement-benefit">
            <ShieldCheck />
            <span>
              <strong>Compra segura</strong>
              <small>Tus datos protegidos</small>
            </span>
          </div>
          <div className="announcement-benefit">
            <Headphones />
            <span>
              <strong>Soporte 24/7</strong>
              <small>Contáctanos y te ayudamos</small>
            </span>
          </div>
          <div className="announcement-benefit">
            <RotateCcw />
            <span>
              <strong>30 días de devolución</strong>
              <small>Compra sin complicaciones</small>
            </span>
          </div>
        </div>
      </section>
      <main id="store-content" tabIndex={-1}>
        {children}
      </main>
      <footer id="contacto" className="public-footer ecommerce-footer">
        <div className="footer-brand-block">
          <Link to="/" className="brand light" aria-label="FerreMax - Inicio">
            <BrandLogo />
          </Link>
          <p>Herramientas y materiales para tu próximo proyecto.</p>
          <Link to="/catalogo" className="footer-catalog-link">
            Explorar el catálogo <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
        <nav className="footer-column" aria-label="Categorías del catálogo">
          <h2>Compra por categoría</h2>
          {categories.map((category: any) => (
            <Link key={category.id} to={`/catalogo?categoria=${category.id}`}>
              {category.name}
            </Link>
          ))}
        </nav>
        <nav className="footer-column" aria-label="Tu cuenta y compras">
          <h2>Tu cuenta</h2>
          <Link to={user ? '/mi-cuenta' : '/ingresar'}>Mi cuenta</Link>
          <Link to="/mis-pedidos">Mis pedidos</Link>
          <Link to="/carrito">Mi carrito</Link>
          <Link to="/favoritos">Mis favoritos</Link>
          <Link to="/ofertas">Productos destacados</Link>
          <Link to="/login">Acceso del personal</Link>
        </nav>
        <div className="footer-contact-row">
          <h2>Conversemos</h2>
          <span>
            <MapPin size={17} /> {settings?.address || 'Lima, Perú'}
          </span>
          <a href={`tel:${(settings?.phone || '999123456').replace(/[^+\d]/g, '')}`}>
            <Phone size={17} /> {settings?.phone || '999123456'}
          </a>
          <a href={`mailto:${settings?.email || 'hola@ferremax.pe'}`}>
            <Mail size={17} /> {settings?.email || 'hola@ferremax.pe'}
          </a>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} FerreMax · Proyecto académico de e-commerce</span>
          <span>Imágenes y precios referenciales · Pagos en modo demostración</span>
          <a href="#store-content">
            Volver al contenido <ArrowUp size={16} aria-hidden="true" />
          </a>
        </div>
      </footer>
    </div>
  );
}
