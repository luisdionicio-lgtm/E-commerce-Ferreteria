import { Link } from '../app/navigation';
import { StorePage } from '../components/PageShells';
export default function NotFound() {
  return (
    <StorePage>
      <div className="not-found">
        <h1>Esta página no existe.</h1>
        <Link to="/" className="btn primary">
          Volver al inicio
        </Link>
      </div>
    </StorePage>
  );
}
