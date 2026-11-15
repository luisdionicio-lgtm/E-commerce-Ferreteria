import { test, expect } from '@playwright/test';
import references from '../../backend/src/config/catalog-additions.json';

test('Catálogo ampliado: seis referencias por categoría, fotos, precios y carrito', async ({
  page,
  request,
}) => {
  test.setTimeout(180000);
  const response = await request.get('/api/catalog/products');
  expect(response.ok()).toBeTruthy();
  const products = await response.json();
  await page.setViewportSize({ width: 375, height: 812 });
  for (let category = 1; category <= 6; category++) {
    const group = references.filter((item) => item.categoryId === `cat-${category}`);
    expect(group).toHaveLength(6);
    await page.goto(`/catalogo?categoria=cat-${category}`);
    for (const item of group) {
      const product = products.find((p: any) => p.id === item.id);
      expect(product.price).toBe(item.price);
      expect(product.availableStock).toBeGreaterThan(0);
      const card = page
        .locator('.product-card')
        .filter({ has: page.getByRole('heading', { name: item.name, exact: true }) });
      await expect(card).toHaveCount(1);
      await card.locator('img').evaluate(async (image: HTMLImageElement) => {
        await image.decode();
        if (!image.naturalWidth) throw new Error('Imagen sin contenido');
      });
    }
    const item = group[0];
    await page.goto(`/productos/referencia-${item.id.slice(4)}`);
    await expect(page.getByRole('heading', { name: item.name, exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Promart Perú', exact: true })).toHaveAttribute(
      'href',
      item.source,
    );
    await page.getByRole('button', { name: 'Agregar al carrito', exact: true }).click();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBeTruthy();
  }
  await page.goto('/carrito');
  await expect(page.locator('.cart-item')).toHaveCount(6);
  await page.reload();
  await expect(page.locator('.cart-item')).toHaveCount(6);
});
