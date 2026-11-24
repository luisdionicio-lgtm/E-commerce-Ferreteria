import { Link, useParams, useSearchParams, useNavigate } from '../../state/navigation';
import { useEffect, useState, useMemo } from 'react';
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
  ChevronLeft,
  ChevronRight,
  Drill,
  PaintBucket,
  Zap,
  HardHat,
  Wrench,
  FileText,
  Tag,
  Heart,
  Grid3X3,
  List,
  ShoppingCart,
  BadgePercent,
} from 'lucide-react';
import { useApp, useResource, money, type Product } from '../../state/context';
import { ErrorBox, Empty, Loading, SearchInput } from '../../components/ui';
import { send } from '../../services/api';
import { toast } from 'sonner';
import ProductGallery from '../../components/ProductGallery';
import BrandLogo from '../../components/BrandLogo';
const icons = [Drill, PaintBucket, Zap, Wrench, HardHat, ShieldCheck];
function FavoriteButton({ p, className, size }: { p: Product; className: string; size: number }) {
  const { isFavorite, toggleFavorite } = useApp();
  const saved = isFavorite(p.id);
  return (
    <button
      type="button"
      className={className + (saved ? ' is-saved' : '')}
      aria-label={
        (saved ? 'Quitar ' : 'Guardar ') + p.name + (saved ? ' de favoritos' : ' en favoritos')
      }
      aria-pressed={saved}
      onClick={() => toggleFavorite(p)}
    >
      <Heart size={size} fill={saved ? 'currentColor' : 'none'} />
    </button>
  );
}
export function ProductCard({
  p,
  catalogVariant = false,
}: {
  p: Product;
  catalogVariant?: boolean;
}) {
  const { addToCart } = useApp();
  return (
    <article className="product-card">
      <FavoriteButton p={p} className="catalog-favorite" size={20} />
      <Link to={'/productos/' + p.slug} className="product-picture">
        {catalogVariant && p.featured && <span className="catalog-card-badge">Destacado</span>}
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
            {catalogVariant ? <ShoppingCart size={19} /> : <Plus size={20} />}
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

const homeHeroSlides = [
  {
    image: '/images/home/ferremax-hero-yellow-branded.png',
    kicker: 'Todo para tu obra y proyecto',
    description:
      'Herramientas, electricidad, gasfitería, construcción, pinturas y seguridad, en un solo lugar.',
  },
  {
    image: '/images/home/ferremax-hero-yellow-pinturas-branded.png',
    kicker: 'Renueva cada ambiente',
    description: 'Pinturas, acabados y herramientas profesionales para transformar tus espacios.',
  },
  {
    image: '/images/home/ferremax-hero-yellow-instalaciones-branded.png',
    kicker: 'Instala con confianza',
    description: 'Soluciones confiables para electricidad, gasfitería y construcción profesional.',
  },
] as const;

function HomeProductCard({ p }: { p: Product }) {
  const { addToCart } = useApp();
  return (
    <article className="home-product-card">
      <Link to={'/productos/' + p.slug} className="home-product-image">
        <img src={p.image} alt={p.name} loading="lazy" />
      </Link>
      <div className="home-product-copy">
        <div className="home-product-meta">
          <strong>{p.brand}</strong>
          <span>{p.category}</span>
        </div>
        <Link to={'/productos/' + p.slug} className="home-product-name">
          {p.name}
        </Link>
        <span className={'home-product-stock ' + (!p.availableStock ? 'out' : '')}>
          <i />
          {p.availableStock ? `${p.availableStock} disponibles` : 'Sin stock'}
        </span>
        <div className="home-product-buy">
          <b>{money(p.price)}</b>
          <button disabled={!p.availableStock} onClick={() => addToCart(p)}>
            <ShoppingBag size={16} />
            Agregar
          </button>
        </div>
      </div>
    </article>
  );
}
export function Home() {
  const { products, categories, catalogError } = useApp();
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveHeroSlide((current) => (current + 1) % homeHeroSlides.length);
    }, 5500);

    return () => window.clearInterval(intervalId);
  }, []);

  const activeSlide = homeHeroSlides[activeHeroSlide];
  const sortedFeaturedProducts = [...products].sort(
    (a: Product, b: Product) => Number(b.featured) - Number(a.featured),
  );
  const safetyProduct =
    sortedFeaturedProducts.find(
      (product: Product) => product.categoryId === 'cat-6' && /casco/i.test(product.name),
    ) || sortedFeaturedProducts.find((product: Product) => product.categoryId === 'cat-6');
  const featuredProducts = sortedFeaturedProducts
    .filter((product: Product) => product.id !== safetyProduct?.id)
    .slice(0, 4);

  if (safetyProduct) featuredProducts.push(safetyProduct);

  if (catalogError)
    return (
      <div className="store-container">
        <ErrorBox message={catalogError} />
      </div>
    );
  return (
    <div className="store-home">
      <section
        id="inicio"
        className="home-hero"
        aria-label="Promociones destacadas de FerreMax"
        aria-roledescription="carrusel"
      >
        <div className="home-hero-media" aria-hidden="true">
          {homeHeroSlides.map((slide, index) => (
            <div
              key={slide.image}
              className={'home-hero-slide ' + (index === activeHeroSlide ? 'active' : '')}
              style={{ backgroundImage: `url(${slide.image})` }}
            />
          ))}
        </div>
        <div key={activeSlide.image} className="home-hero-copy" aria-live="off">
          <p className="home-hero-kicker">{activeSlide.kicker}</p>
          <h1 className="home-hero-brand" aria-label="FerreMax">
            <BrandLogo />
          </h1>
          <p>{activeSlide.description}</p>
          <div className="home-hero-actions">
            <Link to="/catalogo" className="home-primary-action">
              Explorar productos
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
        <button
          className="home-hero-arrow previous"
          type="button"
          aria-label="Promoción anterior"
          onClick={() =>
            setActiveHeroSlide((current) =>
              current === 0 ? homeHeroSlides.length - 1 : current - 1,
            )
          }
        >
          <ChevronLeft />
        </button>
        <button
          className="home-hero-arrow next"
          type="button"
          aria-label="Siguiente promoción"
          onClick={() => setActiveHeroSlide((current) => (current + 1) % homeHeroSlides.length)}
        >
          <ChevronRight />
        </button>
        <div className="home-hero-dots" aria-label="Seleccionar promoción">
          {homeHeroSlides.map((slide, index) => (
            <button
              key={slide.image}
              type="button"
              className={index === activeHeroSlide ? 'active' : ''}
              aria-label={`Mostrar promoción ${index + 1}: ${slide.kicker}`}
              aria-current={index === activeHeroSlide ? 'true' : undefined}
              onClick={() => setActiveHeroSlide(index)}
            />
          ))}
        </div>
      </section>
      <section id="categorias" className="home-section home-categories-section">
        <div className="home-section-heading">
          <h2>¿Qué necesitas para tu proyecto?</h2>
          <Link to="/catalogo">
            Ver todas las categorías
            <ArrowRight size={18} />
          </Link>
        </div>
        <div className="home-category-grid">
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
                  <span className="home-category-icon">
                    <Icon size={27} />
                  </span>
                )}
                <span className="home-category-label">
                  <strong>{c.name}</strong>
                  <ArrowRight size={18} />
                </span>
              </Link>
            );
          })}
        </div>
      </section>
      <section className="home-section home-featured-section">
        <div className="home-section-heading">
          <h2>Productos destacados</h2>
          <Link to="/catalogo">
            Ver todo el catálogo
            <ArrowRight size={18} />
          </Link>
        </div>
        <div className="home-product-grid">
          {featuredProducts.map((p: Product) => (
            <HomeProductCard p={p} key={p.id} />
          ))}
        </div>
      </section>
      <section className="home-section home-offer-banner" aria-label="Ofertas de la semana">
        <div className="home-offer-title">
          <Tag aria-hidden="true" />
          <strong>
            <em>Ofertas</em> de la semana
          </strong>
        </div>
        <p>Aprovecha precios especiales en herramientas, construcción, electricidad y más.</p>
        <Link to="/ofertas">
          Ver ofertas
          <ArrowRight size={18} />
        </Link>
      </section>
      <section className="home-brands" aria-label="Nuestras marcas aliadas">
        <strong className="home-brands-label">
          Nuestras
          <br />
          marcas aliadas
        </strong>
        <span className="partner-bosch">BOSCH</span>
        <span className="partner-dewalt">DEWALT</span>
        <span className="partner-cpp">CPP</span>
        <span className="partner-vainsa">VAINSA</span>
        <span className="partner-indeco">INDECO</span>
        <span className="partner-stanley">STANLEY</span>
      </section>
    </div>
  );
}
export function Catalog() {
  const { products, categories, catalogError } = useApp();
  const [params, setParams] = useSearchParams();
  const [sort, setSort] = useState('featured');
  const [onlyStock, setOnlyStock] = useState(false);
  const [filters, setFilters] = useState(false);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const term = params.get('q') || '',
    category = params.get('categoria') || '';
  const filtered = useMemo(() => {
    const rows = products.filter(
      (p: Product) =>
        (!category || p.categoryId === category) &&
        (!term || `${p.name} ${p.brand} ${p.sku}`.toLowerCase().includes(term.toLowerCase())) &&
        (!onlyStock || p.availableStock > 0) &&
        (!minPrice || p.price >= Number(minPrice) * 100) &&
        (!maxPrice || p.price <= Number(maxPrice) * 100),
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
  }, [products, term, category, sort, onlyStock, minPrice, maxPrice]);
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
        Productos
      </div>
      <div className="catalog-intro">
        <div className="catalog-title">
          <div>
            <h1>Productos</h1>
            <p>Explora nuestro catálogo y encuentra todo para tu obra y proyecto.</p>
          </div>
        </div>
        <aside className="catalog-banner" aria-label="Herramientas y materiales para tu proyecto">
          <strong>
            Herramientas y materiales
            <span>para todo tipo de proyectos</span>
          </strong>
        </aside>
      </div>
      {catalogError ? (
        <ErrorBox message={catalogError} />
      ) : (
        <>
          <div className="catalog-layout">
            <aside className={'catalog-filters ' + (filters ? 'open' : '')}>
              <div className="catalog-filter-heading">
                <SlidersHorizontal size={21} />
                <strong>Filtrar productos</strong>
              </div>
              <SearchInput
                value={term}
                onChange={(v) => update('q', v)}
                placeholder="Buscar producto, marca o código"
              />
              <h3>Categorías</h3>
              <button
                className={!category ? 'selected' : ''}
                onClick={() => update('categoria', '')}
              >
                Todos los productos <span>{products.length}</span>
              </button>
              {categories.map((c: any, index: number) => {
                const CategoryIcon = icons[index] || Tag;
                return (
                  <button
                    className={category === c.id ? 'selected' : ''}
                    key={c.id}
                    onClick={() => update('categoria', c.id)}
                  >
                    <span className="catalog-category-name">
                      <CategoryIcon size={17} />
                      {c.name}
                    </span>
                    <span>{products.filter((p: Product) => p.categoryId === c.id).length}</span>
                  </button>
                );
              })}
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
              <div className="filter-divider" />
              <h3>Rango de precios</h3>
              <div className="catalog-price-range">
                <input
                  type="number"
                  min="0"
                  inputMode="decimal"
                  aria-label="Precio mínimo"
                  placeholder="S/ Mín."
                  value={minPrice}
                  onChange={(event) => setMinPrice(event.target.value)}
                />
                <span>–</span>
                <input
                  type="number"
                  min="0"
                  inputMode="decimal"
                  aria-label="Precio máximo"
                  placeholder="S/ Máx."
                  value={maxPrice}
                  onChange={(event) => setMaxPrice(event.target.value)}
                />
              </div>
              <button
                type="button"
                className="catalog-clear-filters"
                onClick={() => {
                  setParams(new URLSearchParams());
                  setOnlyStock(false);
                  setMinPrice('');
                  setMaxPrice('');
                }}
              >
                <SlidersHorizontal size={17} />
                Limpiar filtros
              </button>
            </aside>
            <div className="catalog-results">
              <div className="catalog-toolbar">
                <button
                  className="btn secondary filter-toggle"
                  onClick={() => setFilters(!filters)}
                >
                  <SlidersHorizontal size={17} />
                  Filtros
                </button>
                <p>
                  Mostrando <strong>{filtered.length ? `1 – ${filtered.length}` : '0'}</strong> de{' '}
                  <strong>{products.length}</strong> productos
                </p>
                <div className="catalog-view-tools">
                  <label className="sort-label">
                    Ordenar por:
                    <select value={sort} onChange={(e) => setSort(e.target.value)}>
                      <option value="featured">Destacados</option>
                      <option value="low">Menor precio</option>
                      <option value="high">Mayor precio</option>
                      <option value="name">Nombre</option>
                    </select>
                  </label>
                  <button
                    type="button"
                    className={view === 'grid' ? 'active' : ''}
                    aria-label="Vista en cuadrícula"
                    onClick={() => setView('grid')}
                  >
                    <Grid3X3 size={19} />
                  </button>
                  <button
                    type="button"
                    className={view === 'list' ? 'active' : ''}
                    aria-label="Vista en lista"
                    onClick={() => setView('list')}
                  >
                    <List size={21} />
                  </button>
                </div>
              </div>
              {filtered.length ? (
                <div className={'product-grid catalog-product-grid ' + view}>
                  {filtered.map((p: Product) => (
                    <ProductCard key={p.id} p={p} catalogVariant />
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

type OfferRow = { product: Product; discount: number };

function OfferCard({ p, discount }: { p: Product; discount: number }) {
  const { addToCart } = useApp();
  const originalPrice = Math.round(p.price / (1 - discount / 100));
  return (
    <article className="offer-card">
      <Link to={'/productos/' + p.slug} className="offer-card-picture">
        <span className="offer-discount">-{discount}%</span>
        <span className="offer-brand">{p.brand}</span>
        <img src={p.image} alt={p.name} loading="lazy" />
      </Link>
      <FavoriteButton p={p} className="offer-favorite" size={21} />
      <div className="offer-card-copy">
        <Link to={'/productos/' + p.slug}>
          <h3>{p.name}</h3>
        </Link>
        <div className="offer-card-buy">
          <div>
            <strong>{money(p.price)}</strong>
            <del>{money(originalPrice)}</del>
          </div>
          <button
            type="button"
            aria-label={'Agregar ' + p.name}
            disabled={!p.availableStock}
            onClick={() => addToCart(p)}
          >
            <ShoppingCart size={19} />
          </button>
        </div>
      </div>
    </article>
  );
}

export function Offers() {
  const { products, categories, catalogError } = useApp();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [discountRange, setDiscountRange] = useState('');
  const [sort, setSort] = useState('discount');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState(false);

  const offers = useMemo<OfferRow[]>(
    () =>
      products
        .filter((product: Product) => product.active && product.discount > 0)
        .map((product: Product) => ({ product, discount: product.discount })),
    [products],
  );

  const filtered = useMemo(() => {
    const rows = offers.filter(({ product, discount }) => {
      const matchesCategory =
        !selectedCategories.length || selectedCategories.includes(product.categoryId);
      const matchesDiscount =
        !discountRange ||
        (discountRange === '10-20' && discount >= 10 && discount <= 20) ||
        (discountRange === '21-30' && discount >= 21 && discount <= 30) ||
        (discountRange === '31-40' && discount >= 31 && discount <= 40);
      return matchesCategory && matchesDiscount;
    });
    return rows.sort((a, b) =>
      sort === 'low'
        ? a.product.price - b.product.price
        : sort === 'high'
          ? b.product.price - a.product.price
          : b.discount - a.discount,
    );
  }, [offers, selectedCategories, discountRange, sort]);

  const toggleCategory = (id: string) =>
    setSelectedCategories((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );

  return (
    <div className="store-container offers-page">
      <div className="store-breadcrumb">
        <Link to="/">Inicio</Link>
        <ChevronRight size={14} />
        Ofertas
      </div>

      <div className="offers-intro">
        <div className="offers-title">
          <h1>Ofertas</h1>
          <p>Aprovecha descuentos exclusivos en herramientas, materiales y más.</p>
        </div>
        <aside className="offers-banner" aria-label="Ofertas especiales con descuentos">
          <span>
            <BadgePercent size={27} /> OFERTAS ESPECIALES
          </span>
          <strong>
            Descuentos hasta <b>−40%</b>
          </strong>
        </aside>
      </div>

      {catalogError ? (
        <ErrorBox message={catalogError} />
      ) : (
        <>
          <nav className="offer-category-tabs" aria-label="Categorías de ofertas">
            <button
              type="button"
              className={!selectedCategories.length ? 'active' : ''}
              onClick={() => setSelectedCategories([])}
            >
              <Grid3X3 size={19} /> Todas
            </button>
            {categories.map((category: any, index: number) => {
              const CategoryIcon = icons[index] || Tag;
              return (
                <button
                  type="button"
                  key={category.id}
                  className={selectedCategories.includes(category.id) ? 'active' : ''}
                  onClick={() => setSelectedCategories([category.id])}
                >
                  <CategoryIcon size={19} /> {category.name}
                </button>
              );
            })}
          </nav>

          <div className="offers-layout">
            <aside className={'offer-filters ' + (filters ? 'open' : '')}>
              <div className="offer-filter-heading">
                <SlidersHorizontal size={21} />
                <strong>Filtrar ofertas</strong>
              </div>
              <h3>Categoría</h3>
              {categories.map((category: any) => (
                <label key={category.id}>
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category.id)}
                    onChange={() => toggleCategory(category.id)}
                  />
                  <span>{category.name}</span>
                  <b>
                    ({offers.filter(({ product }) => product.categoryId === category.id).length})
                  </b>
                </label>
              ))}
              <div className="offer-filter-divider" />
              <h3>Rango de descuento</h3>
              {[
                ['10-20', '10% – 20%'],
                ['21-30', '21% – 30%'],
                ['31-40', '31% – 40%'],
              ].map(([value, label]) => (
                <label key={value}>
                  <input
                    type="radio"
                    name="discount-range"
                    checked={discountRange === value}
                    onChange={() => setDiscountRange(value)}
                  />
                  <span>{label}</span>
                  <b>
                    (
                    {
                      offers.filter(({ discount }) =>
                        value === '10-20'
                          ? discount >= 10 && discount <= 20
                          : value === '21-30'
                            ? discount >= 21 && discount <= 30
                            : discount >= 31 && discount <= 40,
                      ).length
                    }
                    )
                  </b>
                </label>
              ))}
              <button
                type="button"
                className="offer-clear-filters"
                onClick={() => {
                  setSelectedCategories([]);
                  setDiscountRange('');
                }}
              >
                <SlidersHorizontal size={18} /> Limpiar filtros
              </button>
            </aside>

            <section className="offer-results">
              <div className="offer-toolbar">
                <button
                  type="button"
                  className="offer-filter-toggle"
                  onClick={() => setFilters(!filters)}
                >
                  <SlidersHorizontal size={18} /> Filtros
                </button>
                <p>
                  Mostrando <strong>{filtered.length ? `1 – ${filtered.length}` : '0'}</strong> de{' '}
                  <strong>{offers.length}</strong> ofertas
                </p>
                <div className="offer-view-tools">
                  <label>
                    Ordenar por:
                    <select value={sort} onChange={(event) => setSort(event.target.value)}>
                      <option value="discount">Mayor descuento</option>
                      <option value="low">Menor precio</option>
                      <option value="high">Mayor precio</option>
                    </select>
                  </label>
                  <button
                    type="button"
                    className={view === 'grid' ? 'active' : ''}
                    aria-label="Vista de ofertas en cuadrícula"
                    onClick={() => setView('grid')}
                  >
                    <Grid3X3 size={19} />
                  </button>
                  <button
                    type="button"
                    className={view === 'list' ? 'active' : ''}
                    aria-label="Vista de ofertas en lista"
                    onClick={() => setView('list')}
                  >
                    <List size={21} />
                  </button>
                </div>
              </div>
              {filtered.length ? (
                <div className={'offer-grid ' + view}>
                  {filtered.map(({ product, discount }) => (
                    <OfferCard key={product.id} p={product} discount={discount} />
                  ))}
                </div>
              ) : (
                <Empty
                  title="No encontramos ofertas"
                  description="Prueba con otra categoría o rango de descuento."
                />
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}

export function ProductDetail() {
  const { slug } = useParams();
  const { products, addToCart, catalogError, catalogLoading } = useApp();
  const p = products.find((x: Product) => x.slug === slug);
  if (catalogError) return <ErrorBox message={catalogError} />;
  if (catalogLoading) return <Loading />;
  if (!p) return <Empty title="Producto no encontrado" />;
  return (
    <div className="store-container detail-page">
      <div className="store-breadcrumb">
        <Link to="/catalogo">Catálogo</Link>
        <ChevronRight size={14} />
        {p.category}
      </div>
      <div className="detail-layout">
        <ProductGallery key={p.id} image={p.image} name={p.name} />
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
          <DetailFavorite p={p} />
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
function DetailFavorite({ p }: { p: Product }) {
  const { isFavorite, toggleFavorite } = useApp();
  const saved = isFavorite(p.id);
  return (
    <button
      type="button"
      className={'btn secondary detail-favorite' + (saved ? ' is-saved' : '')}
      aria-pressed={saved}
      onClick={() => toggleFavorite(p)}
    >
      <Heart size={19} fill={saved ? 'currentColor' : 'none'} />
      {saved ? 'Guardado en favoritos' : 'Guardar en favoritos'}
    </button>
  );
}
export function Favorites() {
  const { products, favorites, favoritesReady, catalogError, catalogLoading, setFavorites } =
    useApp();
  if (catalogError) return <ErrorBox message={catalogError} />;
  if (!favoritesReady || catalogLoading) return <Loading />;
  const saved = favorites
    .map((id: string) => products.find((p: Product) => p.id === id))
    .filter((p: Product | undefined): p is Product => Boolean(p && p.active));
  return (
    <div className="store-container favorites-page">
      <div className="store-breadcrumb">
        <Link to="/catalogo">Catálogo</Link>
        <ChevronRight size={14} />
        Mis favoritos
      </div>
      <span className="eyebrow">LO QUE GUARDASTE PARA DESPUÉS</span>
      <div className="favorites-heading">
        <h1>Mis favoritos.</h1>
        {saved.length > 0 && (
          <button type="button" className="text-link" onClick={() => setFavorites([])}>
            Vaciar favoritos
          </button>
        )}
      </div>
      {!saved.length ? (
        <>
          <Empty
            title="Todavía no guardaste productos"
            description="Toca el corazón de cualquier producto para tenerlo a mano aquí."
          />
          <Link className="btn primary" to="/catalogo">
            Ver productos
            <ArrowRight size={18} />
          </Link>
        </>
      ) : (
        <div className="product-grid catalog-product-grid grid">
          {saved.map((p: Product) => (
            <ProductCard key={p.id} p={p} catalogVariant />
          ))}
        </div>
      )}
    </div>
  );
}
export function Cart() {
  const { products, cart, setCart, catalogError, catalogLoading, cartReady, user } = useApp();
  const go = useNavigate();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<any>(null);
  const [paymentChoice, setPaymentChoice] = useState<'coordinate' | 'yape'>('coordinate');
  const { data: paymentOptions } = useResource<{ enabled: boolean; mode: string }>(
    '/payment-options',
  );
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
    const fields = new FormData(e.currentTarget);
    fields.delete('paymentChoice');
    const form = Object.fromEntries(fields);
    setBusy(true);
    try {
      const order = await send('/orders', { ...form, items: cart });
      setDone(order);
      setCart([]);
      toast.success('Pedido enviado');
      if (paymentChoice === 'yape' && user) {
        try {
          await send(`/me/orders/${order.id}/payment`, {});
          await go(`/mis-pedidos/${order.id}/pago`);
        } catch {
          toast.error('Tu pedido está guardado. Continúa el pago desde Mis pedidos.');
        }
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };
  if (!cartReady || catalogLoading) return <Loading />;
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
        {user && (
          <Link className="btn secondary" to={`/mis-pedidos/${done.id}`}>
            Ver mi pedido <ArrowRight size={17} />
          </Link>
        )}
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
                autoComplete="name"
                defaultValue={user?.name || ''}
                required
                maxLength={180}
                placeholder="Tu nombre y apellido"
              />
            </label>
            <label>
              Celular
              <input
                name="phone"
                type="tel"
                autoComplete="tel"
                required
                pattern="[+0-9 ]{9,16}"
                placeholder="999 123 456"
              />
            </label>
            <label>
              Correo (opcional)
              <input
                name="email"
                type="email"
                autoComplete="email"
                defaultValue={user?.email || ''}
                placeholder="tu@correo.com"
              />
            </label>
            <label>
              Dirección (opcional)
              <input
                name="address"
                autoComplete="street-address"
                placeholder="Para coordinar tu entrega"
                maxLength={500}
              />
            </label>
            <fieldset className="checkout-payment-choice">
              <legend>¿Cómo prefieres pagar?</legend>
              <label>
                <input
                  type="radio"
                  name="paymentChoice"
                  value="coordinate"
                  checked={paymentChoice === 'coordinate'}
                  onChange={() => setPaymentChoice('coordinate')}
                />
                <span>
                  <strong>Coordinar con la tienda</strong>
                  <small>Revisamos tu pedido y acordamos el pago.</small>
                </span>
              </label>
              {paymentOptions?.enabled && (
                <label>
                  <input
                    type="radio"
                    name="paymentChoice"
                    value="yape"
                    checked={paymentChoice === 'yape'}
                    onChange={() => setPaymentChoice('yape')}
                    disabled={!user}
                  />
                  <img src="/images/payments/yape.png" alt="Yape" width={32} height={32} />
                  <span>
                    <strong>
                      {paymentOptions.mode === 'demo'
                        ? 'Yape · demostración'
                        : 'Yape · QR del comercio'}
                    </strong>
                    <small>
                      {paymentOptions.mode === 'demo'
                        ? 'Prueba el flujo sin enviar dinero.'
                        : 'La tienda verifica el abono manualmente.'}
                    </small>
                  </span>
                </label>
              )}
              {!user && (
                <p>
                  <Link to="/ingresar?volver=/carrito">Inicia sesión</Link> para guardar tus pedidos
                  y continuar con Yape. Tu carrito se conserva.
                </p>
              )}
            </fieldset>
            <button
              className="btn primary"
              disabled={busy || invalid || (paymentChoice === 'yape' && !user)}
            >
              {busy
                ? 'Enviando…'
                : paymentChoice === 'yape'
                  ? 'Crear pedido y continuar'
                  : 'Enviar pedido'}
              <ArrowRight size={18} />
            </button>
            <p className="checkout-note">
              <ShieldCheck size={15} />
              {paymentChoice === 'yape'
                ? 'El pedido se guarda antes de abrir el QR. En demo no se transfiere dinero.'
                : 'Este paso registra una solicitud. El pago y la entrega se coordinan al confirmar.'}
            </p>
          </form>
        </div>
      )}
    </div>
  );
}
