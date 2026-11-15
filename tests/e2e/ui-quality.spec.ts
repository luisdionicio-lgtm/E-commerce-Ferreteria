import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('UI pública: fuentes locales y contraste en portada, catálogo e ingreso', async ({ page }) => {
  for (const route of ['/', '/catalogo', '/ingresar']) {
    await page.goto(route);
    if (route === '/') await expect(page.locator('.hero h1')).toBeVisible();
    if (route === '/catalogo') await expect(page.locator('.product-card').first()).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const audit = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();
    expect(audit.violations, `${route}: contraste de texto`).toEqual([]);
  }
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  expect(
    await page.evaluate(() => document.fonts.check('700 64px "Barlow Condensed"')),
  ).toBeTruthy();
  expect(await page.evaluate(() => document.fonts.check('400 16px "Source Sans 3"'))).toBeTruthy();
});

test('Mi cuenta: perfil, compra y administración separados y cabecera sin recortes', async ({
  page,
}) => {
  await page.goto('/login');
  await page.getByLabel('Correo electrónico').fill('admin@ferremax.pe');
  await page.getByLabel('Contraseña', { exact: true }).fill('FerreMax2026!');
  await page.getByRole('button', { name: 'Ingresar al panel', exact: true }).click();
  await expect(page).toHaveURL(/admin\/dashboard/);
  await expect(page.locator('.page-header h1')).toBeVisible();
  const dashboard = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();
  expect(dashboard.violations).toEqual([]);
  for (const width of [1440, 768, 375, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/mi-cuenta');
    await expect(page.getByRole('complementary', { name: 'Datos de tu cuenta' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Mi cuenta', exact: true })).toHaveClass(/active/);
    await expect(page.getByRole('link', { name: 'Abrir panel', exact: true })).toBeVisible();
    const button = page.getByRole('button', { name: 'Cerrar sesión', exact: true });
    await expect(button).toBeVisible();
    const boxes = await page
      .locator(
        '.public-header .account-link, .public-header .cart-link, .public-header .public-menu',
      )
      .evaluateAll((elements) =>
        elements
          .filter((element) => getComputedStyle(element).display !== 'none')
          .map((element) => ({
            left: element.getBoundingClientRect().left,
            right: element.getBoundingClientRect().right,
          })),
      );
    expect(boxes.every((box) => box.left >= 0 && box.right <= width)).toBeTruthy();
    if (width === 375 || width === 1440) {
      const audit = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();
      expect(audit.violations).toEqual([]);
    }
  }
  await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
});
