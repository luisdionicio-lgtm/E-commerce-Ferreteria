import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { writeFile } from 'node:fs/promises';

const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || undefined });
const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
const page = await context.newPage();
page.setDefaultTimeout(20000);
const report = [];
async function inspect(route, name, fullPage = false) {
  await page.goto(`http://localhost:5173${route}`);
  if (route === '/') await page.locator('.hero h1').waitFor();
  if (route === '/admin/dashboard') await page.locator('.page-header h1').waitFor();
  if (route === '/catalogo') await page.locator('.product-card').first().waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page
    .locator('img:visible')
    .evaluateAll((images) =>
      Promise.all(
        images
          .filter(
            (image) =>
              image.getBoundingClientRect().top < innerHeight &&
              image.getBoundingClientRect().bottom > 0,
          )
          .map((image) => image.decode().catch(() => {})),
      ),
    );
  await page.screenshot({ path: `docs/previews/${name}.png`, fullPage });
  const result = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();
  const issues = result.violations.flatMap((item) =>
    item.nodes.map((node) => ({ target: node.target, summary: node.failureSummary })),
  );
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  report.push({ route, viewport: page.viewportSize(), issues, overflow });
  console.log(JSON.stringify(report.at(-1)));
}
try {
  await inspect('/', '13-ui-inicio');
  await inspect('/catalogo', '14-ui-catalogo');
  await inspect('/ingresar', '15-ui-acceso');
  await page.goto('http://localhost:5173/login');
  await page.getByLabel('Correo electrónico').fill('admin@ferremax.pe');
  await page.getByLabel('Contraseña', { exact: true }).fill('FerreMax2026!');
  await page.getByRole('button', { name: 'Ingresar al panel', exact: true }).click();
  await page.waitForURL(/admin\/dashboard/);
  await inspect('/mi-cuenta', '16-ui-cuenta');
  await inspect('/admin/dashboard', '17-ui-panel');
  await page.setViewportSize({ width: 375, height: 1000 });
  await inspect('/', '18-ui-movil', true);
  await inspect('/mi-cuenta', '19-ui-cuenta-movil', true);
  await writeFile('docs/previews/ui-contrast-report.json', JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
