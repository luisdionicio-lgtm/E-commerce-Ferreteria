import { StorePage } from '../../../components/PageShells';
import { CustomerGate } from '../../../features/orders/CustomerOrders';
import PaymentCheckout from '../../../features/orders/PaymentCheckout';
import { useParams } from '../../../state/navigation';
import { Loading } from '../../../components/ui';
export default function Page() {
  const { id } = useParams();
  return (
    <StorePage>
      <CustomerGate returnTo={typeof id === 'string' ? `/mis-pedidos/${id}/pago` : '/mis-pedidos'}>
        {typeof id === 'string' ? <PaymentCheckout id={id} /> : <Loading />}
      </CustomerGate>
    </StorePage>
  );
}
