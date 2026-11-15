# Despliegue: Next.js + Express + MySQL

El estudiante decidió posponer el despliegue en nube el 14 de noviembre de 2026. Esta etapa se limita a la versión funcional local, pruebas, documentación y repositorio. No se han creado recursos públicos.

## Estado y URLs

| Servicio | Estado de esta entrega | URL |
| --- | --- | --- |
| Frontend Next.js local | Verificar con `npm run dev` | http://localhost:5173 |
| API Express local | Verificar `/api/health` | http://localhost:3001/api/health |
| Frontend público | Pendiente de vincular cuenta de hosting | No asignada |
| API pública | Pendiente de vincular cuenta de hosting | No asignada |
| MySQL en nube | Pendiente de provisionar credenciales | No registrar la URL privada en Git |

Una configuración lista para desplegar no equivale a una aplicación ya desplegada. El criterio de nube del curso solo se cierra después de comprobar las URLs públicas con base persistente.

## Opción propuesta

Frontend en Vercel, API en Render y MySQL administrado accesible desde la API, por ejemplo Railway. Se pueden usar otros proveedores Node.js/MySQL. No se exige contratar servicios ni se asume disponibilidad gratuita: revisar las condiciones de la cuenta antes de crear recursos.

### 1. Base de datos vacía

Crear MySQL y obtener su cadena pública con usuario, contraseña, puerto y base. Usar la conexión externa al migrar desde el equipo o desde otro proveedor; una dirección privada de Railway no es accesible desde Render. Respetar la configuración TLS que indique el proveedor.

Configurar temporalmente `DATABASE_URL` en el entorno de la terminal (o en `backend/.env`, ignorado por Git) y ejecutar:

```bash
npm ci
npm run db:migrate
```

`db:migrate` usa `prisma migrate deploy` y la migración versionada, no `db:push`. Para una instalación demo nueva, establecer `DEMO_ADMIN_PASSWORD` y `DEMO_EMPLOYEE_PASSWORD` propias y ejecutar una sola vez `npm run db:seed`. El seed rechaza bases que ya tengan usuarios.

**Bases anteriores creadas con db:push:** no ejecutar reset ni borrar datos. Comparar su esquema con `backend/prisma/schema.prisma`; si es idéntico al inicial, marcar la migración `20261114000000_initial` como aplicada con `prisma migrate resolve --applied 20261114000000_initial` desde backend. Si hay diferencias, resolverlas con una migración revisada. No usar ese comando como atajo para ocultar diferencias.

### 2. API Express en Render

Conectar el repositorio `luisdionicio-lgtm/E-commerce-Ferreteria`. Puede importarse `render.yaml` como Blueprint o crear un Web Service Node manual:

- Directorio de trabajo: raíz del repositorio.
- Build: `npm ci --include=dev && npm run build -w backend`.
- Start: `npm run start -w backend`.
- Health check: `/api/health`.
- Variables: `NODE_ENV=production`, `DATA_DRIVER=mysql`, `DATABASE_URL`, `JWT_SECRET` aleatorio de al menos 32 caracteres, `FRONTEND_URL=https://TU-FRONTEND`, `TRUST_PROXY=1`.
- `PORT` lo proporciona Render. No fijar un puerto distinto al del servicio.

La migración se ejecuta de forma explícita antes de probar el servicio; no se presupone acceso a hooks de pago o shell remota en un plan gratuito. El blueprint no crea una base MySQL y sus valores marcados `sync: false` deben introducirse en la plataforma.

Comprobar que `https://TU-API/api/health` devuelve `ok: true`, `driver: mysql`, `mode: production`. La API falla al iniciar si falta el secreto, si se configura JSON en producción o si FRONTEND_URL no usa HTTPS.

### 3. Frontend Next.js en Vercel

- Importar el mismo repositorio.
- Framework: Next.js. Root Directory: `frontend`.
- Activar inclusión de archivos fuera del Root Directory al compilar: los workspaces y `tokens.css` pertenecen a la raíz del monorepo.
- Install: usar la instalación del monorepo con su lockfile. Build: `npm run build` dentro de frontend. No configurar `dist` como output.
- Variable de servidor: `API_ORIGIN=https://TU-API` sin `/api` al final. Añadirla en Production y Preview según corresponda.
- Desplegar de nuevo después de cambiar API_ORIGIN: las reglas `rewrites` se construyen con ese valor.
- Copiar la URL final a `FRONTEND_URL` de Express y volver a desplegar la API.

El navegador consume `/api` del dominio del frontend; Next reenvía a Express. No configurar `NEXT_PUBLIC_DATABASE_URL`, `NEXT_PUBLIC_JWT_SECRET` ni guardar tokens en localStorage. La cookie de refresh es HttpOnly, Secure en producción y con ruta `/api/auth`.

### 4. Cierre de la verificación en nube

1. Abrir la portada y una ficha por URL directa; recargar sin 404.
2. Crear cuenta ficticia y verificar login, recarga de sesión y logout.
3. Filtrar catálogo, cambiar vistas de la galería, usar carrito y enviar pedido.
4. Ingresar como personal, confirmar y anular una venta de prueba; comprobar stock.
5. Intentar acceso admin con un cliente; debe denegarse.
6. Reiniciar la API y comprobar persistencia en MySQL.
7. Comprobar que cookie y API funcionan bajo HTTPS y que no hay errores de consola.
8. Sustituir los estados pendientes de la tabla por URLs reales y registrar fecha/evidencia.

## Desarrollo local y producción local

`npm run dev` inicia Express + Next en modo desarrollo y conserva la alternativa JSON. Para probar producción Next local, ejecutar `npm run build`, iniciar la API de desarrollo en una terminal y `npm run start:web` en otra. No activar NODE_ENV=production en Express con JSON, porque está bloqueado deliberadamente.

Referencias: [Next deployment](https://nextjs.org/docs/pages/getting-started/deploying), [Render Node/Express](https://render.com/docs/deploy-node-express-app), [Vercel monorepos](https://vercel.com/docs/monorepos), [Prisma baselining](https://www.prisma.io/docs/orm/prisma-migrate/workflows/baselining).
