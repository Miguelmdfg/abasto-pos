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
| Persistencia    | Supabase para operaciones conectadas; `localStorage` para preferencias y modo demo |
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
│   ├── Inventory.tsx     (/inventory — productos/importación en pestañas)
│   ├── Debts.tsx         (/debts)
│   ├── SalesHistory.tsx  (/sales-history — ventas/cierres en pestañas, solo dueño)
│   ├── CashClosures.tsx  (pestaña de /sales-history)
│   ├── Costs.tsx         (/costs — solo dueño)
│   ├── Settings.tsx      (/settings — general/usuarios en pestañas, solo dueño)
│   ├── UserManagement.tsx (pestaña de /settings)
│   ├── InventoryImport.tsx (pestaña de /inventory)
│   ├── Reports.tsx       (/reports — solo dueño)
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
│   └── demo-seed.ts      # inicializador demo (actualmente no inserta datos)
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

Las pantallas de usuarios, importación de inventario y cierres se muestran como pestañas dentro de Configuración, Inventario e Historial de ventas, respectivamente. Sus antiguas URLs redirigen a la pestaña correspondiente y mantienen el guard de rol.

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

El orden es deliberado: `AuthProvider` envuelve los contextos que recargan sus datos remotos al restaurarse/iniciarse una sesión. `seedDemoDataIfEmpty()` actualmente no inserta datos.

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

Cada contexto expone un `Provider` y un hook `useXxx()` que lanza error si se usa fuera del provider. Los contextos de negocio priorizan Supabase cuando está configurado; los datos locales de negocio se usan únicamente en modo demo/desarrollo.

## 6. Persistencia (`localStorage`)

Supabase es la fuente de verdad para los flujos conectados. Estas claves locales son preferencias o datos usados únicamente en modo demo/desarrollo:

| Clave                          | Contenido |
|--------------------------------|-----------|
| `abasto.auth.user`             | Usuario de demo, solo desarrollo con `VITE_DEMO_AUTH=true` |
| `abasto.settings`              | Configuración local del modo demo |
| `abasto.exchangeRate.value`    | Tasa manual del modo demo |
| `abasto.exchangeRate.updatedAt`| Timestamp de tasa demo |
| `abasto.rateHistory`           | Historial de tasas del modo demo |
| `abasto.salesHistory`          | Historial local solo del modo demo |
| `abasto.debts`                 | Cartera local solo del modo demo |
| `abasto.cashierShifts`         | Cierres locales solo del modo demo |
| `abasto.lang`                  | Idioma activo (`es`/`en`) |
| `abasto.theme`                 | Tema (`light`/`dark`) |
| `abasto.demo.seeded.v`         | Marca de versión de seed demo aplicada |

**Persistencia remota conectada:**

- Auth/perfiles, catálogo, ventas/pagos, caja y tasas históricas consultan Supabase cuando hay sesión.
- La configuración empresarial usa `app_settings`; la columna de métodos de pago necesita la migración `20261103100000_persist_payment_method_settings.sql`.
- Crédito, tasa BCV automatizada, importación y administración dependen de migraciones/funciones que deben desplegarse y probarse en el proyecto remoto.
- El módulo Costos es una calculadora en memoria: sus valores manuales no se sincronizan ni sobreviven al salir de la página.
- Tema e idioma se guardan en `localStorage` intencionalmente como preferencias de dispositivo.
- Una falla al cargar la configuración remota se informa y el POS bloquea el registro de ventas; no se sustituye por configuración local.

## 7. Datos demo

Los mocks de [`mocks/`](../frontend/src/mocks/) se conservan como material de desarrollo; `lib/demo-seed.ts` no los inserta automáticamente:

- `products.ts` → catálogo inicial usado por POS e Inventario.
- `demo-data.ts` → ventas y deudas demo.
- `dashboard.ts` → KPIs/series para el Dashboard.

Los productos de demostración no sustituyen al catálogo remoto cuando Supabase está configurado.

## 8. Internacionalización y tema

- **Tema** (`lib/theme.ts`): claro/oscuro vía atributo en `<html>`. Se aplica antes del render para evitar flash.
- **i18n** (`lib/i18n.tsx` + `i18n-dictionaries.ts`): diccionarios en memoria, sin librería externa. Idioma persistido en `abasto.lang`.

## 9. Cómo añadir una nueva página

1. Crear el componente en `src/pages/MiPagina.tsx`.
2. Añadir la ruta en `App.tsx` (envolverla en `RoleProtectedRoute`).
3. Sumar la ruta a `ROLE_ALLOWED_ROUTES` en `lib/auth.tsx` para los roles que deben verla.
4. Si requiere estado nuevo, crear un contexto en `lib/` y montarlo en `main.tsx` en el orden correcto.
5. Si el dato es de negocio, persistirlo mediante Supabase y definir RLS/RPC; reservar `localStorage` para preferencias locales o modo demo.
6. Añadir entrada en `AppSidebar.tsx` si debe ser navegable desde la barra lateral.

## 10. Limitaciones conocidas

- La integración con Supabase es parcial; las migraciones locales no garantizan que el esquema remoto esté al día.
- La consulta remota del historial de ventas está limitada a 500 registros; reportes con períodos mayores necesitan paginación.
- El modo demo persiste en `localStorage` y no sincroniza datos entre dispositivos.
- Hay pruebas automatizadas unitarias, pero faltan pruebas integrales contra Supabase con roles reales.
- Los respaldos y una restauración de prueba siguen siendo prerrequisitos de producción.
