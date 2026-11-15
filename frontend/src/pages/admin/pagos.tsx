import { AdminPage } from '../../components/PageShells';
import AdminPayments from '../../features/orders/AdminPayments';
export default function Page() {
  return (
    <AdminPage adminOnly>
      <AdminPayments />
    </AdminPage>
  );
}
