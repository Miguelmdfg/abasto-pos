# BodegaFlow Backend

Pequeño backend para BodegaFlow POS usando Express y SQLite.

Requisitos:

- Node.js 16+
- Ejecutar `npm install` en la carpeta `backend`

Instalación y ejecución:

```bash
cd backend
npm install
node server.js
```

Rutas principales:

- `/products` - GET, POST, PUT/:id, PATCH/stock/:id, DELETE/:id
- `/sales` - GET, POST
- `/users` - POST /register, POST /login, GET / (req header `x-admin` === 'true')
- `/pagomovil` - GET, POST

Notas:

- Las contraseñas se almacenan hasheadas (bcryptjs).
- `ventas.productos` se guarda como JSON string.
- Para listar usuarios, envía el header `x-admin: true` (mecanismo simple para demo).
