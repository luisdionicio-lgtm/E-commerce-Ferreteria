import { createBrowserRouter, Navigate, Link } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import PublicLayout from '../layouts/PublicLayout';
import { Home, Catalog, ProductDetail, Cart } from '../features/store/Store';
import Login from '../features/auth/Login';
import { Account, CustomerAuth } from '../features/auth/Account';
import Dashboard from '../features/dashboard/Dashboard';
import Entities from '../features/admin/Entities';
import { Inventory, Expirations } from '../features/inventory/Inventory';
import Operations from '../features/operations/Operations';
import Reports from '../features/reports/Reports';
import Settings from '../features/settings/Settings';
import { useApp } from './context';
function AdminOnly({ children }: { children: React.ReactNode }) {
  const { user } = useApp();
  return user?.role === 'ADMIN' ? children : <Navigate to="/admin/dashboard" replace />;
}
export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/catalogo', element: <Catalog /> },
      { path: '/productos/:slug', element: <ProductDetail /> },
      { path: '/ingresar', element: <CustomerAuth /> },
      { path: '/registro', element: <CustomerAuth register /> },
      { path: '/mi-cuenta', element: <Account /> },
      { path: '/carrito', element: <Cart /> },
      { path: '/pedido', element: <Cart /> },
    ],
  },
  { path: '/login', element: <Login /> },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <Dashboard /> },
      ...['productos', 'categorias', 'proveedores', 'clientes', 'renovaciones', 'usuarios'].map(
        (module) => ({
          path: module,
          element:
            module === 'usuarios' ? (
              <AdminOnly>
                <Entities key={module} module={module} />
              </AdminOnly>
            ) : (
              <Entities key={module} module={module} />
            ),
        }),
      ),
      { path: 'inventario', element: <Inventory /> },
      { path: 'vencimientos', element: <Expirations /> },
      ...(['compras', 'ventas', 'pedidos'] as const).map((module) => ({
        path: module,
        element: <Operations key={module} module={module} />,
      })),
      { path: 'reportes', element: <Reports /> },
      {
        path: 'configuracion',
        element: (
          <AdminOnly>
            <Settings />
          </AdminOnly>
        ),
      },
    ],
  },
  {
    path: '*',
    element: (
      <div className="not-found">
        <h1>Esta página no existe.</h1>
        <Link to="/" className="btn primary">
          Volver al inicio
        </Link>
      </div>
    ),
  },
]);
