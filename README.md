# TecnoStore Admin con Next.js y MongoDB

Base full-stack con React y Next.js para una tienda de accesorios, ventas y reparacion de telefonos.

## Stack

- Frontend con React usando App Router.
- Backend con rutas API de Next.js.
- MongoDB como base de datos persistente.
- Despliegue completo en Vercel usando un solo proyecto.

## Estructura

- `app/page.js`: entrada principal del dashboard.
- `components/dashboard-app.js`: interfaz React del panel.
- `app/api/*`: endpoints internos para productos, ventas y reparaciones.
- `lib/store.js`: acceso a MongoDB, seed inicial y operaciones CRUD.

## Endpoints disponibles

- `GET /api/products`
- `POST /api/products`
- `GET /api/sales`
- `POST /api/sales`
- `GET /api/repairs`
- `POST /api/repairs`
- `PATCH /api/repairs/:id`
- `POST /api/auth/register` (registro de tienda con pago simulado)
- `GET /api/auth/stores` (admin)
- `PATCH /api/auth/stores` (autorizar tienda desde admin)

## Variables de entorno

Crea un archivo `.env.local` con:

```bash
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DB=tecnostore
```

La app espera una base de datos Mongo local en `localhost:27017`.

## Instalar MongoDB local en Windows

1. Descarga MongoDB Community Server desde https://www.mongodb.com/try/download/community
2. Instala MongoDB y, durante la instalación, activa la opción de servicio si quieres que arranque automáticamente.
3. Si no instalas el servicio, puedes iniciar el servidor con:

```powershell
"C:\Program Files\MongoDB\Server\<version>\bin\mongod.exe"
```

4. Opcionalmente, usa Docker si prefieres no instalarlo directamente:

```powershell
docker run -d -p 27017:27017 --name tecnostore-mongo mongo:7.0
```

## Como correrlo

Asegúrate de que MongoDB esté corriendo localmente antes de iniciar la app.

Desde la carpeta del proyecto:

```bash
npm install
npm run dev
```

Luego abre `http://localhost:3000`.

## Despliegue en Vercel

Si, se puede desplegar todo en Vercel:

1. Sube este proyecto a GitHub.
2. Importa el repositorio en Vercel.
3. Agrega `MONGODB_URI` y `MONGODB_DB` en la configuracion del proyecto.
4. Haz el deploy.

El frontend React y el backend de Next.js viven en la misma app, asi que Vercel despliega ambos juntos.

## Notas

- La primera vez que la app arranca, crea datos base de productos, ventas y reparaciones si la base esta vacia.
- Las ventas descuentan stock automaticamente.
- El estado de reparaciones avanza entre `recibida`, `revision`, `lista` y `entregada`.

## Siguiente paso recomendado

Agregar autenticacion para proteger el panel de administracion antes de publicarlo en produccion.
