# Presentación Semana 16 — FerreMax

Curso: Desarrollo Web Avanzado. Profesor: Arévalo. Tema: e-commerce básico de ferretería. Esta guía adapta los requisitos de las tres capturas proporcionadas por el estudiante; no reproduce una guía adicional del curso que no haya sido suministrada.

## Imágenes listas para utilizar

- [Modelo E-R completo en PNG](diagramas/01-modelo-er.png).
- [Arquitectura Next.js + Express + MySQL en PNG](diagramas/02-arquitectura.png).
- [Comunicación cliente-servidor en PNG](diagramas/03-flujo-cliente-servidor.png).
- [Archivos SVG ampliables, fuentes y regeneración](diagramas/README.md).

## Matriz de cumplimiento

| Requisito de las capturas | Implementación o evidencia |
| --- | --- |
| Frontend Next.js | `frontend/package.json`, `frontend/src/pages`, `docs/MIGRACION_NEXT.md` |
| Backend Express | `backend/src/app.ts`, módulos y servicios |
| Productos, carrito, pedidos, usuarios | Catálogo, filtros, detalle, galería, carrito persistente, pedido, login/registro |
| Usuarios y roles | CUSTOMER, EMPLOYEE y ADMIN; controles en Express y frontend |
| Historial privado y pago demo | Usuario–Pedido–Pago, QR demo, revisión administrativa, entrega y devoluciones simuladas; `docs/PAGOS_YAPE.md` |
| Variables y buenas prácticas | `.env.example`, `.gitignore`, validaciones, contraseñas bcrypt, cookies HttpOnly |
| Base relacional o documental | MySQL/Prisma; JSON solo como alternativa de demostración local |
| Modelo E-R | `docs/MODELO_ER.md` y esquema Prisma |
| Arquitectura básica | `docs/ARQUITECTURA_CURSO.md` |
| Justificación tecnológica | Sección MySQL en `docs/MODELO_ER.md` |
| Demostración en vivo | Guion siguiente y `docs/PRUEBA_MANUAL.md` |
| Comunicación Next–Express | Diagrama de secuencia en `docs/ARQUITECTURA_CURSO.md` |
| Desafíos y soluciones | Tabla siguiente |
| Aplicación desplegada en nube | Configuración y pasos en `docs/DESPLIEGUE.md`; pendiente hasta registrar y verificar URLs reales |

## Guion sugerido de 8–10 minutos

1. **Problema y alcance (1 min).** Ferretería que necesita publicar productos y centralizar pedidos, proveedores e inventario por lotes. Explicar que se coordinan pago y entrega; no hay cobro online ni comprobantes SUNAT.
2. **Arquitectura y DB (2 min).** Mostrar los dos diagramas. Elegir dos relaciones para explicar: Proveedor–Compra–Lote y Pedido–Venta. Mostrar una petición en la pestaña Network del navegador.
3. **Cliente (2 min).** Registrar cuenta ficticia, buscar y filtrar, abrir galería, añadir al carrito y recargar. Elegir Yape demo, crear pedido, mostrar el QR de prueba y simular aprobación. Abrir Mis pedidos y su seguimiento. Aclarar que no se transfiere dinero real.
4. **Personal (2 min).** Localizar el pedido confirmado y avanzar preparación/entrega; comprobar stock y movimientos. Como variante, probar reporte y revisión de pago en Pagos de pedidos. Mostrar proveedor y vencimiento de un lote. Explicar que los lotes vencidos no se venden.
5. **Seguridad y pruebas (1–2 min).** Demostrar que un cliente no accede a `/admin/dashboard`; ejecutar `npm test` y mostrar el resultado de `npm run test:e2e` y GitHub Actions.
6. **Cierre (1 min).** Mostrar repositorio, URLs públicas si ya están desplegadas, limitaciones y siguientes pasos.

## Desafíos y soluciones

| Desafío | Solución aplicada |
| --- | --- |
| Cambiar de Vite sin perder funciones | Rutas reales por archivos Next y reutilización de componentes; pruebas antes/después |
| localStorage no existe en servidor | Restaurar el carrito en un efecto después del primer render |
| Autenticación entre dos servicios | Proxy `/api` de Next, cookie del mismo origen, JWT en memoria y permisos en Express |
| Evitar ventas simultáneas sin stock | Transacciones serializables y pruebas de concurrencia; FEFO para lotes |
| Fechas e importes | Céntimos enteros, vencimientos YYYY-MM-DD e instantes UTC |
| Reproducir datos sin servicios externos | Repositorio JSON local y seed de MySQL sin sobrescribir usuarios existentes |
| Desplegar sobre una base existente | Migraciones versionadas y procedimiento de baseline, sin borrar datos |
| Fotos de productos con variantes | Fuentes documentadas y galería marcada como referencial |
| Historial sin exponer pedidos ajenos | Propietario desde sesión, comprobación por pedido y 404 para otra cuenta |
| No duplicar venta al repetir pago | Un pago por pedido, referencias únicas y transacción de pago/venta/stock |
| QR demo frente a cobro bancario real | Modo explícito sin transferencias; QR comercial manual configurable, sin fingir validación bancaria |

## Preparación antes de exponer

- Confirmar frontend, API y DB encendidos; preparar terminales y pestañas.
- Si se exige nube, completar el despliegue y registrar URLs reales en la guía; localhost no satisface ese criterio.
- Crear un pedido de prueba reciente y localizar un lote próximo a vencer. Las fechas demo cambian de estado con el calendario.
- Usar datos ficticios; no mostrar secretos de `.env` al compartir pantalla.
- Revisar presentación personal y vestimenta según lo solicitado en la captura.
- Conservar evidencia de pruebas y una captura del sistema por si falla la conexión durante la exposición.
