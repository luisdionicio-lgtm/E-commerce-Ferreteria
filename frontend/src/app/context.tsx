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
  const [version, setVersion] = useState(0);
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('ferremax-cart') || '[]');
      return Array.isArray(raw)
        ? raw.filter(
            (x) =>
              typeof x.productId === 'string' && Number.isInteger(x.quantity) && x.quantity > 0,
          )
        : [];
    } catch {
      return [];
    }
  });
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
      .catch((e) => live && setCatalogError(e.message));
    return () => {
      live = false;
    };
  }, [version]);
  useEffect(() => {
    localStorage.setItem('ferremax-cart', JSON.stringify(cart));
  }, [cart]);
  const addToCart = (p: Product) => {
    const current = cart.find((c) => c.productId === p.id)?.quantity || 0;
    if (current >= p.availableStock) {
      toast.error('No hay más stock disponible');
      return;
    }
    setCart((old) =>
      old.some((c) => c.productId === p.id)
        ? old.map((c) => (c.productId === p.id ? { ...c, quantity: c.quantity + 1 } : c))
        : [...old, { productId: p.id, quantity: 1 }],
    );
    toast.success('Producto agregado al carrito');
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
        cart,
        setCart,
        addToCart,
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
