import Entities from '../../features/admin/Entities';
import { AdminPage } from '../../components/PageShells';
export default function Page() {
  return (
    <AdminPage>
      <Entities module="proveedores" />
    </AdminPage>
  );
}
