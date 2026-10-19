import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import {
  ArrowUpRight,
  ArrowRight,
  Plus,
  Minus,
  ShoppingBag,
  Check,
  SlidersHorizontal,
  Trash2,
  ShieldCheck,
  Truck,
  ChevronRight,
  Drill,
  PaintBucket,
  Plug,
  Zap,
  HardHat,
  Wrench,
} from 'lucide-react';
import { useApp, money, type Product } from '../../app/context';
import { ErrorBox, Empty, Loading, SearchInput } from '../../components/ui';
import { send } from '../../services/api';
import { toast } from 'sonner';
const icons = [Drill, PaintBucket, Zap, Wrench, HardHat, ShieldCheck];
export function ProductCard({ p }: { p: Product }) {
  const { addToCart } = useApp();
  return (
    <article className="product-card">
      <Link to={'/productos/' + p.slug} className="product-picture">
        <span className="product-tag">{p.brand}</span>
        <img src={p.image} alt={p.name} loading="lazy" />
        {p.availableStock <= p.minStock && p.availableStock > 0 && (
          <span className="limited">Últimas unidades</span>
        )}
      </Link>
      <div className="product-info">
        <small>{p.category}</small>
        <Link to={'/productos/' + p.slug}>
          <h3>{p.name}</h3>
        </Link>
        <div className="product-price">
          <div>
            <strong>{money(p.price)}</strong>
            <span>/ {p.unit}</span>
          </div>
          <button
            aria-label={'Agregar ' + p.name}
            className="add-button"
            disabled={p.availableStock === 0}
            onClick={() => addToCart(p)}
          >
            <Plus size={20} />
          </button>
        </div>
        <span className={'stock-line ' + (!p.availableStock ? 'out' : '')}>
          <i />
          {p.availableStock ? `${p.availableStock} disponibles` : 'Sin stock'}
        </span>
      </div>
    </article>
  );
}
const categoryPhotos: Record<string, string> = {
  'cat-1': 'tools-stanley.jpg',
  'cat-2': 'paint-vencedor.jpg',
  'cat-3': 'cable-indeco.jpg',
  'cat-4': 'faucet-vainsa.jpg',
  'cat-5': 'cement-sol.jpg',
  'cat-6': 'helmet-steelpro.jpg',
};
export function Home() {
  const { products, categories, catalogError } = useApp();
  if (catalogError)
    return (
      <div className="store-container">
        <ErrorBox message={catalogError} />
      </div>
    );
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <h1>
            Tu proyecto.
            <br />
            <em>Bien equipado.</em>
          </h1>
          <p>Equipa tu próxima idea con herramientas, materiales y asesoría en un solo lugar.</p>
          <Link to="/catalogo" className="btn primary">
            Explorar productos
            <ArrowUpRight size={20} />
          </Link>
          <div className="hero-service">
            <Truck size={20} />
            <span>Consulta disponibilidad y coordina tu entrega directamente con la tienda.</span>
          </div>
        </div>
        <div className="hero-art">
          <img
            src="/images/reference/drill-workshop.jpg"
            alt="Profesional perforando una pared de ladrillo con un taladro Bosch"
            width={720}
            height={938}
            fetchPriority="high"
          />
          <Link to="/catalogo?categoria=cat-1" className="hero-product-label">
            <strong>Herramientas para el trabajo real.</strong>
            <span>
              Ver herramientas
              <ArrowRight size={16} />
            </span>
          </Link>
        </div>
      </section>
      <section className="store-container categories-section">
        <div className="section-heading">
          <h2>¿Qué necesitas para tu proyecto?</h2>
          <Link to="/catalogo">
            Ver todo
            <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className="category-grid">
          {categories.map((c: any, i: number) => {
            const Icon = icons[i % icons.length];
            return (
              <Link to={'/catalogo?categoria=' + c.id} key={c.id}>
                {categoryPhotos[c.id] ? (
                  <img
                    className="category-photo"
                    src={'/images/reference/' + categoryPhotos[c.id]}
                    alt=""
                    width={240}
                    height={180}
                    loading="lazy"
                  />
                ) : (
                  <span className="category-icon">
                    <Icon size={27} />
                  </span>
                )}
                <strong>{c.name}</strong>
                <small>
                  Explorar
                  <ArrowUpRight size={14} />
                </small>
              </Link>
            );
          })}
        </div>
      </section>
      <section className="store-container featured-section">
        <div className="section-heading">
          <div>
            <h2>Los esenciales de cada obra.</h2>
            <p>Una selección referencial para renovar, reparar y construir.</p>
          </div>
          <Link to="/catalogo">
            Todo el catálogo
            <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className="product-grid">
          {products
            .filter((p: Product) => p.featured)
            .slice(0, 8)
            .map((p: Product) => (
              <ProductCard p={p} key={p.id} />
            ))}
        </div>
      </section>
      <section className="project-banner store-container">
        <div>
          <h2>
            Del primer ajuste
            <br />
            al último detalle.
          </h2>
          <p>
            Prepara tu proyecto con herramientas y materiales. Explora el catálogo y envía tu
            selección para confirmar disponibilidad.
          </p>
          <Link to="/catalogo" className="btn light">
            Preparar mi pedido
            <ArrowUpRight size={19} />
          </Link>
        </div>
        <div className="project-photo">
          <img
            src="/images/reference/drill-masonry.jpg"
            alt="Profesional instalando una estructura metálica con un taladro"
            width={720}
            height={938}
            loading="lazy"
          />
        </div>
      </section>
    </>
  );
}
export function Catalog() {
  const { products, categories, catalogError } = useApp();
  const [params, setParams] = useSearchParams();
  const [sort, setSort] = useState('featured');
  const [onlyStock, setOnlyStock] = useState(false);
  const [filters, setFilters] = useState(false);
  const term = params.get('q') || '',
    category = params.get('categoria') || '';
  const filtered = useMemo(() => {
    const rows = products.filter(
      (p: Product) =>
        (!category || p.categoryId === category) &&
        (!term || `${p.name} ${p.brand} ${p.sku}`.toLowerCase().includes(term.toLowerCase())) &&
        (!onlyStock || p.availableStock > 0),
    );
    return rows.sort((a: Product, b: Product) =>
      sort === 'low'
        ? a.price - b.price
        : sort === 'high'
          ? b.price - a.price
          : sort === 'name'
            ? a.name.localeCompare(b.name)
            : Number(b.featured) - Number(a.featured),
    );
  }, [products, term, category, sort, onlyStock]);
  const update = (k: string, v: string) => {
    const next = new URLSearchParams(params);
    v ? next.set(k, v) : next.delete(k);
    setParams(next);
  };
  return (
    <div className="store-container catalog-page">
      <div className="store-breadcrumb">
        <Link to="/">Inicio</Link>
        <ChevronRight size={14} />
        Catálogo
      </div>
      <div className="catalog-title">
        <div>
          <span className="eyebrow">ELIGE. EQUIPA. CONSTRUYE.</span>
          <h1>Todo para hacerlo posible.</h1>
          <p>Herramientas y materiales seleccionados para tu próximo proyecto.</p>
        </div>
        <span className="catalog-count">
          {filtered.length}
          <small>productos</small>
        </span>
      </div>
      {catalogError ? (
        <ErrorBox message={catalogError} />
      ) : (
        <>
          <div className="catalog-toolbar">
            <SearchInput
              value={term}
              onChange={(v) => update('q', v)}
              placeholder="Buscar producto, marca o código"
            />
            <button className="btn secondary filter-toggle" onClick={() => setFilters(!filters)}>
              <SlidersHorizontal size={17} />
              Filtros
            </button>
            <label className="sort-label">
              Ordenar por
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="featured">Destacados</option>
                <option value="low">Menor precio</option>
                <option value="high">Mayor precio</option>
                <option value="name">Nombre</option>
              </select>
            </label>
          </div>
          <div className="catalog-layout">
            <aside className={'catalog-filters ' + (filters ? 'open' : '')}>
              <h3>Categorías</h3>
              <button
                className={!category ? 'selected' : ''}
                onClick={() => update('categoria', '')}
              >
                Todos los productos <span>{products.length}</span>
              </button>
              {categories.map((c: any) => (
                <button
                  className={category === c.id ? 'selected' : ''}
                  key={c.id}
                  onClick={() => update('categoria', c.id)}
                >
                  {c.name}
                  <span>{products.filter((p: Product) => p.categoryId === c.id).length}</span>
                </button>
              ))}
              <div className="filter-divider" />
              <h3>Disponibilidad</h3>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={onlyStock}
                  onChange={(e) => setOnlyStock(e.target.checked)}
                />
                Solo productos con stock
              </label>
              <div className="filter-help">
                <Plug size={25} />
                <h4>¿Una mano con tu proyecto?</h4>
                <p>Consulta el catálogo y envía tu pedido. Te ayudamos a confirmar los detalles.</p>
              </div>
            </aside>
            <div className="catalog-results">
              {filtered.length ? (
                <div className="product-grid">
                  {filtered.map((p: Product) => (
                    <ProductCard key={p.id} p={p} />
                  ))}
                </div>
              ) : (
                <Empty
                  title="No encontramos productos"
                  description="Prueba con otra búsqueda o categoría."
                />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
export function ProductDetail() {
  const { slug } = useParams();
  const { products, addToCart, catalogError } = useApp();
  const p = products.find((x: Product) => x.slug === slug);
  if (catalogError) return <ErrorBox message={catalogError} />;
  if (!products.length) return <Loading />;
  if (!p) return <Empty title="Producto no encontrado" />;
  return (
    <div className="store-container detail-page">
      <div className="store-breadcrumb">
        <Link to="/catalogo">Catálogo</Link>
        <ChevronRight size={14} />
        {p.category}
      </div>
      <div className="detail-layout">
        <div className="detail-picture">
          <img src={p.image} alt={p.name} />
          <span>Fotografía referencial</span>
        </div>
        <div className="detail-copy">
          <span className="eyebrow">
            {p.brand} · {p.sku}
          </span>
          <h1>{p.name}</h1>
          <span className="stock-line">
            <i />
            {p.availableStock} unidades disponibles
          </span>
          <p>{p.description}</p>
          <strong className="detail-price">
            {money(p.price)}
            <small> / {p.unit}</small>
          </strong>
          <button className="btn primary" disabled={!p.availableStock} onClick={() => addToCart(p)}>
            <ShoppingBag size={19} />
            Agregar al carrito
          </button>
          <div className="detail-benefits">
            <span>
              <ShieldCheck size={18} />
              Precios en soles
            </span>
            <span>
              <Truck size={18} />
              Entrega a coordinar
            </span>
          </div>
          <dl>
            <div>
              <dt>Categoría</dt>
              <dd>{p.category}</dd>
            </div>
            <div>
              <dt>Marca</dt>
              <dd>{p.brand}</dd>
            </div>
            <div>
              <dt>Código</dt>
              <dd>{p.sku}</dd>
            </div>
          </dl>
        </div>
      </div>
      <div className="section-heading">
        <h2>También podría servirte.</h2>
      </div>
      <div className="product-grid">
        {products
          .filter((x: Product) => x.id !== p.id && x.categoryId === p.categoryId)
          .slice(0, 4)
          .map((x: Product) => (
            <ProductCard p={x} key={x.id} />
          ))}
      </div>
    </div>
  );
}
export function Cart() {
  const { products, cart, setCart, catalogError } = useApp();
  const go = useNavigate();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<any>(null);
  const lines = cart.map((c: any) => ({
    p: products.find((p: Product) => p.id === c.productId),
    quantity: c.quantity,
  }));
  const total = lines.reduce((n: number, l: any) => n + (l.p?.price || 0) * l.quantity, 0);
  const invalid = lines.some((l: any) => !l.p || l.quantity > l.p.availableStock);
  const update = (id: string, q: number) =>
    setCart((old: any[]) =>
      q < 1
        ? old.filter((c) => c.productId !== id)
        : old.map((c) => (c.productId === id ? { ...c, quantity: q } : c)),
    );
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = Object.fromEntries(new FormData(e.currentTarget));
    setBusy(true);
    try {
      const order = await send('/orders', { ...form, items: cart });
      setDone(order);
      setCart([]);
      toast.success('Pedido enviado');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };
  if (done)
    return (
      <div className="store-container order-success">
        <span className="success-icon">
          <Check size={42} />
        </span>
        <span className="eyebrow">GRACIAS POR ELEGIR FERREMAX</span>
        <h1>Tu proyecto ya está en marcha.</h1>
        <p>
          Registramos tu pedido <strong>#{done.id.slice(0, 8).toUpperCase()}</strong> por{' '}
          {money(done.total)}.<br />
          La tienda debe confirmar disponibilidad y coordinar contigo. Todavía no se ha cobrado.
        </p>
        <button className="btn primary" onClick={() => go('/catalogo')}>
          Seguir explorando
          <ArrowRight size={18} />
        </button>
      </div>
    );
  return (
    <div className="store-container cart-page">
      <div className="store-breadcrumb">
        <Link to="/catalogo">Catálogo</Link>
        <ChevronRight size={14} />
        Tu carrito
      </div>
      <span className="eyebrow">UN PASO MÁS CERCA DE TU PROYECTO</span>
      <h1>Tu selección.</h1>
      {catalogError ? (
        <ErrorBox message={catalogError} />
      ) : !cart.length ? (
        <>
          <Empty
            title="Tu carrito está esperando una buena idea"
            description="Explora el catálogo y agrega tus productos favoritos."
          />
          <Link className="btn primary" to="/catalogo">
            Ver productos
            <ArrowRight size={18} />
          </Link>
        </>
      ) : (
        <div className="cart-layout">
          <div>
            {lines.map((l: any, i: number) => (
              <div className="cart-item" key={l.p?.id || i}>
                <img
                  src={l.p?.image || '/images/toolbox.svg'}
                  alt={l.p?.name || 'Producto no disponible'}
                />
                <div>
                  <small>{l.p?.brand}</small>
                  <h3>{l.p?.name || 'Producto no disponible'}</h3>
                  <strong>{money(l.p?.price || 0)}</strong>
                  {(!l.p || l.quantity > l.p.availableStock) && (
                    <p className="field-error">Actualiza la cantidad o retira el producto.</p>
                  )}
                </div>
                <div className="quantity">
                  <button
                    onClick={() => update(l.p?.id || cart[i].productId, l.quantity - 1)}
                    aria-label="Disminuir cantidad"
                  >
                    <Minus size={15} />
                  </button>
                  <span>{l.quantity}</span>
                  <button
                    disabled={!l.p || l.quantity >= l.p.availableStock}
                    onClick={() => update(l.p.id, l.quantity + 1)}
                    aria-label="Aumentar cantidad"
                  >
                    <Plus size={15} />
                  </button>
                </div>
                <button
                  className="icon-button"
                  aria-label="Quitar producto"
                  onClick={() => update(l.p?.id || cart[i].productId, 0)}
                >
                  <Trash2 size={17} />
                </button>
              </div>
            ))}
            <Link to="/catalogo" className="text-link">
              Continuar comprando
              <ArrowUpRight size={17} />
            </Link>
          </div>
          <form className="checkout" onSubmit={submit}>
            <h2>Resumen del pedido</h2>
            <div className="checkout-line">
              <span>Productos</span>
              <strong>{money(total)}</strong>
            </div>
            <div className="checkout-line">
              <span>Entrega</span>
              <span>A coordinar</span>
            </div>
            <div className="checkout-total">
              <span>Total de productos</span>
              <strong>{money(total)}</strong>
            </div>
            <h3>¿A quién contactamos?</h3>
            <label>
              Nombre completo
              <input
                name="customerName"
                required
                maxLength={180}
                placeholder="Tu nombre y apellido"
              />
            </label>
            <label>
              Celular
              <input name="phone" required pattern="[+0-9 ]{9,16}" placeholder="999 123 456" />
            </label>
            <label>
              Correo (opcional)
              <input name="email" type="email" placeholder="tu@correo.com" />
            </label>
            <label>
              Dirección (opcional)
              <input name="address" placeholder="Para coordinar tu entrega" maxLength={500} />
            </label>
            <button className="btn primary" disabled={busy || invalid}>
              {busy ? 'Enviando…' : 'Enviar pedido'}
              <ArrowRight size={18} />
            </button>
            <p className="checkout-note">
              <ShieldCheck size={15} />
              Este paso registra una solicitud. El pago y la entrega se coordinan al confirmar.
            </p>
          </form>
        </div>
      )}
    </div>
  );
}
