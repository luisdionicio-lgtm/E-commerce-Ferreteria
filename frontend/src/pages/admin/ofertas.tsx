import AdminOffers from '../../features/admin/AdminOffers';
import { AdminPage } from '../../components/PageShells';

export default function Page() {
  return (
    <AdminPage adminOnly>
      <AdminOffers />
    </AdminPage>
  );
}
