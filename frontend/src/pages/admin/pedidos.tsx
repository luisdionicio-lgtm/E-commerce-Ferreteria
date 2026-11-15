import Operations from '../../features/operations/Operations';
import { AdminPage } from '../../components/PageShells';
export default function Page() {
  return (
    <AdminPage>
      <Operations module="pedidos" />
    </AdminPage>
  );
}
