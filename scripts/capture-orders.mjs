import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { writeFile } from 'node:fs/promises';

// Solo crea operaciones ficticias en modo demo y devuelve el inventario utilizado.
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || undefined });
const context = await browser.newContext({
  baseURL: 'http://localhost:5173',
  viewport: { width: 1440, height: 1100 },
});
const staff = await browser.newContext({
  baseURL: 'http://localhost:5173',
  viewport: { width: 1440, height: 1100 },
});
const page = await context.newPage();
const adminPage = await staff.newPage();
const report = [];
let orderId;
let adminToken;
async function json(request, path, token, body) {
  const response =
    body === undefined
      ? await request.get(path, { headers: { Authorization: `Bearer ${token}` } })
      : await request.post(path, { headers: { Authorization: `Bearer ${token}` }, data: body });
  if (!response.ok()) throw new Error(`${path}: HTTP ${response.status()}`);
  return response.json();
}
async function capture(target, name, selector, fullPage = false) {
  await target.locator(selector).first().waitFor();
  await target.evaluate(() => document.fonts.ready);
  await target
    .locator('img')
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
  await target.screenshot({ path: `docs/previews/${name}.png`, fullPage });
  const result = await new AxeBuilder({ page: target }).withRules(['color-contrast']).analyze();
  report.push({
    name,
    viewport: target.viewportSize(),
    issues: result.violations.map((item) => ({
      id: item.id,
      nodes: item.nodes.map((node) => ({ target: node.target, summary: node.failureSummary })),
    })),
    overflow: await target.evaluate(() => document.documentElement.scrollWidth > innerWidth),
  });
  console.log(`${name}: ${result.violations.length} incidencias de contraste`);
}
try {
  const options = await (await context.request.get('/api/payment-options')).json();
  if (options.mode !== 'demo')
    throw new Error('Las capturas requieren PAYMENT_MODE=demo. No se ejecutan con cobros reales.');
  const session = await json(context.request, '/api/auth/register', '', {
    name: 'Cliente de demostración',
    email: `evidencia-${Date.now()}@example.test`,
    password: 'Demostracion2026!',
  });
  const login = await json(staff.request, '/api/auth/login', '', {
    email: 'admin@ferremax.pe',
    password: 'FerreMax2026!',
  });
  adminToken = login.accessToken;
  const order = await json(context.request, '/api/orders', session.accessToken, {
    customerName: 'Cliente de demostración',
    phone: '999123456',
    email: session.user.email,
    address: 'Dirección referencial · Lima',
    items: [
      { productId: 'ref-139183', quantity: 2 },
      { productId: 'ref-135939', quantity: 1 },
      { productId: 'ref-127086', quantity: 4 },
    ],
  });
  orderId = order.id;
  const payment = await json(
    context.request,
    `/api/me/orders/${orderId}/payment`,
    session.accessToken,
    {},
  );
  await page.goto(`/mis-pedidos/${orderId}/pago`);
  await capture(page, '22-pago-qr-demo', '.payment-qr-frame img', true);
  await page.setViewportSize({ width: 375, height: 1000 });
  await capture(page, '25-pago-qr-movil', '.payment-qr-frame img', true);
  await page.setViewportSize({ width: 1440, height: 1100 });
  await json(context.request, `/api/me/orders/${orderId}/payment/report`, session.accessToken, {
    reference: `DEMO-${crypto.randomUUID()}`,
  });
  await page.reload();
  await capture(page, '27-pago-revision', '.payment-result');
  await adminPage.goto('/admin/pagos');
  await adminPage
    .getByRole('textbox', { name: 'Buscar pedido, cliente u operación', exact: true })
    .fill(orderId);
  await capture(adminPage, '24-admin-pagos', 'tbody tr');
  await adminPage.getByRole('button', { name: 'Revisar pago', exact: true }).click();
  await capture(adminPage, '28-revision-admin', '[role="dialog"]');
  await adminPage.getByRole('button', { name: 'Volver', exact: true }).click();
  await json(staff.request, `/api/admin/payments/${payment.id}/review`, adminToken, {
    decision: 'approve',
    note: 'Aprobación de demostración para evidencia del curso.',
  });
  const preparation = await staff.request.patch(`/api/admin/orders/${orderId}/fulfillment`, {
    headers: { Authorization: `Bearer ${adminToken}` },
    data: { status: 'EN_PREPARACION' },
  });
  if (!preparation.ok()) throw new Error('No se pudo registrar la preparación demo');
  await page.reload();
  await capture(page, '23-pago-aprobado', '.payment-result.approved');
  await page.goto(`/mis-pedidos/${orderId}`);
  await capture(page, '21-detalle-pedido', '.customer-order-items', true);
  await page.goto('/mis-pedidos');
  await capture(page, '20-mis-pedidos', '.customer-order-card');
  await page.setViewportSize({ width: 375, height: 1000 });
  await capture(page, '26-mis-pedidos-movil', '.customer-order-card', true);
  await writeFile('docs/previews/orders-contrast-report.json', JSON.stringify(report, null, 2));
} finally {
  if (adminToken && orderId) {
    const sales = await json(staff.request, '/api/admin/sales', adminToken);
    const sale = sales.records.find(
      (item) => item.orderId === orderId && item.status === 'CONFIRMADA',
    );
    if (sale) {
      await json(staff.request, `/api/admin/sales/${sale.id}/cancel`, adminToken, {});
      const payments = await json(staff.request, '/api/admin/payments', adminToken);
      const payment = payments.find((item) => item.orderId === orderId);
      if (payment?.status === 'REEMBOLSO_PENDIENTE')
        await json(staff.request, `/api/admin/payments/${payment.id}/refund`, adminToken, {});
    }
  }
  await browser.close();
}
