# 00 — Arquitectura del Frontend

> Documento técnico de referencia para entender cómo está organizado el código de `frontend/`. Complementa a [`requerimientos.md`](requerimientos.md) (qué) explicando el cómo.

## 1. Stack y dependencias

| Capa            | Tecnología                              |
|-----------------|------------------------------------------|
| Lenguaje        | TypeScript ~5.6                          |
| Framework       | React 19                                 |
| Bundler/dev     | Vite 6                                   |
| UI components   | HeroUI 3.0.0-beta.8 + `@heroui/styles`   |
| Estilos         | Tailwind CSS 4 (vía `@tailwindcss/vite`) |
| Routing         | react-router-dom 7                       |
| Estado global   | Context API de React (sin librería extra)|
| Persistencia    | `localStorage` del navegador             |
| Lint            | ESLint 9 + typescript-eslint             |

Definido en [`frontend/package.json`](../frontend/package.json).

## 2. Estructura de carpetas

```
frontend/src/
├── main.tsx          # bootstrap: aplica tema, seedea demo, monta providers
├── App.tsx           # rutas y guards de autenticación/rol
├── index.css         # estilos globales + entry de Tailwind
├── pages/            # una página por ruta
│   ├── Login.tsx
│   ├── Home.tsx          (/hello — pública)
│   ├── Dashboard.tsx     (/   — solo dueño)
│   ├── Pos.tsx           (/pos)
│   ├── Inventory.tsx     (/inventory)
│   ├── Debts.tsx         (/debts)
│   ├── SalesHistory.tsx  (/sales-history — solo dueño)
│   ├── CashClosures.tsx  (/cash-closures — solo dueño)
│   ├── Costs.tsx         (/costs — solo dueño)
│   ├── Settings.tsx      (/settings — solo dueño)
│   ├── Reports.tsx       (no enrutada actualmente)
│   └── NotFound.tsx
├── components/
│   ├── AppLayout.tsx     # layout base con sidebar + header
│   ├── AppHeader.tsx
│   ├── AppSidebar.tsx
│   └── icons.tsx
├── lib/                  # contextos React y utilidades
│   ├── auth.tsx
│   ├── settings-context.tsx
│   ├── exchange-rate.tsx
│   ├── rate-history.tsx
│   ├── sales-history.tsx
│   ├── debts-context.tsx
│   ├── cashier-shift.tsx
│   ├── i18n.tsx
│   ├── i18n-dictionaries.ts
│   ├── theme.ts
│   ├── storage.ts        # readLocalStorage / writeLocalStorage
│   └── demo-seed.ts      # carga datos demo la primera vez
└── mocks/                # catálogo y datos de demostración
    ├── products.ts
    ├── dashboard.ts
    └── demo-data.ts
```

## 3. Rutas y control de acceso

Definidas en [`App.tsx`](../frontend/src/App.tsx). Se aplican tres guards anidados:

- `ProtectedLayout` → exige sesión; redirige a `/login` si no hay usuario.
- `RoleProtectedRoute` → consulta `canAccessPath(role, path)`; si falla, redirige a `/pos`.
- `PublicOnlyRoute` → para `/login` y `/hello`; redirige a `/pos` si ya hay sesión.

La lista de rutas permitidas por rol vive en [`lib/auth.tsx`](../frontend/src/lib/auth.tsx):

```ts
dueno:  ['/', '/pos', '/sales-history', '/cash-closures', '/inventory', '/debts', '/costs', '/settings']
cajero: ['/pos', '/inventory', '/debts']
```

> **Nota:** los identificadores en código son `dueno` y `cajero` (sin tilde). La función `normalizeRole` también acepta `dueño`, `owner`, `admin` como alias de `dueno` por compatibilidad.

## 4. Composición de providers

[`main.tsx`](../frontend/src/main.tsx) monta los providers en este orden (de fuera a dentro):

```
I18nProvider
└── AuthProvider
    └── SettingsProvider
        └── RateHistoryProvider
            └── ExchangeRateProvider
                └── SalesHistoryProvider
                    └── DebtsProvider
                        └── CashierShiftProvider
                            └── <App />
```

El orden es deliberado: `ExchangeRateProvider` lee de `RateHistoryProvider`; `SalesHistoryProvider` consume `Settings` y `ExchangeRate`; etc. Antes de montar la app, `seedDemoDataIfEmpty()` carga datos demo si las claves correspondientes están vacías.

## 5. Contextos (estado global)

| Contexto              | Archivo                              | Propósito |
|-----------------------|--------------------------------------|-----------|
| `AuthContext`         | `lib/auth.tsx`                       | Usuario actual, login/logout, control de rutas por rol |
| `SettingsContext`     | `lib/settings-context.tsx`           | Configuración del negocio (moneda base, IVA, datos del comercio) |
| `ExchangeRateContext` | `lib/exchange-rate.tsx`              | Tasa Bs/USD vigente y `updatedAt` |
| `RateHistoryContext`  | `lib/rate-history.tsx`               | Histórico de cambios de tasa |
| `SalesHistoryContext` | `lib/sales-history.tsx`              | Ventas registradas |
| `DebtsContext`        | `lib/debts-context.tsx`              | Deudas (fiado), abonos, estados |
| `CashierShiftContext` | `lib/cashier-shift.tsx`              | Aperturas/cierres de caja |
| `I18nContext`         | `lib/i18n.tsx` + `i18n-dictionaries` | Idioma activo y traducciones |

Cada contexto expone un `Provider` y un hook `useXxx()` que lanza error si se usa fuera del provider. Todos persisten su estado en `localStorage` mediante los helpers de `lib/storage.ts`.

## 6. Persistencia (`localStorage`)

No hay backend. Toda la información se guarda con prefijo `abasto.*`:

| Clave                          | Contenido |
|--------------------------------|-----------|
| `abasto.auth.user`             | Sesión actual (objeto `AuthUser`) |
| `abasto.settings`              | Configuración del negocio |
| `abasto.exchangeRate.value`    | Tasa Bs/USD actual |
| `abasto.exchangeRate.updatedAt`| Timestamp de última actualización de tasa |
| `abasto.rateHistory`           | Historial de tasas |
| `abasto.salesHistory`          | Lista de ventas |
| `abasto.debts`                 | Lista de deudas |
| `abasto.cashierShifts`         | Aperturas/cierres de caja |
| `abasto.lang`                  | Idioma activo (`es`/`en`) |
| `abasto.theme`                 | Tema (`light`/`dark`) |
| `abasto.demo.seeded.v`         | Marca de versión de seed demo aplicada |

**Implicaciones:**

- Limpiar el almacenamiento del navegador borra todos los datos.
- No hay sincronización entre dispositivos ni backups automáticos.
- La sesión es local: el "login" valida contra usuarios hardcodeados en `Login.tsx`, no contra una API.

## 7. Datos demo

Al primer arranque, [`lib/demo-seed.ts`](../frontend/src/lib/demo-seed.ts) detecta claves vacías y carga datos de [`mocks/`](../frontend/src/mocks/):

- `products.ts` → catálogo inicial usado por POS e Inventario.
- `demo-data.ts` → ventas y deudas demo.
- `dashboard.ts` → KPIs/series para el Dashboard.

La marca `abasto.demo.seeded.v` evita re-seed en cada recarga.

## 8. Internacionalización y tema

- **Tema** (`lib/theme.ts`): claro/oscuro vía atributo en `<html>`. Se aplica antes del render para evitar flash.
- **i18n** (`lib/i18n.tsx` + `i18n-dictionaries.ts`): diccionarios en memoria, sin librería externa. Idioma persistido en `abasto.lang`.

## 9. Cómo añadir una nueva página

1. Crear el componente en `src/pages/MiPagina.tsx`.
2. Añadir la ruta en `App.tsx` (envolverla en `RoleProtectedRoute`).
3. Sumar la ruta a `ROLE_ALLOWED_ROUTES` en `lib/auth.tsx` para los roles que deben verla.
4. Si requiere estado nuevo, crear un contexto en `lib/` y montarlo en `main.tsx` en el orden correcto.
5. Si necesita persistir, usar `readLocalStorage` / `writeLocalStorage` de `lib/storage.ts` con una clave `abasto.<nombre>`.
6. Añadir entrada en `AppSidebar.tsx` si debe ser navegable desde la barra lateral.

## 10. Limitaciones conocidas

- Sin backend → no hay multiusuario real, ni control de concurrencia.
- Sin BD → consultas costosas (filtros sobre todo el historial) se hacen en memoria.
- `localStorage` tiene límite ~5 MB por origen; volúmenes grandes de ventas pueden llenarlo.
- No hay tests automatizados.
- Login no valida contraseñas reales; cualquier credencial conocida del mock funciona.
