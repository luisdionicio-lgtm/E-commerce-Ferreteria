import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useApp } from '../../app/context';
import { Loading } from '../../components/ui';

export function CustomerAuth({ register = false }: { register?: boolean }) {
  const { user, ready, signIn, signUp } = useApp();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const navigate = useNavigate();
  if (!ready) return <Loading />;
  if (user)
    return <Navigate to={user.role === 'CUSTOMER' ? '/mi-cuenta' : '/admin/dashboard'} replace />;
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
            navigate(account.role === 'CUSTOMER' ? '/mi-cuenta' : '/admin/dashboard');
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
          <Link to={register ? '/ingresar' : '/registro'}>
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
  const [error, setError] = useState('');
  if (!ready) return <Loading />;
  if (!user) return <Navigate to="/ingresar" replace />;
  return (
    <section className="store-container customer-auth">
      <h1>Hola, {user.name}.</h1>
      <p>Tu cuenta está activa.</p>
      <dl>
        <dt>Correo</dt>
        <dd>{user.email}</dd>
      </dl>
      <p>
        Explora el catálogo, prepara tu carrito y envía tu pedido. La tienda confirma
        disponibilidad, pago y entrega.
      </p>
      <div className="account-actions">
        <Link className="btn primary" to="/catalogo">
          Explorar productos
        </Link>
        <Link className="btn secondary" to="/carrito">
          Ver carrito
        </Link>
        {user.role !== 'CUSTOMER' && (
          <Link className="btn secondary" to="/admin/dashboard">
            Abrir panel
          </Link>
        )}
        <button
          className="btn secondary"
          onClick={async () => {
            try {
              await signOut();
              navigate('/');
            } catch {
              setError('La sesión local se cerró, pero no pudimos contactar al servidor.');
            }
          }}
        >
          Cerrar sesión
        </button>
      </div>
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
