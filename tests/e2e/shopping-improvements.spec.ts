import { test, expect } from '@playwright/test';

const drill = 'Taladro percutor Bosch GSB 185-LI 18V';

test('Favoritos: guardar, contador, persistencia, quitar y vaciar', async ({ page }) => {
  await page.goto('/catalogo');
  await page.getByRole('button', { name: `Guardar ${drill} en favoritos`, exact: true }).click();
  const remove = page.getByRole('button', { name: `Quitar ${drill} de favoritos`, exact: true });
  await expect(remove).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('link', { name: 'Ver mis favoritos (1)', exact: true }).click();
  await expect(page).toHaveURL(/favoritos/);
  await expect(page.locator('.favorites-page .product-card')).toHaveCount(1);
  await page.reload();
  await expect(page.locator('.favorites-page .product-card')).toHaveCount(1);
  await remove.click();
  await expect(page.getByText('Todavía no guardaste productos', { exact: true })).toBeVisible();
  await page.goto('/productos/producto-1');
  await page.getByRole('button', { name: 'Guardar en favoritos', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Guardado en favoritos', exact: true }),
  ).toBeVisible();
  await page.goto('/favoritos');
  await page.getByRole('button', { name: 'Vaciar favoritos', exact: true }).click();
  await expect(page.locator('.favorites-page .product-card')).toHaveCount(0);
  await expect(
    page.getByRole('link', { name: 'Ver mis favoritos (0)', exact: true }),
  ).toBeVisible();
});

test('Detalle: elegir cantidad, sumar al carrito y respetar el stock', async ({
  page,
  request,
}) => {
  const products = await (await request.get('/api/catalog/products')).json();
  const stock = products.find((p: { slug: string }) => p.slug === 'producto-1').availableStock;
  expect(stock).toBeGreaterThan(3);
  await page.goto('/productos/producto-1');
  const more = page.getByRole('button', { name: 'Aumentar cantidad', exact: true });
  await expect(
    page.getByRole('button', { name: 'Disminuir cantidad', exact: true }),
  ).toBeDisabled();
  await more.click();
  await more.click();
  const add = page.getByRole('button', { name: 'Agregar al carrito', exact: true });
  await add.click();
  await expect(page.locator('.cart-link > span')).toHaveText('3');
  for (let n = 3; n < stock; n++) await more.click();
  await expect(more).toBeDisabled();
  await add.click();
  await expect(page.getByText(`Solo puedes agregar ${stock - 3} más.`)).toBeVisible();
  await page.getByRole('link', { name: 'Ver carrito', exact: true }).click();
  await expect(page.locator('.cart-item .quantity span')).toHaveText('3');
});

test('Descuento: precio anterior y porcentaje solo en productos con oferta', async ({ page }) => {
  await page.route('**/api/catalog/products', async (route) => {
    const response = await route.fetch();
    const products = await response.json();
    const byId = (id: string) => products.find((p: { id: string }) => p.id === id);
    await route.fulfill({
      json: [
        { ...byId('prod-1'), price: 6000, discount: 40 },
        { ...byId('prod-2'), discount: 0 },
      ],
    });
  });
  await page.goto('/catalogo');
  await expect(page.locator('.product-card')).toHaveCount(2);
  const offer = page.locator('.product-card', { hasText: drill });
  await expect(offer.locator('del')).toContainText('100.00');
  await expect(offer.locator('.price-before b')).toHaveText('-40%');
  await expect(page.locator('.product-card .price-before')).toHaveCount(1);
  await page.goto('/productos/producto-1');
  await expect(page.locator('.detail-offer del')).toContainText('100.00');
  await expect(page.locator('.detail-price')).toContainText('60.00');
  await page.goto('/productos/producto-2');
  await expect(page.locator('.detail-price')).toBeVisible();
  await expect(page.locator('.detail-offer')).toHaveCount(0);
});

test('Búsqueda: encuentra lo mismo con o sin tildes y mayúsculas', async ({ page }) => {
  const results: string[] = [];
  for (const term of ['látex', 'latex', ' LATEX ']) {
    await page.goto('/catalogo?q=' + encodeURIComponent(term));
    await expect(
      page.getByRole('heading', { name: 'Pintura látex satinada blanca 1 galón', exact: true }),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: drill, exact: true })).toHaveCount(0);
    results.push((await page.locator('.product-card h3').allTextContents()).join('|'));
  }
  expect(new Set(results).size).toBe(1);
});
