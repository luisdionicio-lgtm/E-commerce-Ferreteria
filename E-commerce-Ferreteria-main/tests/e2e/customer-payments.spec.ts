import { test, expect, type Page, type Browser } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function customer(page: Page, name: string) {
  await page.goto('/registro');
  await page.getByLabel('Nombre completo').fill(name);
  await page
    .getByLabel('Correo electrónico')
    .fill(`pago-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.test`);
  await page.getByLabel('Contraseña', { exact: true }).fill('PruebaCliente2026!');
  await page.getByLabel('Repite la contraseña').fill('PruebaCliente2026!');
  const registered = page.waitForResponse(
    (response) =>
      response.url().endsWith('/api/auth/register') && response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Crear cuenta', exact: true }).click();
  const session = await (await registered).json();
  await expect(page).toHaveURL(/mi-cuenta/);
  return session.accessToken as string;
}
async function checkout(page: Page) {
  await page.goto('/productos/referencia-139183');
  await page.getByRole('button', { name: 'Agregar al carrito', exact: true }).click();
  await page.goto('/carrito');
  await page.getByLabel('Celular', { exact: true }).fill('999123456');
  await page.getByRole('radio', { name: /Yape/ }).check();
  const created = page.waitForResponse(
    (response) => response.url().endsWith('/api/orders') && response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Crear pedido y continuar', exact: true }).click();
  const order = await (await created).json();
  await expect(page).toHaveURL(new RegExp(`/mis-pedidos/${order.id}/pago`));
  await expect(
    page.getByAltText('QR de demostración del pedido; no realiza transferencias'),
  ).toBeVisible();
  return order;
}
async function administrator(browser: Browser) {
  const context = await browser.newContext({ baseURL: 'http://localhost:5173' });
  const page = await context.newPage();
  await page.goto('/login');
  await page.getByLabel('Correo electrónico').fill('admin@ferremax.pe');
  await page.getByLabel('Contraseña', { exact: true }).fill('FerreMax2026!');
  const logged = page.waitForResponse(
    (response) =>
      response.url().endsWith('/api/auth/login') && response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Ingresar al panel', exact: true }).click();
  const session = await (await logged).json();
  await expect(page).toHaveURL(/admin\/dashboard/);
  return { context, page, token: session.accessToken as string };
}
async function restoreDemoOrder(admin: Awaited<ReturnType<typeof administrator>>, orderId: string) {
  const headers = { Authorization: `Bearer ${admin.token}` };
  const sales = await (await admin.context.request.get('/api/admin/sales', { headers })).json();
  const sale = sales.records.find(
    (row: { orderId: string; status: string }) =>
      row.orderId === orderId && row.status === 'CONFIRMADA',
  );
  if (sale)
    expect(
      (
        await admin.context.request.post(`/api/admin/sales/${sale.id}/cancel`, {
          headers,
          data: {},
        })
      ).ok(),
    ).toBeTruthy();
  const payments = await (
    await admin.context.request.get('/api/admin/payments', { headers })
  ).json();
  const payment = payments.find((row: { orderId: string }) => row.orderId === orderId);
  if (payment?.status === 'REEMBOLSO_PENDIENTE')
    expect(
      (
        await admin.context.request.post(`/api/admin/payments/${payment.id}/refund`, {
          headers,
          data: {},
        })
      ).ok(),
    ).toBeTruthy();
}

test('Cliente: pedido privado, QR demo, rechazo, aprobación, entrega y devolución', async ({
  page,
  browser,
  request,
}, info) => {
  test.setTimeout(180000);
  const name = `Cliente QR ${Date.now()}`;
  const token = await customer(page, name);
  const order = await checkout(page);
  const headers = { Authorization: `Bearer ${token}` };
  const other = await request.post('/api/auth/register', {
    data: {
      name: 'Otra cuenta',
      email: `otra-${Date.now()}@example.test`,
      password: 'OtraCuenta2026!',
    },
  });
  const otherToken = (await other.json()).accessToken;
  expect(
    (
      await request.get(`/api/me/orders/${order.id}`, {
        headers: { Authorization: `Bearer ${otherToken}` },
      })
    ).status(),
  ).toBe(404);
  await page.setViewportSize({ width: 375, height: 1000 });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBeTruthy();
  const audit = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();
  expect(audit.violations).toEqual([]);
  await page.screenshot({ path: info.outputPath('qr-demo-movil.png'), fullPage: true });
  await page.getByRole('button', { name: 'Simular rechazo', exact: true }).click();
  await expect(page.locator('.payment-checkout-card .order-badge')).toHaveText('Pago rechazado');
  await page.getByRole('button', { name: 'Simular pago aprobado', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Tu pago está registrado.', exact: true }),
  ).toBeVisible();
  await page.goto(`/mis-pedidos/${order.id}`);
  await expect(page.locator('.orders-heading .order-badge')).toHaveText('Confirmado');
  await expect(page.getByRole('button', { name: 'Cancelar este pedido', exact: true })).toHaveCount(
    0,
  );
  const admin = await administrator(browser);
  try {
    await admin.page.goto('/admin/pedidos');
    await admin.page.getByRole('textbox', { name: /Buscar código o cliente/ }).fill(name);
    for (const stage of ['En preparación', 'Listo para entregar', 'Entregado']) {
      await admin.page.getByRole('button', { name: stage, exact: true }).click();
      await admin.page.getByRole('button', { name: 'Confirmar operación', exact: true }).click();
      await expect(admin.page.getByRole('dialog')).toHaveCount(0);
    }
    await expect(page.locator('.orders-heading .order-badge')).toHaveText('Entregado');
    const adminHeaders = { Authorization: `Bearer ${admin.token}` };
    const sales = await (await request.get('/api/admin/sales', { headers: adminHeaders })).json();
    const sale = sales.records.find((row: { orderId: string }) => row.orderId === order.id);
    expect(
      (
        await request.post(`/api/admin/sales/${sale.id}/cancel`, {
          headers: adminHeaders,
          data: {},
        })
      ).ok(),
    ).toBeTruthy();
    await admin.page.goto('/admin/pagos');
    await admin.page
      .getByRole('textbox', { name: 'Buscar pedido, cliente u operación', exact: true })
      .fill(name);
    await admin.page.getByRole('button', { name: 'Simular devolución', exact: true }).click();
    await admin.page.getByRole('checkbox', { name: /Entiendo que/ }).check();
    await admin.page.getByRole('button', { name: 'Registrar devolución', exact: true }).click();
    await expect(admin.page.getByRole('dialog')).toHaveCount(0);
    await page.reload();
    await expect(page.getByText('Devuelto', { exact: true })).toBeVisible();
    const detail = await (await request.get(`/api/me/orders/${order.id}`, { headers })).json();
    expect(detail.payment.status).toBe('REEMBOLSADO');
  } finally {
    try {
      await restoreDemoOrder(admin, order.id);
    } finally {
      await admin.context.close();
    }
  }
});

test('Revisión de pago: el reporte no aprueba, el administrador rechaza y confirma el reintento', async ({
  page,
  browser,
}) => {
  test.setTimeout(180000);
  const name = `Revision QR ${Date.now()}`;
  await customer(page, name);
  const order = await checkout(page);
  await page.getByRole('button', { name: 'Probar revisión manual', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Estamos revisando tu pago.', exact: true }),
  ).toBeVisible();
  const admin = await administrator(browser);
  try {
    await admin.page.goto('/admin/pagos');
    await admin.page
      .getByRole('textbox', { name: 'Buscar pedido, cliente u operación', exact: true })
      .fill(name);
    await admin.page.getByRole('button', { name: /Rechazar pago/ }).click();
    await admin.page
      .getByLabel('Nota de revisión')
      .fill('Referencia de prueba rechazada para verificar el reintento.');
    await admin.page.getByRole('checkbox', { name: /Entiendo que/ }).check();
    await admin.page.getByRole('button', { name: 'Rechazar operación', exact: true }).click();
    await expect(admin.page.getByRole('dialog')).toHaveCount(0);
    await expect(page.locator('.payment-checkout-card .order-badge')).toHaveText('Pago rechazado');
    await page.getByRole('button', { name: 'Probar revisión manual', exact: true }).click();
    await expect(
      page.getByRole('heading', { name: 'Estamos revisando tu pago.', exact: true }),
    ).toBeVisible();
    await admin.page.reload();
    await admin.page
      .getByRole('textbox', { name: 'Buscar pedido, cliente u operación', exact: true })
      .fill(name);
    await admin.page.getByRole('button', { name: 'Revisar pago', exact: true }).click();
    await admin.page.getByRole('checkbox', { name: /Entiendo que/ }).check();
    await admin.page.getByRole('button', { name: 'Aprobar pago', exact: true }).click();
    await expect(admin.page.getByRole('dialog')).toHaveCount(0);
    await expect(
      page.getByRole('heading', { name: 'Tu pago está registrado.', exact: true }),
    ).toBeVisible();
    await page.goto('/mis-pedidos');
    await expect(
      page.getByText(`FM-${order.id.slice(0, 8).toUpperCase()}`, { exact: true }),
    ).toBeVisible();
  } finally {
    try {
      await restoreDemoOrder(admin, order.id);
    } finally {
      await admin.context.close();
    }
  }
});
