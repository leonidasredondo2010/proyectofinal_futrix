# Futrix

Tienda de guantes de fútbol con React, Vite, una API Express y MongoDB local.

## Requisitos

- Node.js compatible con Vite 8.
- MongoDB Community Server instalado y ejecutándose en `127.0.0.1:27017`.
- MongoDB Compass es opcional; sirve para explorar los datos, no reemplaza el servidor MongoDB.

## Iniciar en desarrollo

1. Instala MongoDB Community Server y arranca el servicio local.
2. Copia `.env.example` a `.env` si necesitas cambiar la URI o el puerto de la API. El valor predeterminado conecta con `mongodb://127.0.0.1:27017/futrix`.
3. En esta carpeta, ejecuta:

```sh
npm install
npm run dev
```

El comando inicia el servidor React/Vite en `http://localhost:5173` y la API en `http://127.0.0.1:3001`. Vite reenvía `/api` a la API. Si MongoDB aún no está activo, la web se inicia, pero la API informa el error y los envíos no se guardan.

En Compass, conecta a `mongodb://127.0.0.1:27017`. La base `futrix` y sus colecciones se crean al guardar el primer pedido o mensaje.
Para comprar, el cliente debe iniciar sesión, agregar guantes al carrito y completar sus datos de contacto. La API también valida la sesión antes de guardar cada pedido, que queda asociado a la cuenta; después se abre WhatsApp para confirmar el envío.
Los visitantes también pueden crear una cuenta e iniciar sesión desde el encabezado. Los datos se guardan en la colección `users`; las contraseñas se almacenan cifradas con scrypt y las sesiones se gestionan desde la colección `sessions`.

## Despliegue público en Render

El archivo `render.yaml` configura un servicio web de Render para compilar el frontend y servirlo junto con la API Express. Antes de desplegar:

1. Crea una base de datos en MongoDB Atlas y copia su URI de conexión.
2. En Render, crea un Blueprint desde este repositorio y confirma la carpeta raíz `Proyecto final`.
3. Ingresa `MONGODB_URI`, `ADMIN_USERNAME`, `ADMIN_PASSWORD` y `ADMIN_TOKEN` como variables secretas del servicio. Usa credenciales seguras y no las guardes en GitHub.
4. Render compilará con `npm install && npm run build` e iniciará el servicio con `npm start`.

Render asigna el puerto del servicio automáticamente. La API escucha en todas las interfaces y el panel administrativo no acepta las credenciales de desarrollo cuando `NODE_ENV=production`.

## Producción local

```sh
npm run build
npm start
```

Express sirve el build y la API desde el puerto `3001` (o desde el puerto configurado en `.env`). Para una publicación pública hace falta un servidor accesible desde internet; la base de datos configurada aquí escucha solo en la computadora local.

## Estructura

- `frontend/`: aplicación React y archivos públicos.
  - `frontend/src/components/`: catálogo, carrito y visor de fotos.
  - `frontend/src/components/chatbot/`: asistente de la tienda.
  - `frontend/src/components/admin/`: panel administrativo.
  - `frontend/src/services/`: solicitudes desde React a la API.
  - `frontend/public/imagenes-guantes/`: fotos del catálogo.
- `backend/`: servidor Express y API.
  - `backend/src/routes/`: endpoints de pedidos, contactos y administración.
  - `backend/src/database/connection.js`: conexión con MongoDB.
  - `backend/src/database/models/`: esquemas de pedidos, contactos, usuarios y sesiones.
- `shared/catalog.js`: catálogo y precios usados tanto por el frontend como por el backend.
- `dist/`: archivos generados por `npm run build`; no se editan manualmente.

El catálogo se puede abrir directamente con una talla, por ejemplo `/?talla=5#catalogo`.
Los pedidos y formularios se guardan en MongoDB antes de abrir WhatsApp.
