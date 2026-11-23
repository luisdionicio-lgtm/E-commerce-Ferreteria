import { test, expect } from '@playwright/test';

test('Accesibilidad y recuperación: salto de teclado, menú móvil y catálogo vacío', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Saltar al contenido', exact: true })).toBeFocused();
  const menu = page.getByRole('button', { name: 'Mostrar menú', exact: true });
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await menu.click();
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('navigation', { name: 'Navegación de la tienda' })).toBeVisible();
  await page.route('**/api/catalog/products', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  );
  await page.goto('/productos/no-existe');
  await expect(
    page.getByRole('heading', { name: 'Producto no encontrado', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('status')).toHaveCount(0);
});

test('Next: enlaces directos, filtros por URL, galería y responsive', async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (/hydration|hydrated|server rendered HTML/.test(message.text())) errors.push(message.text());
  });
  await page.goto('/catalogo?categoria=cat-1&q=Bosch');
  await expect(page.locator('.product-card')).toHaveCount(2);
  await page.reload();
  await expect(page.locator('.product-card')).toHaveCount(2);
  await page.goto('/productos/producto-1');
  await expect(
    page.getByRole('heading', { name: 'Taladro percutor Bosch GSB 185-LI 18V', exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', {
      name: 'Ver vista 2 de Taladro percutor Bosch GSB 185-LI 18V',
      exact: true,
    })
    .click();
  await expect(page.locator('.product-gallery .detail-picture img')).toHaveAttribute(
    'src',
    '/images/reference/drill-kit-bosch.png',
  );
  await page
    .getByRole('button', {
      name: 'Ver vista 3 de Taladro percutor Bosch GSB 185-LI 18V',
      exact: true,
    })
    .click();
  await expect(page.locator('.product-gallery .detail-picture img')).toHaveAttribute(
    'src',
    '/images/reference/drill-dimensions-bosch.jpg',
  );
  await page.goto('/');
  for (const width of [320, 375, 414, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.getByRole('heading', { name: 'FerreMax', exact: true })).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      `overflow at ${width}`,
    ).toBe(true);
    if (width === 375 || width === 1280)
      await page.screenshot({ path: testInfo.outputPath(`home-${width}.png`), fullPage: true });
  }
  await page.goto('/ruta-inexistente-del-curso');
  await expect(
    page.getByRole('heading', { name: 'Esta página no existe.', exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test('Pedido web: envío, confirmación de venta y devolución de stock', async ({
  page,
  request,
}) => {
  const name = `Curso-${Date.now()}`;
  await page.goto('/productos/producto-1');
  await page.getByRole('button', { name: 'Agregar al carrito', exact: true }).click();
  await page.getByRole('link', { name: 'Ver carrito', exact: true }).click();
  await page.getByLabel('Nombre completo').fill(name);
  await page.getByLabel('Celular').fill('999123456');
  const created = page.waitForResponse(
    (r) => r.url().endsWith('/api/orders') && r.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Enviar pedido', exact: true }).click();
  const response = await created;
  expect(response.status()).toBe(201);
  const order = await response.json();
  await expect(
    page.getByRole('heading', { name: 'Tu proyecto ya está en marcha.', exact: true }),
  ).toBeVisible();
  await page.goto('/login');
  await page.getByLabel('Contraseña', { exact: true }).fill('FerreMax2026!');
  const signedIn = page.waitForResponse(
    (r) => r.url().endsWith('/api/auth/login') && r.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Ingresar al panel', exact: true }).click();
  expect((await signedIn).status()).toBe(200);
  await expect(page).toHaveURL(/admin\/dashboard/);
  await page.goto('/admin/pedidos');
  await page.getByRole('textbox', { name: 'Buscar código o cliente…', exact: true }).fill(name);
  await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar operación', exact: true }).click();
  await expect(page.locator('tbody')).toContainText('confirmado');
  // Restore only the sale this test created; preserve all other demo records.
  const login = await request.post('/api/auth/login', {
    data: { email: 'admin@ferremax.pe', password: 'FerreMax2026!' },
  });
  const session = await login.json();
  const headers = { Authorization: `Bearer ${session.accessToken}` };
  const sales = await (await request.get('/api/admin/sales', { headers })).json();
  const sale = sales.records.find((row: { orderId: string }) => row.orderId === order.id);
  expect(sale).toBeTruthy();
  const cancelled = await request.post(`/api/admin/sales/${sale.id}/cancel`, { headers, data: {} });
  expect(cancelled.ok()).toBeTruthy();
});

test('Cliente: registro, protección de admin, búsqueda, filtros y carrito persistente', async ({
  page,
}) => {
  const email = `portfolio-${Date.now()}@example.test`;
  await page.goto('/registro');
  await page.getByLabel('Nombre completo').fill('Cliente Portafolio');
  await page.getByLabel('Correo electrónico').fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill('PruebaPortafolio2026!');
  await page.getByLabel('Repite la contraseña').fill('PruebaPortafolio2026!');
  await page.getByRole('button', { name: 'Crear cuenta', exact: true }).click();
  await expect(page).toHaveURL(/mi-cuenta/);
  await expect(page.getByRole('heading', { name: 'Hola, Cliente Portafolio.' })).toBeVisible();
  await expect(page.getByRole('complementary', { name: 'Datos de tu cuenta' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Abrir panel', exact: true })).toHaveCount(0);
  await page.goto('/admin/dashboard');
  await expect(page).toHaveURL(/mi-cuenta/);
  await page.goto('/catalogo');
  await page.getByRole('textbox', { name: 'Buscar producto, marca o código' }).fill('Bosch');
  await expect(page.locator('.product-card')).toHaveCount(2);
  await page
    .getByRole('textbox', { name: 'Buscar producto, marca o código' })
    .fill('no-existe-portfolio');
  await expect(page.getByText('No encontramos productos', { exact: true })).toBeVisible();
  await page.getByRole('textbox', { name: 'Buscar producto, marca o código' }).fill('');
  await page.getByRole('button', { name: /^Pinturas/ }).click();
  await expect(page.locator('.product-card')).toHaveCount(8);
  await page.getByRole('button', { name: /^Todos los productos/ }).click();
  await page.getByLabel('Ordenar por').selectOption('low');
  await page.getByRole('checkbox', { name: 'Solo productos con stock' }).check();
  await page
    .getByRole('button', { name: 'Agregar Taladro percutor Bosch GSB 185-LI 18V', exact: true })
    .click();
  await page.getByRole('link', { name: 'Ver carrito', exact: true }).click();
  await expect(page.locator('.cart-item')).toHaveCount(1);
  await page.getByRole('button', { name: 'Aumentar cantidad', exact: true }).click();
  await expect(page.locator('.checkout-total')).toContainText('959.80');
  await page.reload();
  await expect(page.locator('.checkout-total')).toContainText('959.80');
  await page.goto('/mi-cuenta');
  await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click();
  await page.goto('/ingresar');
  await page.getByLabel('Correo electrónico').fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill('PruebaPortafolio2026!');
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  await expect(page).toHaveURL(/mi-cuenta/);
});

test('Administrador: acceso al dashboard, productos, proveedores y vencimientos', async ({
  page,
}) => {
  await page.goto('/login');
  await page.getByLabel('Correo electrónico').fill('admin@ferremax.pe');
  await page.getByLabel('Contraseña', { exact: true }).fill('FerreMax2026!');
  await page.getByRole('button', { name: 'Ingresar al panel', exact: true }).click();
  await expect(page).toHaveURL(/admin\/dashboard/);
  await page.goto('/admin/productos');
  await expect(page.getByRole('heading', { name: 'Productos', exact: true })).toBeVisible();
  await expect(page.locator('tbody tr').first()).toBeVisible();
  await page.getByRole('textbox', { name: /Buscar productos/ }).fill('Crimpeadora');
  await page
    .getByRole('button', { name: 'Editar Crimpeadora pelacables 195mm Dexter', exact: true })
    .click();
  await expect(page.getByLabel('Foto referencial', { exact: true })).toHaveValue(
    '/images/reference/catalogo-139183.jpg',
  );
  await expect(page.getByLabel('Foto referencial', { exact: true }).locator('option')).toHaveCount(
    49,
  );
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await page.goto('/admin/proveedores');
  await expect(page.getByRole('heading', { name: 'Proveedores', exact: true })).toBeVisible();
  await page.goto('/admin/vencimientos');
  await expect(page.getByRole('heading', { name: /Vencimientos/ })).toBeVisible();
});
