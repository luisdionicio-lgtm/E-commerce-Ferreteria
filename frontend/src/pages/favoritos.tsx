import { Favorites } from '../features/store/Store';
import { StorePage } from '../components/PageShells';

export default function Page() {
  return (
    <StorePage>
      <Favorites />
    </StorePage>
  );
}
