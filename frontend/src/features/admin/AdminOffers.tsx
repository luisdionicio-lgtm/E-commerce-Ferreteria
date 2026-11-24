import { useEffect, useMemo, useState } from 'react';
import { BadgePercent, Check, Search, ShoppingBag, Tag, X } from 'lucide-react';
import { toast } from 'sonner';
import { ErrorBox, Loading, PageHeader, SearchInput } from '../../components/ui';
import { money, type Product, useApp, useResource } from '../../state/context';
import { send } from '../../services/api';

const discountOptions = [0, 10, 12, 15, 20, 25, 30, 40];

export default function AdminOffers() {
  const { reload } = useApp();
  const { data, loading, error } = useResource<Product[]>('/admin/products');
  const [term, setTerm] = useState('');
  const [scope, setScope] = useState<'all' | 'active' | 'inactive'>('all');
  const [drafts, setDrafts] = useState<Record<string, number>>({});
  const [busyId, setBusyId] = useState('');

  useEffect(() => {
    if (!data) return;
    setDrafts(Object.fromEntries(data.map((product) => [product.id, product.discount || 0])));
  }, [data]);

  const rows = useMemo(
    () =>
      (data || []).filter((product) => {
        const discount = drafts[product.id] ?? product.discount ?? 0;
        const matchesTerm = [product.name, product.brand, product.sku, product.category]
          .join(' ')
          .toLowerCase()
          .includes(term.toLowerCase());
        const matchesScope =
          scope === 'all' || (scope === 'active' ? discount > 0 : discount === 0);
        return matchesTerm && matchesScope;
      }),
    [data, drafts, scope, term],
  );

  const activeOffers = (data || []).filter((product) => (product.discount || 0) > 0).length;
  const topDiscount = Math.max(0, ...(data || []).map((product) => product.discount || 0));

  const saveDiscount = async (product: Product) => {
    const discount = Math.max(0, Math.min(80, Number(drafts[product.id] || 0)));
    setBusyId(product.id);
    try {
      await send(
        '/admin/products/' + product.id,
        {
          name: product.name,
          sku: product.sku,
          brand: product.brand,
          categoryId: product.categoryId,
          price: product.price,
          minStock: product.minStock,
          unit: product.unit,
          image: product.image,
          description: product.description,
          active: product.active,
          featured: product.featured,
          discount,
        },
        'PATCH',
      );
      toast.success(discount ? `Oferta de ${discount}% publicada` : 'Producto retirado de ofertas');
      reload();
    } catch (cause: any) {
      toast.error(cause.message || 'No se pudo actualizar la oferta');
    } finally {
      setBusyId('');
    }
  };

  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} />;

  return (
    <section className="admin-offers-page">
      <PageHeader
        eyebrow="CATÁLOGO COMERCIAL"
        title="Gestión de ofertas"
        subtitle="Publica descuentos y controla qué productos aparecen en la sección de ofertas."
      />

      <div className="admin-offer-summary">
        <article>
          <span>
            <ShoppingBag size={19} /> Ofertas publicadas
          </span>
          <strong>{activeOffers}</strong>
          <small>productos visibles en la tienda</small>
        </article>
        <article>
          <span>
            <BadgePercent size={19} /> Mayor descuento
          </span>
          <strong>{topDiscount}%</strong>
          <small>promoción más atractiva</small>
        </article>
        <div className="admin-offer-tip">
          <Tag size={22} />
          <p>
            <strong>Actualización inmediata</strong>Un descuento mayor a 0% publica el producto en
            Ofertas.
          </p>
        </div>
      </div>

      <div className="admin-offer-toolbar">
        <SearchInput value={term} onChange={setTerm} placeholder="Buscar producto, marca o SKU…" />
        <div className="admin-offer-tabs" aria-label="Filtrar productos por promoción">
          {(
            [
              ['all', 'Todos'],
              ['active', 'Con oferta'],
              ['inactive', 'Sin oferta'],
            ] as const
          ).map(([value, label]) => (
            <button
              type="button"
              key={value}
              className={scope === value ? 'active' : ''}
              onClick={() => setScope(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-offer-list">
        <div className="admin-offer-list-head">
          <span>Producto</span>
          <span>Precio actual</span>
          <span>Descuento</span>
          <span>Estado</span>
          <span>Acción</span>
        </div>
        {rows.map((product) => {
          const discount = drafts[product.id] ?? product.discount ?? 0;
          const original = discount
            ? Math.round(product.price / (1 - discount / 100))
            : product.price;
          const changed = discount !== (product.discount || 0);
          return (
            <article className="admin-offer-row" key={product.id}>
              <div className="admin-offer-product">
                <img src={product.image} alt="" />
                <div>
                  <strong>{product.name}</strong>
                  <small>
                    {product.brand} · {product.sku}
                  </small>
                </div>
              </div>
              <div className="admin-offer-price">
                <strong>{money(product.price)}</strong>
                {discount > 0 && <del>{money(original)}</del>}
              </div>
              <label className="admin-discount-select">
                <BadgePercent size={17} />
                <select
                  aria-label={'Descuento para ' + product.name}
                  value={discount}
                  onChange={(event) =>
                    setDrafts((current) => ({
                      ...current,
                      [product.id]: Number(event.target.value),
                    }))
                  }
                >
                  {discountOptions.map((value) => (
                    <option value={value} key={value}>
                      {value}%
                    </option>
                  ))}
                </select>
              </label>
              <span className={'admin-offer-status ' + (discount ? 'published' : '')}>
                {discount ? <Check size={15} /> : <X size={15} />}
                {discount ? 'Publicada' : 'Inactiva'}
              </span>
              <button
                type="button"
                className="admin-offer-save"
                disabled={!changed || busyId === product.id}
                onClick={() => saveDiscount(product)}
              >
                {busyId === product.id ? 'Guardando…' : changed ? 'Guardar' : 'Guardado'}
              </button>
            </article>
          );
        })}
        {!rows.length && (
          <div className="admin-offer-empty">
            <Search size={24} />
            No encontramos productos con esos filtros.
          </div>
        )}
      </div>
    </section>
  );
}
