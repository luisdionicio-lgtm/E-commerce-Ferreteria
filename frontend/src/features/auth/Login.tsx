import { useState } from 'react';
import { Link, useNavigate, Navigate } from '../../state/navigation';
import { ArrowRight, LockKeyhole, Eye, EyeOff, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { useApp } from '../../state/context';
import BrandLogo from '../../components/BrandLogo';
export default function Login() {
  const { user, signIn } = useApp();
  const [email, setEmail] = useState('admin@ferremax.pe');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const go = useNavigate();
  if (user)
    return <Navigate to={user.role === 'CUSTOMER' ? '/mi-cuenta' : '/admin/dashboard'} replace />;
  return (
    <div className="login-page staff-access">
      <div className="login-art">
        <Link to="/" className="brand" aria-label="FerreMax - Inicio">
          <BrandLogo />
        </Link>
        <div>
          <h1>
            Una ferretería <br />
            bien organizada <br />
            <em>construye más.</em>
          </h1>
          <p>
            Productos, inventario y ventas.
            <br />
            Todo conectado, en tu espacio de trabajo.
          </p>
        </div>
        <div className="login-art-object">
          <img
            src="/images/home/ferremax-hero-construction.png"
            alt="Herramientas y materiales de FerreMax"
          />
        </div>
        <small>FerreMax · Administración</small>
      </div>
      <div className="login-form-side">
        <Link to="/" className="back-store">
          Volver a la tienda
          <ArrowUpRight size={17} />
        </Link>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError('');
            try {
              const account = await signIn(email, password);
              go(account.role === 'CUSTOMER' ? '/mi-cuenta' : '/admin/dashboard');
            } catch (e: any) {
              setError(e.message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <span className="login-lock">
            <LockKeyhole size={25} />
          </span>
          <h2>Bienvenido de nuevo.</h2>
          <p>Acceso del personal. Ingresa para tener todo bajo control.</p>
          <label>
            Correo electrónico
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            Contraseña
            <div className="password-input">
              <input
                type={show ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                aria-pressed={show}
                onClick={() => setShow(!show)}
              >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>
          {error && (
            <div className="field-error" role="alert">
              {error}
            </div>
          )}
          <button className="btn primary" disabled={busy}>
            {busy ? 'Ingresando…' : 'Ingresar al panel'}
            <ArrowRight size={18} />
          </button>
          <div className="demo-access">
            <ShieldCheck size={18} />
            <div>
              <strong>Acceso de demostración</strong>
              <span>admin@ferremax.pe</span>
              <code>FerreMax2026!</code>
              <small>Empleado: empleado@ferremax.pe / Empleado2026!</small>
            </div>
          </div>
        </form>
        <small className="login-footer">Sesión protegida · Permisos según tu rol</small>
      </div>
    </div>
  );
}
