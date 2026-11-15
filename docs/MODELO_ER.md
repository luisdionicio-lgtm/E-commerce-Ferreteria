# Modelo entidad-relación y elección de base de datos

## Por qué MySQL

FerreMax conecta productos, categorías, proveedores, compras, lotes, ventas y usuarios. Una venta puede consumir varios lotes y debe actualizar existencias y registrar movimientos en una sola transacción. MySQL aporta claves foráneas, índices, unicidad y transacciones serializables. Prisma define el esquema y permite migraciones versionadas. No se eligió una base documental porque aquí predominan relaciones y consistencia transaccional, no documentos independientes.

El modo JSON es un repositorio alternativo para demostración local: serializa las escrituras y persiste de forma atómica, pero no sustituye MySQL en nube. La configuración de producción rechaza JSON.

## Diagrama

Disponible también como [imagen PNG completa](diagramas/01-modelo-er.png) y [SVG vectorial](diagramas/01-modelo-er.svg), generados desde el esquema real. El Mermaid de esta sección resume el núcleo transaccional para explicarlo con menos detalle.

```mermaid
erDiagram
    User ||--o{ Session : inicia
    User o|--o{ Order : realiza_con_sesion
    Order ||--o| Payment : registra
    User o|--o{ Payment : revisa
    User ||--o{ Purchase : registra
    User ||--o{ Sale : confirma
    User ||--o{ InventoryMovement : realiza
    User ||--o{ AuditLog : genera
    Category ||--o{ Product : clasifica
    Product ||--o{ InventoryLot : posee
    Product ||--o{ InventoryMovement : afecta
    InventoryLot ||--o{ InventoryMovement : registra
    Supplier ||--o{ Purchase : suministra
    Purchase ||--o{ PurchaseItem : contiene
    Product ||--o{ PurchaseItem : comprado
    Customer o|--o{ Sale : destinatario
    Order o|--o| Sale : confirmado_como
    Sale ||--o{ SaleItem : contiene
    Product ||--o{ SaleItem : vendido
    Order ||--o{ OrderItem : contiene
    Product ||--o{ OrderItem : solicitado
    User {
      string id PK
      string email UK
      string passwordHash
      string role
      boolean active
    }
    Product {
      string id PK
      string sku UK
      string slug UK
      string categoryId FK
      int price
      int minStock
    }
    InventoryLot {
      string id PK
      string productId FK
      int quantity
      int cost
      string expiresAt
    }
    Purchase {
      string id PK
      string supplierId FK
      string userId FK
      string status
      int total
    }
    Sale {
      string id PK
      string orderId FK,UK
      string customerId FK
      string userId FK
      int total
      string status
    }
    Order {
      string id PK
      string userId FK "nullable"
      string customerName
      string email
      int total
      string status
    }
```

Además de las entidades del resumen, `Payment` enlaza un pago único con cada pedido; incluye importe, modo, operación, revisión y devolución. El gráfico completo incorpora todos sus campos y el responsable de revisión.

El esquema completo y definitivo, incluidos `Setting`, `Renewal`, campos secundarios e índices, está en `backend/prisma/schema.prisma`. La migración inicial está en `backend/prisma/migrations/20261114000000_initial`.

## Decisiones que se deben explicar

- Dinero en céntimos enteros: 47990 representa S/ 479.90. Se evita el redondeo de coma flotante.
- El stock se obtiene de los lotes; no se mantiene un contador duplicado en Producto.
- FEFO: se consumen primero los lotes válidos que antes vencen. Los vencidos no son vendibles.
- Pedido pendiente no reserva stock. Al confirmar se conservan los precios guardados en sus líneas y se vuelve a validar disponibilidad; una venta directa usa los precios actuales del catálogo.
- El correo del usuario es único; el rol público siempre es CUSTOMER. Los contactos comerciales Customer no son credenciales de autenticación.
- `Order.userId` enlaza los pedidos creados con una sesión. Los pedidos de invitados o históricos siguen sin propietario; no se asignan por coincidencia de correo. El cliente solo consulta sus pedidos.
- `Payment.orderId` es único: un ciclo de pago por pedido. Su modo distingue demo y QR manual, con estado, importe inmutable, operación, revisión y devolución. La restricción compuesta `(mode, reference)` evita reutilizar una operación; `reviewedBy` enlaza al responsable de revisión. No se promete verificación bancaria automática ni verificación de correo.
- Una venta tiene `orderId` único para impedir confirmar dos veces el mismo pedido.
- Desactivar productos conserva sus relaciones históricas.
- Las fechas de vencimiento usan YYYY-MM-DD y las operaciones instantes UTC ISO.
