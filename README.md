# BodegaFlow

Sistema de punto de venta (POS) y gestión para bodegas y pequeños comercios. Permite administrar ventas, inventario, deudas, usuarios y pagos móviles.

## Requisitos

- **Node.js** 16 o superior
- No se requiere instalar bases de datos externas (el backend usa SQLite)

## Estructura del proyecto

```
abasto-pos/
├── backend/          # Servidor API (Express + SQLite)
│   ├── routes/       # Rutas: productos, ventas, usuarios, pagomovil, deudas
│   ├── data/         # Datos en JSON (ej. deudas.json)
│   ├── database.sqlite
│   └── server.js
├── frontend/         # App React 19 + Vite + TypeScript + HeroUI
│   ├── src/          # Código fuente (App, páginas, estilos)
│   └── package.json
├── html/             # Páginas de la interfaz (pos, ventas, inventario, deudas, etc.)
├── css/              # Estilos (global, auth, pos, inventario, deudas)
├── js/               # Scripts del frontend
└── Imagenes/         # Recursos e imágenes
```

## Instalación y ejecución

1. **Clonar el repositorio** (si aplica):
   ```bash
   git clone <URL-del-repositorio>
   cd abasto-pos
   ```

2. **Instalar dependencias del backend:**
   ```bash
   cd backend
   npm install
   ```

3. **Frontend (React + Vite + HeroUI):**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   La app quedará en **http://localhost:5173** (o el puerto que indique Vite).

4. **Iniciar el servidor (backend):**
   ```bash
   node server.js
   ```
   El servidor quedará disponible en **http://localhost:3000**.

5. **Usar la interfaz:**  
   Abre los archivos HTML desde la carpeta `html/` en el navegador (o sirve la carpeta con un servidor estático si lo necesitas).

## API del backend

| Recurso     | Métodos y rutas | Descripción |
|------------|------------------|-------------|
| **Productos** | `GET /products`, `POST /products`, `PUT /products/:id`, `PATCH /products/stock/:id`, `DELETE /products/:id` | CRUD y ajuste de stock |
| **Ventas** | `GET /sales`, `POST /sales` | Listar y registrar ventas |
| **Usuarios** | `POST /users/register`, `POST /users/login`, `GET /users` | Registro, login y listado (admin) |
| **Pago móvil** | `GET /pagomovil`, `POST /pagomovil` | Listar y registrar pagos móviles |
| **Deudas** | Rutas en `/deudas` | Gestión de deudas de clientes |

**Notas de la API:**

- Para listar usuarios se requiere el header `x-admin: true` (mecanismo de demo).
- Las contraseñas se almacenan hasheadas con **bcryptjs**.
- El campo `ventas.productos` se guarda como cadena JSON.

## Notas

- Pensado para uso local o en red interna.
- Base de datos principal: **SQLite** (`backend/database.sqlite`). Algunos datos (por ejemplo deudas) pueden usar archivos JSON en `backend/data/`.
- Para dudas o mejoras, abre un *issue* en el repositorio o contacta al desarrollador.
