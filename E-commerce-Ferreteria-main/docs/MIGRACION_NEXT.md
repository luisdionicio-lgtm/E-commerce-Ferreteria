# Migración académica a Next.js y Express

Fecha: 14 de noviembre de 2026. Referencia: requisitos de Semana 16 de Desarrollo Web Avanzado, profesor Arévalo, proporcionados por el estudiante.

## Hito 1: frontend Next.js

Se sustituyó Vite y React Router por Next.js 16 con Pages Router: las páginas reales residen en `frontend/src/pages`. La elección conserva los componentes existentes y permite explicar claramente el enrutamiento por archivos, el HTML prerenderizado y la hidratación. No se presenta como App Router ni como una migración a React Server Components.

Next.js sirve el frontend y reenvía `/api/*` a Express mediante `rewrites`. `API_ORIGIN` es una variable solo de servidor. Express conserva validaciones, JWT/cookies, roles, reglas de inventario, pedidos y el repositorio MySQL/Prisma o JSON local. No se duplicó la lógica comercial en rutas API de Next.

El carrito se restaura desde localStorage después del primer render para evitar acceso a APIs del navegador durante prerenderizado. La sesión se recupera con cookie HttpOnly. Las pantallas administrativas verifican el rol en frontend y todas sus APIs lo verifican también en Express.

La API de producción ya no sirve `frontend/dist`, que correspondía a Vite. Cada servicio tiene su proceso de producción propio. `npm start` arranca Express; `npm run start:web` arranca Next.

Se añadió una migración inicial versionada en `backend/prisma/migrations`. Para bases vacías se aplica con `npm run db:migrate`; una base creada anteriormente con `db:push` requiere establecer una línea base antes, sin borrar sus datos. Ver guía de despliegue.

## Evidencia inicial

## Hito 2: compatibilidad, galería y pruebas

Se movió el estado a `src/state` porque el nombre `src/app` activaba la detección de App Router y alteraba la página 404. Las consultas de filtro se leen tras `router.isReady` para que servidor y primer render del cliente coincidan. Se excluyen validadores de `.next/dev` de la compilación de producción, evitando identificadores duplicados entre salidas dev y build.

La galería de producto incorpora dos recursos oficiales adicionales de Bosch, además de las fotografías existentes. Se amplían las pruebas a cuatro recorridos de navegador y a CRUD administrativo e integración MySQL real. La prueba de pedido espera la respuesta de autenticación antes de verificar la navegación; los tiempos permiten arranque en frío de Next y DB.

`npm run build`: backend TypeScript y frontend Next compilan; se generan las rutas de tienda, autenticación y administración. Las pruebas posteriores y el estado del despliegue se registran en `VERIFICACION.md`.
