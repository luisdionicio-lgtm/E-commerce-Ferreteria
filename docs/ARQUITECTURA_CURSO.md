# Arquitectura y comunicación cliente-servidor

```mermaid
flowchart LR
    B[Navegador del cliente o personal] -->|HTTPS páginas y navegación| N[Next.js 16 / Pages Router]
    B -->|fetch /api + cookie o Bearer| N
    N -->|rewrite /api/*| E[Express / Node.js]
    E --> A[Validación Zod + JWT + roles]
    A --> S[Servicios: catálogo, compras, ventas, FEFO]
    S --> R[Interfaz Repository / Unit]
    R --> P[Prisma / transacciones]
    P --> M[(MySQL)]
    R -. demo local .-> J[(JSON persistente)]
```

Next.js y Express son procesos independientes. El navegador usa una sola URL para web y API: Next reenvía las peticiones mediante `rewrites` a `API_ORIGIN`. No hay API comercial implementada dentro de Next ni secretos publicados como variables NEXT_PUBLIC.

```mermaid
sequenceDiagram
    participant C as Navegador
    participant N as Next.js
    participant E as Express
    participant D as MySQL/Prisma
    C->>N: GET /catalogo
    N-->>C: HTML + JavaScript de la página
    C->>N: GET /api/catalog/products
    N->>E: GET /api/catalog/products
    E->>D: Leer productos, categorías y lotes
    D-->>E: Datos persistidos
    E-->>C: JSON con precio y stock vendible vía Next
    C->>N: POST /api/orders con artículos y contacto
    N->>E: Reenviar petición
    E->>D: Transacción: validar y crear pedido e ítems
    E-->>C: 201 + id del pedido vía Next
    Note over C,D: El pedido no cobra ni reserva stock
    C->>N: Personal: POST /api/admin/sales + Bearer
    N->>E: Reenviar petición
    E->>D: Validar rol, stock FEFO, venta y movimientos
    E-->>C: Venta confirmada vía Next
```

## Autenticación

1. El formulario envía email y contraseña a Express a través de Next.
2. Express compara bcrypt y devuelve un JWT de 15 minutos; el refresh de 7 días se guarda como cookie HttpOnly, SameSite Strict y Secure en producción.
3. El JWT se mantiene en memoria y se envía como Bearer. La sesión se restaura con `/auth/refresh` y se rota el token de refresco.
4. Express consulta el usuario activo y verifica permisos. Ocultar botones en frontend no constituye autorización.

## Renderizado

Se usa Pages Router con páginas por archivo, HTML prerenderizado e hidratación. El catálogo se consulta a Express en cliente tras montar el proveedor de contexto; no se declara SSR de productos ni ISR. El estado del carrito se restaura después del montaje para evitar diferencias entre servidor y navegador.

## Variables

`API_ORIGIN`: solo servidor Next. `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, `DATA_DRIVER`, `PORT` y `TRUST_PROXY`: Express. Los archivos `.env` están ignorados; `.env.example` describe los valores necesarios.
