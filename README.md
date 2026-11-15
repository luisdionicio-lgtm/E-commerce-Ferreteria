# FerreMax

[![Verify FerreMax](https://github.com/luisdionicio-lgtm/E-commerce-Ferreteria/actions/workflows/ci.yml/badge.svg)](https://github.com/luisdionicio-lgtm/E-commerce-Ferreteria/actions/workflows/ci.yml)

Proyecto full stack de portafolio de Luis Dionicio, adaptado al curso de Desarrollo Web Avanzado del profesor Arévalo: e-commerce de ferretería con catálogo, búsqueda y filtros, galería, carrito persistente, registro e inicio de sesión de clientes, pedidos y panel administrativo con inventario por lotes. Next.js 16 (Pages Router), React 19, TypeScript, Express, MySQL y Prisma.

Material para la entrega: [presentación Semana 16](docs/PRESENTACION_SEMANA_16.md), [arquitectura Next–Express](docs/ARQUITECTURA_CURSO.md), [modelo E-R y elección de MySQL](docs/MODELO_ER.md), [despliegue](docs/DESPLIEGUE.md), [migración desde Vite](docs/MIGRACION_NEXT.md) y [verificación](docs/VERIFICACION.md). Las URLs públicas permanecen pendientes hasta completar el despliegue en una cuenta de hosting.

También se incluyen [imágenes PNG/SVG de los diagramas solicitados](docs/diagramas/README.md), listas para la exposición. Se regeneran con `npm run docs:diagrams`.

## Evidencia técnica: diagramas del proyecto

Los siguientes diagramas documentan la implementación de FerreMax para el curso de Desarrollo Web Avanzado. Corresponden al sistema local; el despliegue en nube permanece pendiente.

### Modelo entidad–relación (MER)

Generado desde el esquema Prisma: productos, categorías, proveedores, compras, pedidos, ventas, usuarios, sesiones e inventario por lotes con vencimientos. Incluye claves primarias, foráneas, únicas y campos opcionales.

![Modelo entidad–relación completo de FerreMax](docs/diagramas/01-modelo-er.png)

[Ampliar en SVG](docs/diagramas/01-modelo-er.svg) · [Fuente Mermaid](docs/diagramas/01-modelo-er.mmd) · [Justificación del modelo](docs/MODELO_ER.md)

### Arquitectura Next.js + Express + MySQL

El navegador accede a Next.js, que reenvía las solicitudes `/api` a Express. El backend aplica validaciones y permisos y accede a MySQL mediante Prisma; el repositorio JSON es una alternativa para la demostración local.

![Arquitectura de FerreMax con Next.js, Express, Prisma y MySQL](docs/diagramas/02-arquitectura.png)

[Ampliar en SVG](docs/diagramas/02-arquitectura.svg) · [Fuente Mermaid](docs/diagramas/02-arquitectura.mmd) · [Explicación técnica](docs/ARQUITECTURA_CURSO.md)

### Secuencia cliente–servidor

Consulta del catálogo, registro del pedido y confirmación de la venta por personal autorizado. El pedido no cobra ni reserva stock; la venta valida existencias y utiliza primero los lotes que vencen antes (FEFO).

![Secuencia entre navegador, Next.js, Express y MySQL](docs/diagramas/03-flujo-cliente-servidor.png)

[Ampliar en SVG](docs/diagramas/03-flujo-cliente-servidor.svg) · [Fuente Mermaid](docs/diagramas/03-flujo-cliente-servidor.mmd)

El flujo comercial es **pedido sujeto a confirmación**: permite seleccionar productos y enviar una solicitud; el personal confirma stock, pago y entrega. No incorpora una pasarela de pago, cobros online, recuperación de contraseña ni verificación de correo. Los precios, existencias, proveedores y fotografías son referenciales.

## Probar el proyecto desde GitHub

```bash
git clone https://github.com/luisdionicio-lgtm/E-commerce-Ferreteria.git
cd E-commerce-Ferreteria
npm ci
npm run dev
```

Tienda: http://localhost:5173 · Crear cuenta: http://localhost:5173/registro · Ingreso de cliente: http://localhost:5173/ingresar · Personal: http://localhost:5173/login.

Una cuenta registrada públicamente recibe siempre el rol `CUSTOMER`. Los roles `ADMIN` y `EMPLOYEE` acceden al panel con permisos validados en la API. Las contraseñas se cifran con bcrypt; la sesión utiliza JWT corto y refresh en cookie HttpOnly.

Consulta la [prueba manual paso a paso](docs/PRUEBA_MANUAL.md). Ejecuta `npm test` y `npm run build` para comprobar API, registro, sesiones, permisos, inventario y compilación. GitHub Actions ejecuta ambas verificaciones al subir cambios.

El demo usa almacenamiento JSON persistente para probarlo sin servicios externos. El esquema relacional MySQL, sus relaciones y las instrucciones de Prisma se incluyen más abajo. `backend/data/`, sesiones locales, secretos y `node_modules/` no se publican; el seed recrea los datos de muestra.

Verificación de la adaptación: 10 pruebas API/dominio/CRUD, 1 integración real MySQL en base aislada y 6 recorridos Playwright, incluyendo las 36 referencias adicionales y el carrito con las seis categorías. El comando genérico omite MySQL cuando no hay MYSQL_TEST_URL; ver [cómo repetir las pruebas](docs/PRUEBA_MANUAL.md). El despliegue en nube se pospuso por decisión del estudiante.

![Tienda Next.js, captura local](docs/previews/07-next-tienda.png)

Tienda web y sistema de gestión para una ferretería. Next.js sirve las páginas por archivos y reenvía `/api` a Express. Los repositorios intercambiables JSON/MySQL mantienen la misma lógica de dominio. Interfaz en español, fotografías referenciales, diseño adaptable y formularios conectados a la API.

## Abrir en Visual Studio Code

1. Extrae el ZIP completo. Abre la carpeta `ferremax` que contiene este README y el `package.json` principal.
2. Instala **Node.js 22.12 o superior**, npm y VS Code. También puedes usar Node 24 LTS.
3. Abre la terminal integrada en esa carpeta.

**Windows / PowerShell**

```powershell
npm.cmd ci
npm.cmd run dev
```

Usar `npm.cmd` evita el bloqueo de scripts de PowerShell. Puedes ejecutar ` .\start-windows.bat` como alternativa; instala dependencias si es necesario.

**macOS / Linux**

```bash
npm ci
npm run dev
```

Alternativa: `bash start-mac.sh`.

Abre [la tienda](http://localhost:5173) y [el panel](http://localhost:5173/login). La API se ejecuta en `http://localhost:3001`. Mantén la terminal abierta; `Ctrl+C` detiene ambos procesos. La instalación inicial requiere internet; el demo no necesita servicios externos ni MySQL.

| Rol | Correo | Contraseña inicial |
| --- | --- | --- |
| Administrador | admin@ferremax.pe | FerreMax2026! |
| Empleado | empleado@ferremax.pe | Empleado2026! |

Las contraseñas son exclusivamente para demo. Se guardan como hashes bcrypt. Puedes cambiarlas en **Usuarios → editar**. No se incluyen datos personales reales, números comerciales verificados ni ventas reales.

## Funciones implementadas

### Catálogo ampliado: seis productos más por categoría

Se incorporaron **36 imágenes de Internet y 36 fichas adicionales**, seis por categoría. El catálogo de demostración tiene 48 productos de herramientas, pinturas, electricidad, gasfitería, construcción y seguridad. Las nuevas fichas incluyen precio publicado en Promart Perú consultado el 14/11/2026, enlace de origen, búsqueda, filtro, detalle y carrito. Las existencias, costos y lotes son ficticios; las fechas de vencimiento no se deducen de una fotografía.

Consulta el [inventario de las 36 referencias y sus fuentes](docs/CATALOGO_AMPLIADO.md). Para añadirlas a una instalación MySQL existente, ejecuta `npm run db:extend-catalog`; la importación es transaccional, no duplica productos y conserva el historial. Los nuevos seeds JSON y MySQL ya las incluyen.

<details>
<summary>Ver las seis imágenes por categoría</summary>

**Herramientas**

![Seis referencias nuevas de herramientas](docs/previews/11-categoria-1.png)

**Pinturas**

![Seis referencias nuevas de pinturas](docs/previews/11-categoria-2.png)

**Electricidad**

![Seis referencias nuevas de electricidad](docs/previews/11-categoria-3.png)

**Gasfitería**

![Seis referencias nuevas de gasfitería](docs/previews/11-categoria-4.png)

**Construcción**

![Seis referencias nuevas de construcción](docs/previews/11-categoria-5.png)

**Seguridad**

![Seis referencias nuevas de seguridad](docs/previews/11-categoria-6.png)

</details>

- Tienda: portada, catálogo, categorías, búsqueda por nombre/marca/SKU, orden por precio, disponibilidad, detalle, carrito persistente y envío de pedido.
- Dashboard: ventas confirmadas, productos activos, costo de inventario, pedidos pendientes, últimos 7 días y alertas.
- Productos: crear, editar, destacar, desactivar, elegir una foto referencial y definir precio en soles. Desactivar conserva el historial. El stock se añade con compras recibidas, no al crear un producto.
- Categorías, proveedores, clientes y usuarios: alta, edición, desactivación y búsqueda.
- Inventario: existencias totales y vendibles, lotes, movimientos y ajustes con responsable y motivo.
- Compras: una o varias líneas, proveedor, cantidad, costo y vencimiento opcional; recibir una sola vez genera lotes y entradas.
- Ventas: una o varias líneas, cliente opcional y medio de pago manual; precios recalculados en servidor; descuento de lotes FEFO (primero vence, primero sale). Anulación devuelve las unidades a los lotes originales.
- Pedidos web: detalle, confirmación como venta y anulación. Carrito/pedido pendiente no descuentan ni reservan stock. Al confirmar se valida el stock nuevamente y se aplican los precios vigentes.
- Vencimientos: lotes vencidos o que vencen en 60 días. Los vencidos se excluyen de las ventas.
- Renovaciones: fecha, responsable, notas y estado pendiente/completado.
- Reportes: rango de fechas, ingresos, ticket promedio, productos más vendidos y CSV; tablas con paginación.
- Configuración: datos visibles en tienda y auditoría administrativa del catálogo y ajustes.
- Login: JWT de 15 minutos, refresh de 7 días en cookie HttpOnly, rotación, cierre de sesión y permisos revisados en backend.

### Permisos

Administrador: todos los módulos. Empleado: leer catálogo y contactos, registrar compras y recibirlas, vender, gestionar pedidos, ajustar inventario, consultar vencimientos, renovaciones y reportes. Solo administrador modifica catálogo/contactos/renovaciones, gestiona usuarios/configuración y anula ventas.

### Probar un recorrido completo

1. Entra como administrador y abre **Productos**. Crea un producto (su stock inicial será cero).
2. En **Compras**, registra proveedor, producto, cantidad, costo y fecha opcional. Usa **Recibir**; comprueba el nuevo lote en **Inventario**.
3. En **Ventas**, registra el producto y revisa cómo disminuye el stock.
4. Anula esa venta; se crea una devolución y se restaura el lote.
5. Abre la tienda, agrega un producto al carrito y envía un pedido con nombre/celular ficticios.
6. En **Pedidos web**, revisa y confirma el pedido para crear la venta; revisa dashboard y reportes.

## Dónde se guardan los datos de demo

El primer inicio crea `backend/data/store.json` con 48 productos (12 originales y 36 referencias adicionales), 6 categorías, 3 proveedores, lotes, compras, usuarios y 7 ventas ficticias coherentes con sus movimientos. Los productos originales de pintura y sellador incluyen fechas de vencimiento de muestra para demostrar las alertas; las nuevas referencias no inventan fechas de lote. Los cambios se conservan al reiniciar. Haz copia de seguridad antes de borrar el archivo; borrarlo genera otra demo en el próximo inicio. Cambiar variables de contraseña no modifica usuarios existentes.

El driver JSON serializa transacciones dentro de **un único proceso** y escribe a un archivo temporal antes de reemplazar el archivo anterior. Está pensado para uso local, no para varios servidores.

## Activar MySQL con Prisma

No se requiere MySQL para el modo demo. Para usar la base relacional:

1. Instala Docker Desktop e inicia el servicio.
2. En la raíz del proyecto:

```bash
docker compose up -d
```

Si 3306 ya está ocupado, en PowerShell usa `$env:MYSQL_PORT='3307'` antes de `docker compose up -d --wait` y cambia el puerto de `DATABASE_URL` a `3307`. El contenedor publica MySQL únicamente en localhost.

3. Copia `backend/.env.example` como `backend/.env`.
4. En ese archivo configura:

```dotenv
DATA_DRIVER=mysql
DATABASE_URL="mysql://ferremax:ferremax_local@localhost:3306/ferremax"
JWT_SECRET=REEMPLAZAR_CON_UN_SECRETO_ALEATORIO_DE_64_CARACTERES
FRONTEND_URL=http://localhost:5173
```

Genera un secreto con `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` y pega el resultado. No compartas `.env`.

5. Cuando MySQL esté saludable (`docker compose ps`), ejecuta:

```bash
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

En Windows puedes usar `npm.cmd`. `db:seed` solo admite una base sin usuarios y **no sobrescribe datos**. El demo JSON no se migra automáticamente a MySQL. `db:push` es apropiado para esta instalación local; para un despliegue utiliza migraciones versionadas (`prisma migrate dev` en desarrollo, `prisma migrate deploy` en producción).

Prisma emplea transacciones serializables y reintenta conflictos; claves foráneas preservan relaciones. Los importes se almacenan como enteros en céntimos para evitar errores de punto flotante. Las fechas de vencimiento se guardan como `YYYY-MM-DD`; instantes de operaciones, como ISO UTC.

## Comandos

```bash
npm run dev        # API + frontend
npm run build      # compilación TypeScript y bundle de frontend
npm test           # reglas de inventario y API
npm run db:generate
npm run db:push
npm run db:seed
```

## Organización

```text
ferremax/
  frontend/
    public/images/       # recursos gráficos y fotos referenciales locales
    src/
      pages/             # rutas de Next.js
      state/             # contexto, carrito y sesión
      components/        # tablas, formularios, modal accesible
      features/          # store, auth, dashboard, admin, inventory,
                         # operations, reports, settings
      layouts/           # tienda y administración
      services/api.ts    # cliente HTTP y renovación de sesión
      styles/global.css  # sistema visual y responsive
  backend/
    prisma/              # esquema MySQL y seed
    src/
      config/            # entorno, seed, repositorios JSON/Prisma
      middlewares/       # autenticación, rol y origen
      modules/           # catálogo, inventario, operaciones, auth,
                         # dashboard, rutas y validaciones admin
      shared/            # errores e interfaces
      app.ts
      server.ts
    tests/               # API, transacciones y stock
  docs/                  # arquitectura, API, datos y diseño
  scripts/start.mjs
  docker-compose.yml
  start-windows.bat
  start-mac.sh
```

## Diseño

### Galerías y precios de referencia publicados

Las seis categorías tienen productos con varias vistas: herramientas, pinturas, electricidad, gasfitería, construcción y seguridad. La ampliación incorpora 15 imágenes de Internet para Stanley, Bosch, Indeco, Vainsa, Pavco y Steelpro, con enlaces de origen en las fichas. Se verificaron las miniaturas y la carga de imágenes en móvil.

![Galería del set Stanley con vista de sus dados](docs/previews/09-galerias-productos.png)

Se añadieron otras ocho imágenes de envases, ambientes y aplicaciones de Vencedor, Sika, Sol y Bosch. Las galerías ampliadas se comprobaron en móvil, incluyendo la selección de cada miniatura y la carga de su imagen.

![Galería Bosch con fotografías de aplicación publicadas por Promart](docs/previews/10-mas-vistas-productos.png)

Se añadieron nueve vistas de producto, características y aplicación procedentes de Promart Perú. Las fichas de pintura Vencedor, sellador Sikacryl-200 y cemento Sol muestran el enlace a la fuente y la fecha de consulta (14/11/2026).

| Producto | Precio publicado consultado |
| --- | --- |
| Vencedor Supersatinado blanco, 1 galón | S/ 105,00 |
| Sikacryl-200, 300 ml | S/ 35,50 |
| Cemento Sol Tipo I, 42,5 kg | S/ 30,90 |

Los precios pueden variar por ubicación y promoción; no incluyen envío. Los demás importes continúan siendo referenciales. Las fuentes y URLs de imágenes están en [Imágenes y precios de referencia](docs/IMAGENES_REFERENCIA.md).

![Pintura Vencedor, imagen de catálogo de Promart](frontend/public/images/reference/paint-vencedor-promart-1.jpg)

Componentes comunes, jerarquía tipográfica, acentos naranja, superficies cálidas y grafito; estados de carga/error/vacío; modales con foco, Escape y retorno al control anterior; navegación móvil y respeto por `prefers-reduced-motion`. Las fotografías se almacenan localmente para que el demo no dependa de hotlinks. Sus fuentes se detallan en [`docs/IMAGENES_REFERENCIA.md`](docs/IMAGENES_REFERENCIA.md); reemplázalas por fotografías autorizadas antes de publicar.

Se aplicaron [emil-design-eng](https://github.com/emilkowalski/skills), `frontend-design` e [Impeccable](https://github.com/pbakaus/impeccable) para las decisiones de movimiento, jerarquía y calidad visual. Las skills quedan instaladas globalmente en Codex; su contenido no se redistribuye con FerreMax. El registro completo está en [`docs/SKILLS_UTILIZADAS.md`](docs/SKILLS_UTILIZADAS.md). Google Fonts se carga si hay internet; sin conexión se usa Arial.

## Alcance de esta entrega

Es una **primera versión funcional local**, con frontend y backend reales y datos ficticios. No incluye pasarela de pago, subida de archivos, correo/SMS/WhatsApp automático, SUNAT, múltiples sucursales, reservas de stock, pruebas de carga, integración contable ni despliegue. Registrar Yape/tarjeta solo almacena el medio elegido; no valida el pago. No expone ni inventa una conexión con Figma.

Antes de publicar: configura MySQL, HTTPS, secretos, respaldos y cuentas propias; retira las credenciales demo visibles del login; agrega tus datos comerciales, fotografías, políticas y procesos de pago/comprobantes. `NODE_ENV=production` exige MySQL, un secreto fuerte y `FRONTEND_URL` HTTPS. `npm start` inicia Express; `npm run start:web` inicia Next. Son servicios separados y Next reenvía `/api` al backend configurado en `API_ORIGIN`. En nube utiliza `npm run db:migrate` para aplicar las migraciones versionadas; la guía de despliegue explica bases vacías y bases existentes.

## Solución rápida de problemas

- `npm no se reconoce`: instala Node.js y vuelve a abrir VS Code.
- PowerShell bloquea `npm.ps1`: usa `npm.cmd`.
- `start-windows.bat no reconocido`: ejecuta ` .\start-windows.bat` dentro de la carpeta extraída.
- Puertos ocupados: usa puertos libres para 3001/5173. Si cambias el puerto API, configura `API_ORIGIN` en `frontend/.env.local` y reinicia Next. No cierres procesos ajenos al proyecto.
- Vista con error de conexión: comprueba la terminal del backend y `/api/health`.
- Contraseña demo no coincide: si cambiaste usuarios, usa la nueva contraseña; no se restablecen al reiniciar.
- MySQL falla: revisa Docker, la URL y el secreto; ejecuta `db:generate` después de cambios en el esquema.

## Capturas incluidas

En `docs/previews` encontrarás capturas reales de tienda, dashboard, productos, catálogo y vistas móviles. La verificación se resume en `docs/VERIFICACION.md`.
