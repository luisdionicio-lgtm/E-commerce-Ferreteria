import { test, expect } from '@playwright/test';

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
  await expect(page.locator('.product-card')).toHaveCount(2);
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
  await page.goto('/admin/proveedores');
  await expect(page.getByRole('heading', { name: 'Proveedores', exact: true })).toBeVisible();
  await page.goto('/admin/vencimientos');
  await expect(page.getByRole('heading', { name: /Vencimientos/ })).toBeVisible();
});
