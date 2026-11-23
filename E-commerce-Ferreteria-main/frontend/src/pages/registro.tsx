import { CustomerAuth } from '../features/auth/Account';
import { StorePage } from '../components/PageShells';
export default function Page() {
  return (
    <StorePage>
      <CustomerAuth register />
    </StorePage>
  );
}
