import type { Unit } from '../../shared/types.js';
export async function catalog(u: Unit, admin = false): Promise<any[]> {
  const [products, lots, categories] = await Promise.all([
    u.all('products'),
    u.all('lots'),
    u.all('categories'),
  ]);
  const today = new Date().toISOString().slice(0, 10);
  return products
    .filter((p) => admin || p.active)
    .map((p) => ({
      ...p,
      stock: lots.filter((l) => l.productId === p.id).reduce((n, l) => n + l.quantity, 0),
      availableStock: lots
        .filter((l) => l.productId === p.id && (!l.expiresAt || l.expiresAt >= today))
        .reduce((n, l) => n + l.quantity, 0),
      category: categories.find((c) => c.id === p.categoryId)?.name || 'Sin categoría',
    }));
}
