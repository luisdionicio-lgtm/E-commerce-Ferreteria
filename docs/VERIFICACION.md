# Verificación de esta entrega

## Catálogo ampliado: seis referencias por categoría

- 36 imágenes nuevas descargadas de Promart e inspeccionadas en seis hojas visuales; catálogo base de 48 productos.
- Seis pruebas E2E aprobadas: la nueva verifica las 36 imágenes en filtros de categoría, precios contra la referencia guardada, detalle, enlaces de fuente y carrito persistente con un producto de cada categoría en móvil.
- Diez pruebas de backend aprobadas; la prueba MySQL del comando genérico se omite sin MYSQL_TEST_URL. Compilación backend y Next.js correcta.
- La importación MySQL crea productos, lotes y movimientos en una transacción; no modifica los productos existentes. Las nuevas imágenes están disponibles en el selector del panel administrativo.
- Precios publicados consultados el 14/11/2026; stock y costos ficticios, sin fechas de vencimiento inventadas para estas referencias.

## Pulido funcional y diagramas exportados

- Se evita el estado de carga indefinido en fichas cuando el catálogo está vacío.
- El carrito espera a que se restauren sus datos y termine la consulta del catálogo; la cantidad añadida se limita al stock.
- Enlace para saltar al contenido, navegación móvil con aria-expanded y datos de pedido autocompletados desde la cuenta.
- Cinco recorridos E2E aprobados, incluyendo teclado, menú móvil y catálogo vacío, además de los flujos anteriores.
- Tres diagramas exportados a PNG y SVG, inspeccionados visualmente; E-R generado desde el esquema Prisma y arquitectura compuesta para diapositiva 16:9.

## Versión del curso — 14 de noviembre de 2026

- Frontend Next.js 16.4.6 con Pages Router real; React Router y Vite retirados.
- Backend Express separado y proxy `/api` desde Next, con variables de servidor.
- Compilación Next y TypeScript correcta; rutas públicas y administrativas generadas.
- 10 pruebas de API/dominio/CRUD aprobadas; la prueba de MySQL se omite en el comando genérico si falta MYSQL_TEST_URL.
- Prueba MySQL real aprobada por separado en `ferremax_course_verify_20261114`: migración versionada, seed, recepción de compra, venta, rollback, anulación y roles.
- 4 recorridos Playwright aprobados en Edge/Chromium: filtros por URL, galería, registro/login, carrito persistente, pedido-confirmación-anulación, panel y 404. Comprobación responsive a 320, 375, 414, 768 y 1280px sin desbordamiento; sin errores de hidratación en el recorrido instrumentado.
- Los cuatro recorridos también se repitieron con la API local conectada a MySQL; resultado 4/4. `/api/health` devolvió `driver: mysql`. Para repetir la prueba aislada usar `npm run test:mysql` con MYSQL_TEST_URL; las pruebas conservan sus registros ficticios y restauran el stock de sus ventas.
- Auditoría npm: cero vulnerabilidades al verificar. Formato Prettier y detector Impeccable sin incidencias.
- Capturas actuales Next: `docs/previews/07-next-tienda.png` y `08-next-movil.png`. Las anteriores corresponden a versiones históricas.
- Material del curso: E-R, arquitectura, secuencia Next–Express, justificación de MySQL, guía de exposición y configuración de despliegue.
- Nube pospuesta expresamente por el estudiante; no se afirma una URL pública ni una prueba cloud.

Se probaron los flujos descritos; esto no constituye una auditoría exhaustiva de seguridad, prueba de carga o certificación. Los pagos online, correos de recuperación y comprobantes fiscales no forman parte del alcance implementado.

## Actualización del 18 de octubre de 2026

- Registro e inicio de sesión de clientes, cuenta y cierre de sesión.
- Roles de cliente y personal separados en frontend y backend.
- 9 pruebas de API/inventario/registro y 2 recorridos E2E con Playwright.
- Guía de comprobación humana en `PRUEBA_MANUAL.md`.
- Compilación TypeScript y Vite; formato reproducible con Prettier.
- MySQL 8.4 levantado localmente con Docker en puerto 3307; esquema Prisma sincronizado y seed ejecutado. El README explica el puerto alternativo.
- La conexión Docker dejó de estar disponible después del seed. La entrega local queda ejecutándose en modo JSON persistente; no se declara completada una prueba E2E contra MySQL.
- `.env`, archivos JSON locales, sesiones, dependencias y salidas de prueba excluidos de Git.
- Fotografías y datos comerciales identificados como referenciales.

Las verificaciones históricas siguientes corresponden a la entrega original.

- Compilación frontend y backend: correcta.
- Prisma Client generado: correcto.
- 8 pruebas automatizadas de API/inventario: correctas.
- 20 comprobaciones de interfaz en Chromium: correctas.
- Capturas reales de la aplicación en docs/previews.
- Driver MySQL: esquema generado/validado; conexión a servidor MySQL no ejecutada en este entorno.

- Portada y catálogo conectados
- Login admin y dashboard
- Sesión conservada al recargar
- Vista Productos
- Vista Categorías
- Vista Inventario
- Vista Compras
- Vista Ventas
- Vista Pedidos web
- Vista Proveedores
- Vista Clientes
- Vista Vencimientos
- Vista Renovaciones
- Vista Reportes
- Vista Usuarios
- Vista Configuración
- Formulario producto guarda y muestra resultado
- Carrito y pedido público
- Confirmar pedido crea venta
- Responsive 390 px y navegación móvil
