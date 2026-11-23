import { Catalog } from '../features/store/Store';
import { StorePage } from '../components/PageShells';
export default function Page() {
  return (
    <StorePage>
      <Catalog />
    </StorePage>
  );
}
