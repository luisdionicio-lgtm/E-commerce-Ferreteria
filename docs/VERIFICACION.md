# Verificación de esta entrega

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
