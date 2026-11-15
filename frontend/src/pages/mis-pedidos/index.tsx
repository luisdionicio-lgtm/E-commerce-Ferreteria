import { StorePage } from '../../components/PageShells';
import { CustomerGate, OrdersList } from '../../features/orders/CustomerOrders';
export default function Page() {
  return (
    <StorePage>
      <CustomerGate>
        <OrdersList />
      </CustomerGate>
    </StorePage>
  );
}
