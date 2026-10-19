# Prueba del e-commerce para portafolio

## Arranque

En una terminal dentro de la carpeta del proyecto: `npm ci`, luego `npm run dev`. Abre http://localhost:5173. El modo JSON crea su almacenamiento local automáticamente; no requiere MySQL.

## Cliente

1. Abre **Ingresar → Crea una cuenta**. Registra nombre, correo ficticio y contraseña de 10 a 72 caracteres. Comprueba que aparece Mi cuenta.
2. Cierra sesión e ingresa nuevamente con ese correo. Intenta registrar el mismo correo; debe mostrar un error.
3. Abre Catálogo, busca Bosch, cambia categoría, ordena por precio y activa Solo productos con stock. Una búsqueda inexistente muestra el estado vacío.
4. Abre un producto, agrega al carrito, cambia cantidad y recarga. Se conserva el carrito. Comprueba subtotal y total. El stock limita la cantidad.
5. Envía un pedido con datos ficticios. Debe aparecer el número de pedido y vaciarse el carrito. No se efectúan cobros ni se reserva inventario antes de confirmar.
6. Con una cuenta de cliente, visita `/admin/dashboard`. Debes volver a Mi cuenta. La API administrativa también rechaza el acceso.

## Personal

1. En `/login`, usa `admin@ferremax.pe` / `FerreMax2026!` (solo demo).
2. Crea y edita un producto; verifica SKU, imagen, precio y categoría. El stock se carga por Compras, no al crear el producto.
3. Crea una compra con proveedor, producto, cantidad y vencimiento opcional. Recíbela una sola vez. Comprueba lote y movimiento de inventario.
4. En Pedidos web confirma el pedido del cliente como venta. Comprueba el descuento de stock.
5. Anula esa venta como administrador. Comprueba que el lote recupera las unidades.
6. Revisa Proveedores, Vencimientos y Reportes. Los lotes vencidos no se pueden vender.
7. Como `empleado@ferremax.pe` / `Empleado2026!`, verifica que Usuarios y Configuración no estén disponibles y que la API rechace cambios administrativos.

## Comprobaciones automáticas

`npm test` verifica API, registro, permisos, sesiones y operaciones de inventario. `npm run build` verifica TypeScript y genera el frontend de producción. No uses datos personales reales para las pruebas del demo.

Para repetir las pruebas de navegador: `npx playwright install chromium` y `npm run test:e2e`. Las pruebas crean cuentas ficticias en el demo local. Si ya tienes Chrome o Edge, en PowerShell puedes usar `$env:PLAYWRIGHT_CHANNEL='chrome'` (o `'msedge'`) antes de ejecutar las pruebas, sin descargar Chromium.

## Base de datos

Consulta README para MySQL 8.4 + Prisma. El modo JSON es persistente y transaccional, pero no es MySQL. No declares una verificación MySQL si solo ejecutaste el demo JSON.
