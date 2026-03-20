# BodegaFlow POS — Funcionalidades (Legacy / Depreciado)

Este documento describe el alcance implementado en `__old/` (POS con HTML/CSS/JS) y la API Express legacy.

**Documentación relacionada:** Para requisitos, flujos y roles, ver [`requerimientos.md`](requerimientos.md).

---

## 1. Autenticación y usuarios

### Backend (API)

- **Registro de usuarios** — `POST /users/register`: nombre, email, contraseña, rol (por defecto `user`). Contraseñas hasheadas con bcryptjs.
- **Login** — `POST /users/login`: devuelve usuario sin contraseña (sin JWT/token; sesión por cliente).
- **Listar usuarios** — `GET /users`: solo si el header `x-admin: true` (mecanismo simple para demo).

### Frontend (Legacy HTML/JS)

- **Login** — Formulario que valida y redirige; `auth.js` usa `localStorage` y usuarios locales, no llama a la API de login del backend.
- **Registro** — Formulario de alta; también guarda en `localStorage`, no en API.
- **Protección de rutas** — Función `requireLogin()` y `logout()` en `auth.js` (basadas en sesión en `localStorage`).

**Nota:** En el legacy, la autenticación del frontend está desacoplada del backend (localStorage vs API); el backend sí tiene registro/login con SQLite.

---

## 2. Productos e inventario

### Backend

- **Listar productos** — `GET /products`: todos, ordenados por id descendente.
- **Crear producto** — `POST /products`: name, category, price, stock.
- **Editar producto** — `PUT /products/:id`: actualiza name, category, price, stock.
- **Ajustar stock** — `PATCH /products/stock/:id`: body `{ stock }` (valor fijo), `{ adjust }` o `{ amount }` (incremento/decremento).
- **Eliminar producto** — `DELETE /products/:id`.

### Frontend (Inventario)

- Listado de productos con búsqueda por nombre o categoría.
- Modal **Nuevo producto** y **Editar producto** (nombre, categoría, precio, stock).
- Modal **Ajustar stock** (incremento/decremento vía `amount`).
- Todas las acciones consumen la API de productos.

---

## 3. Punto de venta (POS)

### Backend

- Las ventas se registran en `POST /sales` (ver sección Ventas).
- El POS usa `GET /products` para cargar productos.

### Frontend (POS)

- **Listado de productos** con búsqueda por nombre.
- **Carrito de venta**: agregar producto, cantidad acumulada, total en tiempo real.
- **Indicador de stock**: badge "Falta X" cuando la cantidad en el carrito supera el stock disponible; fila en estilo "low-stock".
- **Métodos de pago**: Efectivo, Pago móvil, Mixto (selección antes de cobrar).
- **Modal Pago móvil**: al elegir "Pago móvil", se abre modal para banco, referencia y monto; se registra el pago en `/pagomovil` y luego se vincula a la venta con `pagomovilId`.
- **Registrar venta**: envía `productos` (array `{ id, qty }`), `metodo`, `total`; el backend valida stock, descuenta en transacción y crea la venta (y opcionalmente vincula pago móvil).
- **Manejo de errores**: modal de error para mensajes del backend (ej. stock insuficiente).
- **Post-venta**: vacía carrito, actualiza listado de productos.

---

## 4. Ventas

### Backend

- **Listar ventas** — `GET /sales`: todas, con `productos` parseado desde JSON.
- **Registrar venta** — `POST /sales`:
  - Acepta `productos` como string (solo se guarda, no se modifica stock) o como array `[{ id, qty }]` (valida stock, descuenta en transacción, guarda venta).
  - Acepta `metodo`, `total`, `fecha`.
  - Si viene objeto `pago` (pago móvil), lo inserta en `pagomovil` y asocia `sale_id`.
  - Si viene `pagomovilId`, actualiza ese registro de pago móvil con `sale_id` de la venta recién creada.

### Frontend (Historial de ventas)

- **Resumen**: ventas del día, ventas del mes, total de transacciones (calculados en cliente).
- **Filtros**: por fecha y por texto (producto o método de pago).
- **Tabla**: fecha, productos (resueltos por nombre desde API de productos), método, total.
- Datos cargados desde `GET /sales` y mapa de productos desde `GET /products`.

---

## 5. Pago móvil

### Backend

- **Listar pagos** — `GET /pagomovil`: todos, ordenados por id descendente.
- **Registrar pago** — `POST /pagomovil`: fecha, banco, referencia, monto, cliente.
- Tabla `pagomovil` con columna opcional `sale_id` para vincular con una venta.

### Frontend (Página Pago móvil)

- **Listado y filtros**: por referencia/banco y por fecha.
- **Importante:** la página `pagomovil.html` usa un array simulado; **no** llama a `GET /pagomovil`. El registro de pagos sí se hace desde el POS.

---

## 6. Deudas (clientes y productos adeudados)

### Backend

- Persistencia en archivo JSON (`__old/backend/data/deudas.json`) vía `deudas_store.js`.
- **Listar clientes** — `GET /deudas`.
- **Agregar cliente** — `POST /deudas`: body `{ id, name }` (y opcionalmente más campos).
- **Actualizar cliente** — `PUT /deudas/:id`: body con campos a actualizar.
- **Eliminar cliente** — `DELETE /deudas/:id`.
- **Agregar producto a cliente** — `POST /deudas/:id/products`: body `{ name }` (y opcionalmente amount u otros).
- **Quitar producto** — `DELETE /deudas/:id/products/:index`.

### Frontend (Deudas)

- **Lista de clientes** con nombre, teléfono y total adeudado (suma de montos de productos); total > 20000 Bs resaltado en rojo.
- **Alta de cliente**: formulario nombre + teléfono.
- **Detalle de cliente**: ver/editar nombre y teléfono; listado de "productos adeudados" (nombre + monto) con total.
- **Agregar producto** al cliente seleccionado (nombre + monto).
- **Eliminar** cliente o producto de la deuda.
- **Dual fuente de datos**: si la API `/deudas` está disponible, usa backend; si no, usa `localStorage` (misma estructura).

---

## 7. Infraestructura y datos

### Backend (legacy)

- **Express** + **CORS** + **JSON** (ubicado en `__old/backend/`).
- **SQLite** (`__old/backend/database.sqlite`): tablas `productos`, `ventas`, `usuarios`, `pagomovil` (con `sale_id` opcional).
- Inicialización de tablas en `database.js`; transacciones para ventas con descuento de stock.
- **Puerto**: 3000 (o `process.env.PORT`).

### Frontend (legacy)

- Páginas estáticas en `__old/html/`: `index.html`, `pos.html`, `inventory.html`, `ventas.html`, `pagomovil.html`, `deudas.html`, `login.html`, `register.html`.
- Estilos en `__old/css/`: `global.css`, `auth.css`, `inventory.css`, `pos-bodega.css`, `deudas.css`.
- Scripts en `__old/js/`: `pos-bodega.js`, `inventory.js`, `auth.js`, `deudas.js`; ventas y pago móvil con script inline en el HTML.
- API base configurada como `http://localhost:3000` en los scripts.

