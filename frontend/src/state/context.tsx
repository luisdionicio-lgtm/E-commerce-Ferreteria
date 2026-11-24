import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { api, restoreSession, setToken, send } from '../services/api';
import { toast } from 'sonner';
export type Product = {
  id: string;
  name: string;
  sku: string;
  slug: string;
  brand: string;
  categoryId: string;
  category: string;
  price: number;
  minStock: number;
  stock: number;
  availableStock: number;
  image: string;
  unit: string;
  description: string;
  active: boolean;
  featured: boolean;
  discount: number;
};
type User = { id: string; name: string; email: string; role: string };
type CartItem = { productId: string; quantity: number };
const Context = createContext<any>(null);
let bootstrap: Promise<any> | null = null;
export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [catalogError, setCatalogError] = useState('');
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartReady, setCartReady] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoritesReady, setFavoritesReady] = useState(false);
  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('ferremax-favorites') || '[]');
      if (Array.isArray(raw))
        setFavorites([...new Set(raw.filter((id): id is string => typeof id === 'string'))]);
    } catch {
      /* Invalid local data starts an empty favorites list. */
    }
    setFavoritesReady(true);
  }, []);
  useEffect(() => {
    if (favoritesReady)
      try {
        localStorage.setItem('ferremax-favorites', JSON.stringify(favorites));
      } catch {
        /* Private browsing can disable storage. */
      }
  }, [favorites, favoritesReady]);
  const isFavorite = (productId: string) => favorites.includes(productId);
  const toggleFavorite = (p: Product) => {
    const saved = favorites.includes(p.id);
    setFavorites((old) => (saved ? old.filter((id) => id !== p.id) : [...old, p.id]));
    toast.success(saved ? 'Producto quitado de favoritos' : 'Producto guardado en favoritos');
  };
  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('ferremax-cart') || '[]');
      if (Array.isArray(raw))
        setCart(
          raw.filter(
            (x) =>
              typeof x.productId === 'string' && Number.isInteger(x.quantity) && x.quantity > 0,
          ),
        );
    } catch {
      /* Invalid local data starts an empty cart. */
    }
    setCartReady(true);
  }, []);
  const reload = useCallback(() => setVersion((v) => v + 1), []);
  useEffect(() => {
    let live = true;
    (bootstrap ??= restoreSession())
      .then((d) => live && setUser(d.user))
      .catch(() => {})
      .finally(() => live && setReady(true));
    return () => {
      live = false;
    };
  }, []);
  useEffect(() => {
    const expire = () => {
      setUser(null);
      setToken('');
    };
    window.addEventListener('ferremax-session-expired', expire);
    return () => window.removeEventListener('ferremax-session-expired', expire);
  }, []);
  useEffect(() => {
    let live = true;
    setCatalogLoading(true);
    Promise.all([
      api<Product[]>('/catalog/products'),
      api('/catalog/categories'),
      api('/catalog/settings'),
    ])
      .then(([p, c, s]) => {
        if (live) {
          setProducts(p);
          setCategories(c);
          setSettings(s);
          setCatalogError('');
        }
      })
      .catch((e) => live && setCatalogError(e.message))
      .finally(() => live && setCatalogLoading(false));
    return () => {
      live = false;
    };
  }, [version]);
  useEffect(() => {
    if (cartReady)
      try {
        localStorage.setItem('ferremax-cart', JSON.stringify(cart));
      } catch {
        /* Private browsing can disable storage. */
      }
  }, [cart, cartReady]);
  const addToCart = (p: Product, quantity = 1) => {
    const current = cart.find((c) => c.productId === p.id)?.quantity || 0;
    if (current >= p.availableStock) {
      toast.error('No hay más stock disponible');
      return;
    }
    if (current + quantity > p.availableStock) {
      toast.error(
        `Ya tienes ${current} en el carrito. Solo puedes agregar ${p.availableStock - current} más.`,
      );
      return;
    }
    setCart((old) =>
      old.some((c) => c.productId === p.id)
        ? old.map((c) =>
            c.productId === p.id
              ? { ...c, quantity: Math.min(p.availableStock, c.quantity + quantity) }
              : c,
          )
        : [...old, { productId: p.id, quantity }],
    );
    toast.success(
      quantity > 1 ? `${quantity} unidades agregadas al carrito` : 'Producto agregado al carrito',
    );
  };
  const signIn = async (email: string, password: string) => {
    const d = await send('/auth/login', { email, password });
    setToken(d.accessToken);
    setUser(d.user);
    reload();
    return d.user;
  };
  const signOut = async () => {
    try {
      await send('/auth/logout', {});
    } finally {
      setToken('');
      setUser(null);
    }
  };
  const signUp = async (name: string, email: string, password: string) => {
    const d = await send('/auth/register', { name, email, password });
    setToken(d.accessToken);
    setUser(d.user);
    reload();
    return d.user;
  };
  return (
    <Context.Provider
      value={{
        user,
        ready,
        products,
        categories,
        settings,
        catalogError,
        catalogLoading,
        cartReady,
        cart,
        setCart,
        addToCart,
        favorites,
        favoritesReady,
        setFavorites,
        isFavorite,
        toggleFavorite,
        signIn,
        signUp,
        signOut,
        version,
        reload,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export const useApp = () => useContext(Context);
export function useResource<T = any>(path: string) {
  const { version } = useApp();
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let live = true;
    setLoading(true);
    setData(null);
    setError('');
    api<T>(path)
      .then((d) => live && setData(d))
      .catch((e) => live && setError(e.message))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [path, version]);
  return { data, error, loading };
}
export const money = (cents: number) =>
  new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(cents / 100);
export const dateLabel = (date: string) =>
  new Date(date.length === 10 ? date + 'T12:00:00' : date).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
