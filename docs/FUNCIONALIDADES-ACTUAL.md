# BodegaFlow POS — Funcionalidades (Actual)

Este documento describe el alcance implementado en el camino principal: `frontend/` (React + Vite + HeroUI).

## 1. Autenticación y usuarios

- **Login (React)**: `frontend/src/pages/Login.tsx` muestra un formulario y hace `POST /users/login` contra la API configurada con `VITE_API_URL` (por defecto `http://localhost:3000`).
- **Redirección**: si la API responde correctamente, navega a `/`.
- **Estado de sesión/roles**: hoy el flujo no implementa protección real por rol ni almacenamiento de token/sesión (la UI/render actual no bloquea rutas).

## 2. Dashboard

- **Página `/` (Dashboard)**: `frontend/src/pages/Dashboard.tsx` muestra KPIs y gráficas con datos mock (`frontend/src/mocks/dashboard.ts`); actualmente no consume endpoints como `/sales` o `/products`.

## 3. Contrato API usado hoy

- Mínimo necesario para el frontend actual: `POST /users/login` (ver el documento de contrato API cuando se agregue).
