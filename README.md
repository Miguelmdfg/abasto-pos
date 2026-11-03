# Abasto POS (Bodega-Flow)

Sistema de punto de venta y gestión para bodegas/comercios pequeños. Permite ventas (POS), control de inventario, deudas (fiado), cierres de caja, costos y multimoneda Bs/USD con tasa del día.

> Estado: frontend parcialmente operativo, con autenticación y flujos principales conectados a Supabase cuando se configura. El esquema remoto y las migraciones pendientes deben verificarse antes de producción. En modo Supabase los datos de negocio no deben depender de `localStorage`; tema e idioma se conservan como preferencias locales.

## Stack

- **Frontend:** React 19 + TypeScript + Vite 6
- **UI:** [HeroUI](https://heroui.com) 3.0.0-beta.8 + Tailwind CSS 4
- **Routing:** react-router-dom 7
- **Estado:** Context API de React (sin Redux/Zustand)
- **Persistencia:** Supabase para autenticación, catálogo, ventas, caja y módulos conectados; `localStorage` para preferencias de dispositivo y modo demo/desarrollo
- **Backend:** Supabase (integración parcial mediante cliente y RPC); Express en `__old/backend/` es solo referencia histórica

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

El login usa Supabase Auth cuando está configurado. Para desarrollo local se puede habilitar el modo demo con `VITE_DEMO_AUTH=true`; no usarlo en producción. Los roles disponibles son `dueno` y `cajero`.

### Permisos por rol

| Rol      | Rutas accesibles                                                                                       |
|----------|--------------------------------------------------------------------------------------------------------|
| `dueno`  | `/`, `/pos`, `/sales-history` (ventas/cierres), `/inventory` (productos/importación), `/debts`, `/costs`, `/reports`, `/settings` (general/usuarios), `/suppliers` |
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

- **Integración parcial:** crédito, BCV, importación de inventario y administración requieren migraciones/funciones remotas pendientes de despliegue. La configuración empresarial usa `app_settings`; la columna de métodos de pago requiere la migración `20261103100000_persist_payment_method_settings.sql`.
- **Tasa oficial BCV:** la consulta centralizada, el parser y la programación diaria están preparados en local; el proyecto Supabase remoto aún no los tiene desplegados. Sin una tasa remota válida, el POS bloquea ventas en modo Supabase. Ver [supabase/README.md](supabase/README.md).
- **Despliegue remoto no verificado:** la presencia de migraciones y adaptadores no confirma que el esquema esté aplicado ni que el proyecto Supabase esté operativo. Ver [supabase/README.md](supabase/README.md).
- **Sin backups automáticos en el plan actual:** Supabase Free no incluye copias programadas. Se incluye [supabase/backup.ps1](supabase/backup.ps1) para crear/verificar una copia externa en Windows; falta ejecutar el procedimiento y probar una restauración antes de migraciones de datos.
- **Datos demo:** productos y ventas iniciales vienen de `frontend/src/mocks/`.
- **Cambios de esquema pendientes:** no desplegar crédito, BCV, importación, administración ni configuración de métodos de pago hasta generar una copia restaurable y validar cada migración. Ver [supabase/README.md](supabase/README.md) y [docs/06-plan-implementacion.md](docs/06-plan-implementacion.md).
- **Reportes:** existe una página para filtrar ventas por fecha y exportar CSV; aún no incluye PDF/Excel ni sustituye reportes contables completos.
- **Costos:** la página es una calculadora en memoria; sus parámetros y precios manuales no se guardan al salir.
- **Módulos de administración preparados localmente:** directorio CRUD de proveedores, invitación/gestión de usuarios, importación Excel con previsualización, alertas de crédito y exportación CSV de ventas/cierres. Sus migraciones y Edge Functions aún no están desplegadas en Supabase. Faltan exportaciones PDF/Excel y vincular proveedores con compras. Detalle en [docs/01-estado-implementacion.md](docs/01-estado-implementacion.md) y [supabase/README.md](supabase/README.md).
