# Pedidos privados y pago Yape de demostración

El usuario eligió modo demo el 15/11/2026. No se han afiliado cuentas bancarias, no se cobran fondos y no se solicitan claves, PIN ni códigos de aprobación de Yape.

## Modos de operación

| Modo | QR | Confirmación |
| --- | --- | --- |
| `demo` | URL privada del pedido, generada con QRCode; no es un QR bancario ni funciona para transferir desde Yape | Simulación del propietario o revisión administrativa de la demostración |
| `manual` | Contenido exacto del QR comercial suministrado por el titular | El cliente reporta el número de operación; un administrador verifica el abono fuera del sistema antes de aprobar |
| `disabled` | Sin inicio de pagos | Los pedidos pueden coordinarse con la tienda |

La API rechaza `demo` en producción. El modo predeterminado es demo en desarrollo y disabled en producción. No hay una integración automática con los servidores de Yape; un QR o un número de operación no prueba que exista un abono.

## Configurar tu QR después

En `backend/.env`, fuera de Git:

```dotenv
PAYMENT_MODE=manual
YAPE_MERCHANT_NAME=Nombre real del titular o comercio
YAPE_MERCHANT_PHONE=Celular comercial opcional
YAPE_QR_PAYLOAD=CONTENIDO_EXACTO_EXTRAIDO_DE_TU_QR_COMERCIAL
```

El payload debe proceder de tu QR auténtico de Yape. No se genera a partir de un teléfono ni se inventa un formato bancario. El QR comercial puede ser estático: el cliente introduce el total mostrado al transferir. La aplicación no modifica el payload para insertar un monto. Verifica titular e importe en la aplicación de Yape antes de efectuar cualquier transferencia. Reinicia Express después de cambiar estas variables.

Para aceptación y confirmación automática se requiere contratar e integrar una pasarela compatible, sus credenciales y notificaciones verificadas. [Yape indica las pasarelas para compras por internet](https://www.yape.com.pe/preguntas-frecuentes/compras-por-internet/como-puedo-tener-la-opcion-de-compras-por-internet-codigo-de-aprobacion-yape-en-l). La documentación de [Culqi](https://docs.culqi.com/es/documentacion/pagos-online/cargo-unico/tokens-yape) distingue el pago con código de aprobación de las billeteras con QR; no son el mismo protocolo.

## Seguridad y consistencia

- `Order.userId` procede de la sesión verificada, nunca del cuerpo del pedido ni de un correo coincidente. Los pedidos antiguos o de invitados no se atribuyen automáticamente a ninguna cuenta.
- Listado, detalle, QR, reporte y simulación comprueban propiedad; un pedido ajeno devuelve 404. Las respuestas privadas usan `Cache-Control: private, no-store`.
- El importe se obtiene del pedido y se conserva el precio de sus líneas. La API rechaza importes o estados enviados en el cuerpo del inicio del pago.
- Confirmar pago, crear venta y descontar lotes FEFO es una sola transacción. La repetición o concurrencia no crea dos ventas.
- Crear pedido o mostrar QR no reserva stock. Al aprobar se revalida el inventario. Si no alcanza, no se marca pago aprobado ni se crea venta parcial; en modo manual el administrador debe resolver cualquier abono externo antes de reintentar o devolverlo.
- Informar una operación deja el pago en revisión, sin aprobarlo. Las referencias de pago no se reutilizan entre pedidos del mismo modo.
- La revisión y el registro de devolución requieren administrador. Anular una venta devuelve stock y marca devolución pendiente; nunca afirma haber devuelto dinero automáticamente. En manual, la devolución se hace fuera del sistema y después se registra su referencia.
- Las acciones generan auditoría con responsable y fecha. El flujo de entrega avanza por etapas y exige pedido confirmado.

## Estados

Pago: `CREADO → EN_REVISION → APROBADO` o `RECHAZADO` con reintento. La demo permite simular aprobación o rechazo. Una anulación tras aprobar genera `REEMBOLSO_PENDIENTE → REEMBOLSADO`; un pedido cancelado antes del pago queda `CANCELADO`.

Entrega: `POR_PREPARAR → EN_PREPARACION → LISTO → ENTREGADO`. Solo el personal cambia estas etapas; el cliente las consulta.

## Flujo del pedido y su pago

```mermaid
sequenceDiagram
    participant C as Cliente autenticado
    participant N as Next.js
    participant E as Express
    participant D as MySQL / Prisma
    participant A as Administrador
    C->>N: Crear pedido con sesión
    N->>E: POST /api/orders + Bearer
    E->>D: Guardar propietario, líneas e importe
    D-->>E: Pedido privado pendiente
    E-->>N: Identificador del pedido
    N-->>C: Abrir pago del pedido
    C->>N: Iniciar pago propio y consultar QR
    N->>E: Reenviar petición autenticada
    E->>D: Crear Payment único por pedido
    E-->>N: QR, importe y modo configurado
    N-->>C: Pantalla de pago
    Note over C,E: En demo el QR no mueve dinero ni se comunica con Yape
    alt Aprobación simulada en desarrollo
      C->>N: Simular aprobación de pago demo
      N->>E: Reenviar simulación autenticada
    else Operación enviada a revisión
      C->>N: Reportar referencia de operación
      N->>E: Reenviar reporte autenticado
      E->>D: Pago EN_REVISION, sin aprobar
      A->>N: Revisar y aprobar el pago
      N->>E: Reenviar decisión del administrador
    end
    E->>D: Transacción: validar stock, venta, lotes y pago
    alt Stock suficiente
      D-->>E: Una venta, stock descontado, pago APROBADO
      E-->>N: Pedido confirmado
      N-->>C: Mostrar resultado
      A->>N: Preparar, marcar listo y entregar
      N->>E: Reenviar siguiente etapa
      E->>D: Guardar etapa de entrega
      C->>N: Consultar seguimiento propio
      N->>E: Reenviar consulta privada
      E-->>N: Estado actualizado del pedido
      N-->>C: Mostrar seguimiento
    else Sin stock o conflicto no recuperable
      D-->>E: Rollback de toda la transacción
      E-->>N: No se confirmó pago ni venta
      N-->>C: Mostrar error recuperable
    end
```

### Evidencia de las pantallas

| Pantalla | Captura |
| --- | --- |
| Historial privado | [Mis pedidos](previews/20-mis-pedidos.png) |
| Detalle y seguimiento | [Pedido en preparación](previews/21-detalle-pedido.png) |
| QR de demostración | [Pago QR](previews/22-pago-qr-demo.png) |
| Pago aprobado | [Resultado](previews/23-pago-aprobado.png) |
| Revisión de pagos | [Panel](previews/24-admin-pagos.png) |
| QR móvil | [Vista móvil](previews/25-pago-qr-movil.png) |
| Historial móvil | [Vista móvil](previews/26-mis-pedidos-movil.png) |
| Operación en revisión | [Estado pendiente](previews/27-pago-revision.png) |
| Revisión administrativa | [Confirmación explícita](previews/28-revision-admin.png) |

Las capturas usan pedidos ficticios. `scripts/capture-orders.mjs` solo opera si la API está en demo, registra la evidencia y al terminar anula su venta y simula la devolución para restaurar el stock. Conserva los registros de prueba y su auditoría. El [informe de contraste](previews/orders-contrast-report.json) registra las vistas comprobadas, no una certificación completa de accesibilidad.

## Endpoints

- `GET /api/me/orders?page=1` y `GET /api/me/orders/:id`: historial y detalle propios.
- `POST /api/me/orders/:id/cancel`: cancelar un pedido pendiente sin pago por resolver.
- `GET /api/payment-options`: modo habilitado, sin credenciales.
- `POST /api/me/orders/:id/payment`: iniciar o recuperar el pago.
- `GET /api/me/orders/:id/payment`: QR, total, titular, modo y estado propios.
- `POST /api/me/orders/:id/payment/report`: `{ "reference": "OPERACION-123456" }`.
- `POST /api/me/orders/:id/payment/simulate`: `{ "outcome": "approved" }` o `rejected`, solo demo.
- `GET /api/admin/payments`: revisión del personal.
- `POST /api/admin/payments/:id/review`: decisión `approve`/`reject` y `note`, solo administrador.
- `POST /api/admin/payments/:id/refund`: referencia de devolución; en demo puede omitirse.
- `PATCH /api/admin/orders/:id/fulfillment`: siguiente etapa de entrega.

## Imagen de marca

El icono `frontend/public/images/payments/yape.png` se descargó de la [web oficial de Yape](https://www.yape.com.pe/images/components/component-25/logo.png). Se utiliza como referencia de método de pago; FerreMax no afirma afiliación ni certificación. Los demás iconos del flujo pertenecen a Lucide, ya utilizado en el sistema.
