# API Contract Actual (Frontend → API)

Este documento define el contrato mínimo que el frontend (React en `frontend/`) consume hoy.

## Base URL de la API

- El frontend usa `VITE_API_URL` (ver `frontend/.env.example`).
- Si no está configurada, usa `http://localhost:3000`.

## Endpoints usados hoy

### `POST /users/login`

Usado en `frontend/src/pages/Login.tsx`.

### Request (JSON)

- `email`: string (obligatorio)
- `password`: string (obligatorio)

### Response (éxito)

- HTTP `200`
- Cuerpo JSON:
  - `ok: true`
  - `user`: `{ id, name, email, role }`

### Errores

- HTTP `400` si faltan datos
  - `{ error: string }`
- HTTP `401` si credenciales inválidas
  - `{ error: string }`

### Ubicación de la API legacy

- El backend que implementa este endpoint está en `__old/backend/` (Express).
