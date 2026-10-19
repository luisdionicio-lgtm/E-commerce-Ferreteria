# API

Base local: `http://localhost:3001/api`. Importes monetarios en céntimos. Rutas admin requieren `Authorization: Bearer <accessToken>`; refresh cookie automático en navegador.

| Método | Ruta | Acceso |
| --- | --- | --- |
| GET | /health | Público |
| POST | /auth/login | Público: email/password |
| POST | /auth/refresh, /auth/logout | Cookie de sesión |
| GET | /catalog/products?q=&category= | Público |
| GET | /catalog/products/:slug | Público |
| GET | /catalog/categories, /catalog/settings | Público |
| POST | /orders | Público; pedido pendiente |
| GET | /admin/dashboard, /admin/inventory | Empleado/admin |
| GET | /admin/products,categories,suppliers,customers,renewals | Empleado/admin (una ruta por recurso) |
| POST/PATCH/DELETE | /admin/<recurso>[/<id>] | Admin; DELETE desactiva/completa |
| GET/POST/PATCH/DELETE | /admin/users[/<id>] | Admin |
| POST | /admin/inventory/adjustments | Empleado/admin |
| GET/POST | /admin/purchases | Empleado/admin |
| POST | /admin/purchases/:id/receive | Empleado/admin |
| GET/POST | /admin/sales | Empleado/admin |
| POST | /admin/sales/:id/cancel | Admin |
| GET | /admin/orders | Empleado/admin |
| POST | /admin/orders/:id/cancel | Empleado/admin |
| GET | /admin/alerts/low-stock, /admin/alerts/expirations | Empleado/admin |
| GET | /admin/reports/sales | Empleado/admin |
| GET/PATCH | /admin/settings | GET empleado/admin, PATCH admin |
| GET | /admin/audit | Admin |

Confirmar pedido: `POST /admin/sales` con `{"orderId":"ID","items":[],"payment":"EFECTIVO"}`. Las líneas y el precio se obtienen en servidor.

Venta directa:

```json
{"items":[{"productId":"prod-1","quantity":1}],"payment":"EFECTIVO"}
```

Compra:

```json
{"supplierId":"sup-1","items":[{"productId":"prod-1","quantity":5,"cost":25000,"expiresAt":null}]}
```

Ajuste:

```json
{"lotId":"lot-1","delta":-2,"reason":"Diferencia en conteo físico"}
```

Pedido público:

```json
{"customerName":"Cliente demo","phone":"999123456","email":"","address":"","items":[{"productId":"prod-1","quantity":1}]}
```

Errores JSON: `{ "message": "Descripción" }`, estados 400 validación, 401 sesión, 403 rol/origen, 404 no existe, 409 stock o conflicto, 429 rate limit, 500 error interno.
