import { StorePage } from '../../../components/PageShells';
import { CustomerGate, OrderDetails } from '../../../features/orders/CustomerOrders';
import { useParams } from '../../../state/navigation';
import { Loading } from '../../../components/ui';
export default function Page() {
  const { id } = useParams();
  return (
    <StorePage>
      <CustomerGate returnTo={typeof id === 'string' ? `/mis-pedidos/${id}` : '/mis-pedidos'}>
        {typeof id === 'string' ? <OrderDetails id={id} /> : <Loading />}
      </CustomerGate>
    </StorePage>
  );
}
