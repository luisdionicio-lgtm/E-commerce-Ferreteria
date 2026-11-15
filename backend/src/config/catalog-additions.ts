import references from './catalog-additions.json' with { type: 'json' };
import type { Row, Table } from '../shared/types.js';

// Solo fotos y precios son referencias externas. Las existencias son de demostración.
export function catalogAdditionRows(): Partial<Record<Table, Row[]>> {
  const products: Row[] = [];
  const lots: Row[] = [];
  const movements: Row[] = [];
  for (const item of references) {
    const lotId = `lot-${item.id}`;
    products.push({
      id: item.id,
      sku: `FM-${item.id.toUpperCase()}`,
      slug: `referencia-${item.id.slice(4)}`,
      name: item.name,
      brand: item.brand,
      categoryId: item.categoryId,
      price: item.price,
      minStock: 5,
      unit: 'unidad',
      image: item.image,
      description: `Presentación: ${item.name}. Fotografía y precio de referencia consultados en ${item.store} el 14/11/2026. Existencias ficticias para demostración. Confirma características, disponibilidad y presentación antes de comprar.`,
      active: true,
      featured: false,
    });
    lots.push({
      id: lotId,
      productId: item.id,
      code: `DEMO-${item.id.toUpperCase()}`,
      quantity: item.quantity,
      cost: Math.round(item.price * 0.65),
      expiresAt: item.expiresAt,
    });
    movements.push({
      id: `mov-${item.id}`,
      productId: item.id,
      lotId,
      type: 'ENTRADA',
      quantity: item.quantity,
      reason: 'Ampliación del catálogo de demostración',
      reference: 'CATALOGO-DEMO',
      userId: 'admin',
      createdAt: new Date().toISOString(),
    });
  }
  return { products, lots, movements };
}
