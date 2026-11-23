import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';

config({ path: fileURLToPath(new URL('../backend/.env', import.meta.url)) });
if (process.env.DATA_DRIVER !== 'mysql') throw new Error('Esta actualización requiere MySQL. En JSON, actualizar los productos desde el panel.');
const references = JSON.parse(await readFile(new URL('../frontend/src/data/catalog-references.json', import.meta.url), 'utf8'));
const previousPrices = { 'paint-vencedor': 8490, 'sealant-sika': 3290, 'cement-sol': 3090 };
const db = new PrismaClient();
try {
  const results = await db.$transaction(references.map((item) => {
    const key = item.image.split('/').pop().replace('.jpg', '');
    return db.product.updateMany({
      where: { image: item.image, price: previousPrices[key] },
      data: { price: item.price },
    });
  }));
  console.log(`Precios de catálogo actualizados: ${results.reduce((sum, item) => sum + item.count, 0)}. No se modifican ventas, pedidos, lotes ni precios personalizados.`);
} finally {
  await db.$disconnect();
}
