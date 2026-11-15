import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from '../../state/navigation';
import { CustomerTabs } from '../orders/CustomerOrders';
import { useApp } from '../../state/context';
import { Loading } from '../../components/ui';
import { toast } from 'sonner';
import {
  ArrowUpRight,
  CheckCircle2,
  LayoutDashboard,
  LogOut,
  ShoppingBag,
  UserRound,
} from 'lucide-react';

export function CustomerAuth({ register = false }: { register?: boolean }) {
  const { user, ready, signIn, signUp } = useApp();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const requested = params.get('volver');
  const returnTo =
    requested && /^\/(?:carrito|mis-pedidos(?:\/[A-Za-z0-9-]+(?:\/pago)?)?)$/.test(requested)
      ? requested
      : null;
  const destination = (role: string) =>
    returnTo || (role === 'CUSTOMER' ? '/mi-cuenta' : '/admin/dashboard');
  if (!ready) return <Loading />;
  if (user) return <Navigate to={destination(user.role)} replace />;
  return (
    <section className="store-container customer-auth">
      <Link to="/">← Volver a la tienda</Link>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (busy) return;
          const fields = new FormData(e.currentTarget);
          setBusy(true);
          setError('');
          if (register && fields.get('password') !== fields.get('confirm')) {
            setError('Las contraseñas no coinciden');
            setBusy(false);
            return;
          }
          try {
            const account = register
              ? await signUp(
                  String(fields.get('name')),
                  String(fields.get('email')),
                  String(fields.get('password')),
                )
              : await signIn(String(fields.get('email')), String(fields.get('password')));
            navigate(destination(account.role));
          } catch (err: any) {
            setError(err.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <h1>{register ? 'Crea tu cuenta.' : 'Bienvenido a FerreMax.'}</h1>
        <p>
          {register
            ? 'Guarda tu acceso y prepara tu próximo proyecto.'
            : 'Ingresa para continuar con tu compra.'}
        </p>
        {register && (
          <label>
            Nombre completo
            <input name="name" required minLength={2} maxLength={100} autoComplete="name" />
          </label>
        )}
        <label>
          Correo electrónico
          <input name="email" type="email" required maxLength={180} autoComplete="email" />
        </label>
        <label>
          Contraseña
          <input
            name="password"
            type="password"
            required
            minLength={register ? 10 : 1}
            maxLength={72}
            autoComplete={register ? 'new-password' : 'current-password'}
            aria-describedby={register ? 'password-hint' : undefined}
          />
        </label>
        {register && (
          <>
            <small id="password-hint">Usa entre 10 y 72 caracteres.</small>
            <label>
              Repite la contraseña
              <input
                name="confirm"
                type="password"
                required
                minLength={10}
                maxLength={72}
                autoComplete="new-password"
              />
            </label>
          </>
        )}
        {error && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}
        <button className="btn primary" disabled={busy}>
          {busy ? 'Procesando…' : register ? 'Crear cuenta' : 'Iniciar sesión'}
        </button>
        <p>
          {register ? '¿Ya tienes cuenta?' : '¿Primera vez aquí?'}{' '}
          <Link
            to={
              (register ? '/ingresar' : '/registro') +
              (returnTo ? `?volver=${encodeURIComponent(returnTo)}` : '')
            }
          >
            {register ? 'Inicia sesión' : 'Crea una cuenta'}
          </Link>
        </p>
        <Link to="/login">Acceso del personal</Link>
      </form>
    </section>
  );
}
export function Account() {
  const { user, ready, signOut } = useApp();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);
  if (!ready || signingOut) return <Loading />;
  if (!user) return <Navigate to="/ingresar" replace />;
  return (
    <section className="store-container account-page">
      <CustomerTabs current="profile" />
      <header className="account-heading">
        <div>
          <h1>Hola, {user.name}.</h1>
          <p>Este es tu espacio en FerreMax.</p>
        </div>
        <span className="account-status">
          <CheckCircle2 size={17} /> Tu cuenta está activa.
        </span>
      </header>
      <div className="account-layout">
        <aside className="account-profile" aria-label="Datos de tu cuenta">
          <div className="account-profile-title">
            <UserRound size={22} />
            <h2>Mi perfil</h2>
          </div>
          <dl>
            <div>
              <dt>Nombre</dt>
              <dd>{user.name}</dd>
            </div>
            <div>
              <dt>Correo</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt>Tipo de cuenta</dt>
              <dd>
                {user.role === 'ADMIN'
                  ? 'Administrador'
                  : user.role === 'EMPLOYEE'
                    ? 'Empleado'
                    : 'Cliente'}
              </dd>
            </div>
          </dl>
          <button
            className="account-signout"
            disabled={signingOut}
            onClick={async () => {
              setSigningOut(true);
              try {
                await signOut();
              } catch {
                toast.error('La sesión local se cerró, pero no pudimos contactar al servidor.');
              } finally {
                await navigate('/');
              }
            }}
          >
            <LogOut size={18} /> Cerrar sesión
          </button>
        </aside>
        <div className="account-main">
          <section className="account-shopping" aria-labelledby="account-shopping-title">
            <ShoppingBag size={28} strokeWidth={1.6} />
            <h2 id="account-shopping-title">Tu próximo proyecto empieza aquí.</h2>
            <p>
              Explora el catálogo, prepara tu carrito y envía tu pedido. La tienda confirma
              disponibilidad, pago y entrega.
            </p>
            <div className="account-actions">
              <Link className="btn primary" to="/catalogo">
                Explorar productos <ArrowUpRight size={18} />
              </Link>
              <Link className="btn secondary" to="/carrito">
                Ver carrito
              </Link>
              <Link className="btn secondary" to="/mis-pedidos">
                Ver mis pedidos
              </Link>
            </div>
          </section>
          {user.role !== 'CUSTOMER' && (
            <section className="account-admin-access" aria-label="Acceso del personal">
              <LayoutDashboard size={24} />
              <div>
                <h2>Administración de la tienda</h2>
                <p>Gestiona productos, inventario y pedidos desde el panel.</p>
              </div>
              <Link className="btn secondary" to="/admin/dashboard">
                Abrir panel <ArrowUpRight size={17} />
              </Link>
            </section>
          )}
        </div>
      </div>
    </section>
  );
}
