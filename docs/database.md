# Datos

El esquema completo está en `backend/prisma/schema.prisma`. El demo JSON tiene las mismas entidades con nombres de colección.

| Modelo Prisma | Colección demo | Propósito |
| --- | --- | --- |
| User / Session | users / sessions | Usuarios, roles, hash y sesiones |
| Category / Product | categories / products | Catálogo, SKU y precio en céntimos |
| InventoryLot | lots | Unidades, costo y vencimiento por lote |
| InventoryMovement | movements | Entradas, salidas, devoluciones y ajustes |
| Supplier / Customer | suppliers / customers | Contactos |
| Purchase / PurchaseItem | purchases / purchaseItems | Recepción de mercadería |
| Sale / SaleItem | sales / saleItems | Venta registrada y detalle |
| Order / OrderItem | orders / orderItems | Solicitud de compra pública |
| Renewal | renewals | Próxima fecha y estado |
| AuditLog | auditLogs | Cambios administrativos |
| Setting | settings | Datos de tienda |

Relaciones tienen claves foráneas e índices. SKU, slug y correo de usuario son únicos. Una venta relacionada con pedido tiene `orderId` único. El historial no se elimina al desactivar productos. Los importes son enteros (S/ 12.90 = 1290). El stock total es la suma de todos los lotes; el vendible excluye los vencidos. Ambos aparecen por separado en inventario.

No hay columnas de stock duplicadas en producto ni cambios directos desde el navegador. El frontend muestra reportes pero las operaciones se calculan en servidor.
