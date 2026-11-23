import Settings from '../../features/settings/Settings';
import { AdminPage } from '../../components/PageShells';
export default function Page() {
  return (
    <AdminPage adminOnly>
      <Settings />
    </AdminPage>
  );
}
