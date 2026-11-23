import 'dotenv/config';
import { createRepository } from '../src/config/repository.js';
import { catalogAdditionRows } from '../src/config/catalog-additions.js';

if (process.env.DATA_DRIVER !== 'mysql')
  throw new Error(
    'Para JSON existente usa el panel o detén el servidor antes de importar. Esta importación requiere MySQL.',
  );
const repo = await createRepository();
try {
  const inserted = await repo.transaction(async (u) => {
    if (!(await u.get('users', 'admin'))) throw new Error('Falta el administrador de la demo.');
    const rows = catalogAdditionRows();
    let count = 0;
    for (const product of rows.products || []) {
      if (await u.get('products', product.id)) continue;
      if (!(await u.get('categories', product.categoryId)))
        throw new Error(`Falta la categoría ${product.categoryId}`);
      await u.create('products', product);
      await u.create(
        'lots',
        rows.lots!.find((row) => row.productId === product.id)!,
      );
      await u.create(
        'movements',
        rows.movements!.find((row) => row.productId === product.id)!,
      );
      count++;
    }
    return count;
  });
  console.log(
    `Productos añadidos: ${inserted}. Se conservan los productos existentes y su historial.`,
  );
} finally {
  await repo.close?.();
}
