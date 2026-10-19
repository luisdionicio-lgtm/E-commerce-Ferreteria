# Arquitectura

Monolito modular con dos aplicaciones de desarrollo. Vite sirve el frontend; Express expone `/api`. El proxy de Vite evita cambiar URLs entre cliente y servidor. El navegador nunca accede directamente a MySQL.

Flujo: vista React → cliente HTTP → ruta Express → validación Zod / autenticación / autorización → servicio de dominio → repositorio → almacenamiento.

Los repositorios implementan `Repository` y `Unit`: lectura aislada y transacción con CRUD por tabla. El modo JSON usa snapshots, cola serial y reemplazo atómico; MySQL usa Prisma y transacciones serializables con hasta tres intentos para conflictos P2034. Los servicios de venta, recepción, ajuste y anulación son comunes a ambos drivers.

La lectura de listas usa filtrado de datos en cliente y carga completa de las tablas del repositorio para facilitar este demo. Para catálogos grandes se debe implementar filtrado, agregación y paginación en las consultas Prisma y API; no es un sistema probado para grandes volúmenes.

## Invariantes

- Crear una compra pendiente no modifica inventario. Recibirla crea lote y entrada una sola vez.
- Precio de venta proviene de productos en servidor; costo de compra es entrada del operador validada.
- Venta, líneas, lotes y movimientos se guardan juntos o se revierten juntos.
- La selección FEFO excluye lotes vencidos y agota primero los más próximos a vencer.
- Un pedido no reserva ni descuenta stock. Solo se puede confirmar una vez.
- Anular una venta conserva registros y genera devoluciones a los lotes originales.
- El catálogo público no revela usuarios, clientes, proveedores, costos o movimientos.
- Desactivar usuarios impide usar tokens ya emitidos, porque cada petición consulta su estado actual.

## Autenticación

Access token en memoria del navegador. Refresh aleatorio almacenado como hash SHA-256 en servidor y cookie HttpOnly SameSite Strict; rotación con eliminación de la sesión anterior. bcrypt para contraseñas, rate limit de login/pedidos, validación de origen, Helmet, errores sin stack público. Solo un origen frontend configurado. En producción, cookie Secure y requisito de HTTPS.

## Extensiones futuras

Fotografías autorizadas con almacenamiento de archivos, alertas programadas, reservas con vencimiento para checkout, pago verificado por webhook, emisión fiscal con proveedor/SUNAT, respaldo automático y observabilidad.
