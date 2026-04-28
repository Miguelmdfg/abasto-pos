# Abasto POS (Bodega-Flow)

Sistema de punto de venta y gestión para bodegas/comercios pequeños. Permite ventas (POS), control de inventario, deudas (fiado), cierres de caja, costos y multimoneda Bs/USD con tasa del día.

> Estado: rama `final-code` — versión definitiva reescrita desde cero. Solo frontend operativo; sin backend ni base de datos activos (la persistencia es en `localStorage`).

## Stack

- **Frontend:** React 19 + TypeScript + Vite 6
- **UI:** [HeroUI](https://heroui.com) 3.0.0-beta.8 + Tailwind CSS 4
- **Routing:** react-router-dom 7
- **Estado:** Context API de React (sin Redux/Zustand)
- **Persistencia:** `localStorage` del navegador
- **Backend:** ninguno activo (existe un Express legacy en `__old/backend/` solo como referencia histórica)

## Estructura

```
abasto-pos/
├── README.md                  # este archivo
├── docs/                      # documentación del proyecto (ver docs/README abajo)
├── frontend/                  # aplicación React (única app activa)
│   └── src/
│       ├── pages/             # páginas/rutas (Pos, Inventory, Debts, …)
│       ├── components/        # AppLayout, AppHeader, AppSidebar, icons
│       ├── lib/               # contextos React + utilidades (auth, exchange-rate, …)
│       └── mocks/             # datos demo (productos, ventas, dashboard)
└── __old/                     # código legacy (HTML/CSS/JS + Express). NO usar.
```

## Requisitos

- Node.js 18+ y npm

## Ejecución local

```bash
cd frontend
npm install
npm run dev
```

Vite levanta el dev server (por defecto en `http://localhost:5173`).

### Otros scripts

```bash
npm run build      # compila TypeScript y genera build de producción
npm run preview    # sirve el build de producción
npm run lint       # ESLint
```

## Usuarios de prueba

El login usa usuarios hardcodeados (no hay backend de auth real). Los roles disponibles son `dueno` y `cajero`. Ver [frontend/src/pages/Login.tsx](frontend/src/pages/Login.tsx) para credenciales actuales.

### Permisos por rol

| Rol      | Rutas accesibles                                                                                       |
|----------|--------------------------------------------------------------------------------------------------------|
| `dueno`  | `/`, `/pos`, `/sales-history`, `/cash-closures`, `/inventory`, `/debts`, `/costs`, `/settings`         |
| `cajero` | `/pos`, `/inventory`, `/debts`                                                                         |

Definidos en [frontend/src/lib/auth.tsx](frontend/src/lib/auth.tsx).

## Documentación

| Archivo                                                                          | Contenido                                                          |
|----------------------------------------------------------------------------------|--------------------------------------------------------------------|
| [docs/00-arquitectura.md](docs/00-arquitectura.md)                               | Estructura del frontend, contextos, flujo de datos, persistencia   |
| [docs/01-estado-implementacion.md](docs/01-estado-implementacion.md)             | Tabla de módulos con % real implementado y qué falta               |
| [docs/02-relevamiento-codigo.md](docs/02-relevamiento-codigo.md)                 | Tipos, persistencia, relaciones y cálculos extraídos del código    |
| [docs/03-decisiones-modelo-datos.md](docs/03-decisiones-modelo-datos.md)         | ADRs del modelo de datos: decididas, propuestas, pendientes, v2    |
| [docs/04-scope-cliente.md](docs/04-scope-cliente.md)                             | Scope para discusión con el cliente — decisiones, propuestas, dudas|
| [docs/requerimientos.md](docs/requerimientos.md)                                 | Especificación funcional del producto                              |
| [docs/STITCH-BRIEF-VISUALES-MODULOS.md](docs/STITCH-BRIEF-VISUALES-MODULOS.md)   | Brief visual de módulos (diseño)                                   |

## Limitaciones conocidas

- **Sin backend:** todo persiste en `localStorage`; los datos se pierden al limpiar el navegador.
- **Datos demo:** productos y ventas iniciales vienen de `frontend/src/mocks/`.
- **Módulos no implementados:** Usuarios/Permisos, Proveedores, Alertas inteligentes, carga Excel de inventario, exportación PDF/Excel de reportes. Detalle en [docs/01-estado-implementacion.md](docs/01-estado-implementacion.md).
