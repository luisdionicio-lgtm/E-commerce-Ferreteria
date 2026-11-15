import Entities from '../../features/admin/Entities';
import { AdminPage } from '../../components/PageShells';
export default function Page() {
  return (
    <AdminPage adminOnly>
      <Entities module="usuarios" />
    </AdminPage>
  );
}
