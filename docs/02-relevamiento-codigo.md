# 02 — Relevamiento del código actual

> Fotografía del estado del frontend en `frontend/src/` orientada al diseño del modelo de datos. Solo describe lo que **existe en código**: tipos, persistencia, relaciones y cálculos. No propone modelo.
>
> **Última verificación:** 2026-04-28 (rama `final-code`). Verificar contra el código antes de tomar decisiones de schema.
>
> **Nota de terminología:** los nombres de tipo del código (`DebtItem`, `Abono`, método `'fiado'`, módulo "Deudas") se conservan en este documento porque describe el código actual. En el modelo de datos esos términos se renombran a **"Notas de Crédito"** / `CreditNote` / `CreditNotePayment` — ver MD-014 en [`03-decisiones-modelo-datos.md`](03-decisiones-modelo-datos.md).

## Índice

1. [Entidades de dominio](#1-entidades-de-dominio)
2. [Enumeraciones y catálogos](#2-enumeraciones-y-catálogos)
3. [Persistencia (`localStorage`)](#3-persistencia-localstorage)
4. [Relaciones implícitas](#4-relaciones-implícitas)
5. [Lógica de negocio y cálculos](#5-lógica-de-negocio-y-cálculos)
6. [Datos demo](#6-datos-demo)
7. [Vacíos detectados](#7-vacíos-detectados)
8. [Resumen para el modelo de datos](#8-resumen-para-el-modelo-de-datos)

---

## 1. Entidades de dominio

### 1.1 `AuthUser`

**Origen:** [frontend/src/lib/auth.tsx:6-11](../frontend/src/lib/auth.tsx)

```ts
export type UserRole = 'dueno' | 'cajero';

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
};
```

- **Cómo se llena:** credenciales hardcodeadas en `Login.tsx` (no hay backend de auth real). `normalizeRole` admite alias `dueño`/`owner`/`admin` → `dueno`.
- **Persistencia:** `abasto.auth.user` (JSON único).
- **Lectores:** `App.tsx` (guards), `AppHeader`, `Pos`, `SalesHistory`, `Debts` (toman `user.name` como cajero responsable).
- **Escritores:** `AuthContext.login()` y `logout()`.

### 1.2 `AppSettings`

**Origen:** [frontend/src/lib/settings-context.tsx:9-27](../frontend/src/lib/settings-context.tsx)

```ts
export type PaymentMethodKey =
  | 'efectivo_bs' | 'efectivo_usd' | 'pagomovil' | 'punto_venta' | 'mixto' | 'fiado';

export type AppSettings = {
  iva: number;                                       // %, ej. 16
  negocio_nombre: string;
  negocio_rif: string;
  negocio_direccion: string;
  negocio_telefono: string;
  pagomovil_banco: string;
  pagomovil_numero: string;
  pagomovil_cedula: string;
  metodos_habilitados: Record<PaymentMethodKey, boolean>;
  stock_minimo_global: number;                       // unidades
  dias_alerta_morosidad: number;                     // días
  limite_deuda_global: number;                       // Bs
};
```

- **Persistencia:** `abasto.settings` (JSON único). `DEFAULT_SETTINGS` se mergea con lo guardado al cargar.
- **Lectores:** `Settings.tsx` (formularios), `Pos.tsx` (`metodos_habilitados`).
- **Observación:** `iva`, `dias_alerta_morosidad` y `limite_deuda_global` están definidos pero **no se aplican en código** (ver §7).

### 1.3 `Product`

**Origen:** [frontend/src/mocks/products.ts:4-11](../frontend/src/mocks/products.ts)

```ts
export type Product = {
  id: number;
  name: string;
  category: string;
  price: number;     // Bs
  costo: number;     // Bs
  stock: number;
};
```

> ⚠ **Inconsistencia local:** `Pos.tsx:16-22` declara su propio `Product` **sin** el campo `costo`. El mismo concepto tiene dos shapes según la página.

- **Cómo se llena:** `MOCK_PRODUCTS` (131 ítems). No se persiste; se importa estáticamente.
- **Lectores:** `Pos`, `Inventory`, `Costs`, `Dashboard` (rankings), `SalesHistory` (lookup por id).
- **Escritores:** ninguno persistente. La UI de `Inventory.tsx` permite editar pero los cambios no se guardan en `localStorage` (no hay clave de productos).

### 1.4 `SaleRecord` y `SaleProduct`

**Origen:** [frontend/src/lib/sales-history.tsx:7-26](../frontend/src/lib/sales-history.tsx)

```ts
export type SaleProduct = {
  id: number;
  name: string;
  qty: number;
  price: number;     // Bs (snapshot al momento de la venta)
};

export type SaleRecord = {
  id: string;                       // VTA-YYYYMMDD-XXXX
  fecha: string;                    // ISO
  cajero: string;                   // nombre, no FK
  metodo: string;                   // PaymentMethodKey (no tipado estricto)
  total: number;                    // Bs
  tasa?: number;                    // Bs/USD usada al facturar
  productos: SaleProduct[];
  referencia?: string;              // 6 dígitos pago móvil
  banco?: string;
  monto_efectivo?: number;
  moneda_efectivo?: 'bs' | 'usd';
};
```

- **Persistencia:** `abasto.salesHistory` (array JSON). Tope **500 registros** (`MAX_RECORDS`); las nuevas se anteponen y se descarta lo viejo.
- **ID:** `VTA-YYYYMMDD-XXXX` (XXXX = aleatorio 1000-9999).
- **Lectores:** `SalesHistory`, `Dashboard`, `CashClosures` (suma del día), `Pos.tsx` (cálculo de cierre).
- **Escritores:** `Pos.tsx` al confirmar pago (vía `addSale`); `seedDemoDataIfEmpty()`.

### 1.5 `DebtItem` y `Abono`

**Origen:** [frontend/src/lib/debts-context.tsx:7-25](../frontend/src/lib/debts-context.tsx)

```ts
export type Abono = {
  id: number;
  fecha: string;     // ISO
  monto: number;     // Bs
  tasa?: number;
  nota?: string;
};

export type DebtItem = {
  id: number;
  nombre: string;
  telefono?: string;
  cedula?: string;
  limite_credito: number;
  deuda_total: number;
  ultima_compra?: string;
  abonos: Abono[];
  ventas: string[];      // SaleRecord.id (FK lógica, sin integridad)
};
```

- **Persistencia:** `abasto.debts` (array JSON). Sin tope.
- **ID cliente:** `Date.now()` al crear.
- **`deuda_total`:** valor **almacenado**, no derivado. Se actualiza manualmente en `addDebt`/`addAbono`. Riesgo de divergencia con `ventas[] - abonos[]`.
- **Lectores:** `Debts.tsx`. `Pos.tsx` lo importa para resolver venta fiada.
- **Escritores:** `addClient`, `addDebt` (desde Pos al elegir fiado), `addAbono`, `setDebts`.

### 1.6 `CashierShift`

**Origen:** [frontend/src/lib/cashier-shift.tsx:7-41](../frontend/src/lib/cashier-shift.tsx)

```ts
export type CashierShift = {
  id: string;                        // CIERRE-YYYYMMDD-XXXX
  fecha: string;                     // ISO (cierre)
  cajero: string;
  subtotalProductos: number;
  cantidadProductos: number;
  creditosOtorgados: number;
  totalVenta: number;
  efectivoDivisas: number;           // USD
  efectivoDivisasBs: number;         // USD * tasa
  efectivoBolivares: number;
  puntoVenta: number;
  pagoMovil: number;
  creditosPagados: number;
  totalCaja: number;
  diferencia: number;
  estadoCuadre: 'cuadrado' | 'sobrante' | 'faltante';
  cierresParciales: Array<{
    nombre: string;
    efectivoDivisas: number;
    efectivoBolivares: number;
    puntoVenta: number;
    pagoMovil: number;
    creditosPagados: number;
    totalCaja: number;
  }>;
  divisasRestante: number;
  bolivaresRestante: number;
  totalDejadoCaja: number;
  distribucion: Array<{ responsable: string; monto: number }>;
  tasaCierre: number;
};
```

- **Persistencia:** `abasto.cashierShifts` (array JSON). Tope **500**.
- **ID:** `CIERRE-YYYYMMDD-XXXX`.
- **`addShift` recibe `Omit<CashierShift, 'id' | 'fecha'>`**; el contexto inyecta id y fecha.
- **No guarda apertura** — la entidad solo registra el evento de cierre. No hay tabla de "shifts abiertos" ni `opened_at`/`closed_at`.
- **No referencia las ventas que cubre** — solo agrega totales.

### 1.7 `ExchangeRate` (singleton + historial)

**Origen:** [frontend/src/lib/exchange-rate.tsx:9-14](../frontend/src/lib/exchange-rate.tsx)

```ts
type ExchangeRateContextValue = {
  rate: number;
  updatedAt: number;        // epoch ms
  isStale: boolean;         // > 24h sin actualizar
  setRate: (nextRate: number) => void;
};
```

- **Persistencia:** dos claves planas separadas: `abasto.exchangeRate.value` y `abasto.exchangeRate.updatedAt` (no JSON).
- **Default:** `36`. `setRate` valida `Number.isFinite && > 0`; sin tope superior.

### 1.8 `RateEntry`

**Origen:** [frontend/src/lib/rate-history.tsx:7-10](../frontend/src/lib/rate-history.tsx)

```ts
export type RateEntry = {
  fecha: string;     // ISO
  rate: number;
};
```

- **Persistencia:** `abasto.rateHistory` (array JSON). Tope **365**.
- Usado por `getRateForDate(fecha)` para reconstruir tasa histórica al ver ventas/deudas pasadas.

### 1.9 `ThemeMode` / `Language`

```ts
export type ThemeMode = 'light' | 'dark';     // lib/theme.ts
export type Language  = 'es' | 'en';          // lib/i18n-dictionaries.ts
```

Persistencia: `abasto.theme`, `abasto.lang` (strings planos). UI/preferencia, no dominio.

### 1.10 Análisis de costos (local a `Costs.tsx`)

**Tipos inferidos** (no exportados; viven dentro del componente):

```ts
type CostsSettings = {
  tasaBCV: number;
  tasaParalelo: number;
  gananciaBCV: number;        // %
  gananciaParalelo: number;   // %
};

type ProductCostRow = {
  unidadesPorBulto: number;
  costoBultoUsd: number;
  precioVentaUsdManual?: number;
  precioVentaBcvManual?: number;
  precioVentaParaleloManual?: number;
  gananciaBcvOverride?: number;
  gananciaParaleloOverride?: number;
};
```

- **Persistencia:** `abasto.costs.settings` y `abasto.costs.rows` (mapa por `product.id`).
- Aislado al módulo `Costs`; no impacta ventas ni inventario.

---

## 2. Enumeraciones y catálogos

| Enum | Definido en | Valores |
|---|---|---|
| `UserRole` | `lib/auth.tsx:4` | `'dueno' \| 'cajero'` |
| `PaymentMethodKey` | `lib/settings-context.tsx:7` | `'efectivo_bs' \| 'efectivo_usd' \| 'pagomovil' \| 'punto_venta' \| 'mixto' \| 'fiado'` |
| `PaymentMethod` (POS) | `pages/Pos.tsx:25` | mismo set, redefinido localmente |
| `metodo` (Sale) | `lib/sales-history.tsx:18` | tipado como `string` (acepta cualquier valor) — los demos incluyen `'tarjeta'` que no está en el enum |
| `MonedaEfectivo` | `pages/Pos.tsx:31`, `sales-history.tsx:25` | `'bs' \| 'usd'` |
| `estadoCuadre` | `lib/cashier-shift.tsx:23` | `'cuadrado' \| 'sobrante' \| 'faltante'` |
| `DebtStatus` | `pages/Debts.tsx` (calculado) | `'al_dia' \| 'por_vencer' \| 'vencida' \| 'saldada'` (derivado, no almacenado) |
| `BANCOS_VE` | `pages/Pos.tsx:38` | `Banesco`, `Banco de Venezuela`, `Mercantil`, `BBVA Provincial`, `Banco del Tesoro`, `BNC`, `Bancamiga`, `Bicentenario`, `Otro` |
| `ThemeMode` | `lib/theme.ts:3` | `'light' \| 'dark'` |
| `Language` | `lib/i18n-dictionaries.ts:1` | `'es' \| 'en'` |

> **Inconsistencia clave:** `SaleRecord.metodo` está tipado como `string` y los datos demo incluyen `'tarjeta'`, valor que **no aparece** en `PaymentMethodKey`. El modelo de datos debe decidir un set único y migrar.

---

## 3. Persistencia (`localStorage`)

Todo `localStorage`; sin backend. Helpers en `lib/storage.ts`.

| Clave | Tipo lógico | Formato | Tope | Lectura | Escritura |
|---|---|---|---|---|---|
| `abasto.auth.user` | `AuthUser` | JSON objeto | 1 | `lib/auth.tsx:36` | `lib/auth.tsx:61, 65` |
| `abasto.settings` | `AppSettings` | JSON objeto | 1 | `lib/settings-context.tsx` | `lib/settings-context.tsx` |
| `abasto.salesHistory` | `SaleRecord[]` | JSON array | 500 | `lib/sales-history.tsx` | `lib/sales-history.tsx` (`addSale`) |
| `abasto.debts` | `DebtItem[]` | JSON array | ∞ | `lib/debts-context.tsx` | `lib/debts-context.tsx` (`addClient`, `addDebt`, `addAbono`, `setDebts`) |
| `abasto.cashierShifts` | `CashierShift[]` | JSON array | 500 | `lib/cashier-shift.tsx` | `lib/cashier-shift.tsx` (`addShift`) |
| `abasto.rateHistory` | `RateEntry[]` | JSON array | 365 | `lib/rate-history.tsx` | `lib/rate-history.tsx` (`pushRate`) |
| `abasto.exchangeRate.value` | `number` | string plano | 1 | `lib/exchange-rate.tsx:19` | `lib/exchange-rate.tsx:46` |
| `abasto.exchangeRate.updatedAt` | `number` (epoch ms) | string plano | 1 | `lib/exchange-rate.tsx:25` | `lib/exchange-rate.tsx:48` |
| `abasto.theme` | `ThemeMode` | string plano | 1 | `lib/theme.ts` | `lib/theme.ts` |
| `abasto.lang` | `Language` | string plano | 1 | `lib/i18n.tsx` | `lib/i18n.tsx` |
| `abasto.demo.seeded.v` | `string` | string plano | 1 | `lib/demo-seed.ts` | `lib/demo-seed.ts` |
| `abasto.costs.settings` | `CostsSettings` | JSON objeto | 1 | `pages/Costs.tsx` | `pages/Costs.tsx` |
| `abasto.costs.rows` | `Record<id, ProductCostRow>` | JSON objeto | 1 | `pages/Costs.tsx` | `pages/Costs.tsx` |

**No persistido en absoluto:** catálogo de productos. El estado del inventario (precio/stock editado en `Inventory.tsx`) se pierde al recargar — los productos vuelven al `MOCK_PRODUCTS`.

---

## 4. Relaciones implícitas

```
AuthUser.name ─────────────► SaleRecord.cajero        (string, no FK)
AuthUser.name ─────────────► CashierShift.cajero      (string, no FK)
AuthUser.name ─────────────► CashierShift.distribucion[].responsable  (string libre)

Product.id    ─────────────► SaleProduct.id           (snapshot copia name+price)
                              SaleRecord.productos[]

SaleRecord.id ─────────────► DebtItem.ventas[]        (array de strings)
                              (sólo cuando metodo === 'fiado')

DebtItem ───── 1 ─── n ───► Abono                      (embebidos en `abonos[]`)

CashierShift  ─/─►  SaleRecord                         (NO hay relación; sólo agregados)

ExchangeRate ─snapshot─► SaleRecord.tasa, CashierShift.tasaCierre, Abono.tasa
RateEntry[]  ───histórico───► getRateForDate(fecha)
```

**Características del grafo:**

- **Sin integridad referencial.** `DebtItem.ventas` y `SaleRecord.cajero` apuntan a IDs/nombres sin garantía de existencia.
- **Snapshots en lugar de joins.** `SaleProduct` copia `name` y `price` de `Product`; `SaleRecord.tasa` congela la tasa del momento. Esto sobrevive a cambios en catálogo y tasa, pero duplica datos.
- **`deuda_total` denormalizado.** No se calcula desde `ventas[]` y `abonos[]`; se mantiene manualmente.

---

## 5. Lógica de negocio y cálculos

### 5.1 Total del POS

[Pos.tsx:909](../frontend/src/pages/Pos.tsx)

```ts
const total = useMemo(
  () => cart.reduce((acc, item) => acc + item.price * item.qty, 0),
  [cart],
);
```

- **No aplica IVA** (aunque `AppSettings.iva` existe).
- Total siempre en Bs. Conversión a USD = `total / rate` (display only).

### 5.2 Estado de deuda (derivado)

`Debts.tsx` (calculado en runtime, no almacenado):

```
saldada     si deuda_total ≤ 0
vencida     si días desde ultima_compra > 30
por_vencer  si días desde ultima_compra ≥ 20 y ≤ 30
al_dia      en otro caso
```

Los umbrales **están hardcodeados**; ignoran `AppSettings.dias_alerta_morosidad`.

### 5.3 Cuadre de caja

[Pos.tsx:519-527, 843-865](../frontend/src/pages/Pos.tsx)

```ts
totalCaja = efectivoDivisasBs + efectivoBolivares
          + puntoVenta + pagoMovil + creditosPagados;

efectivoDivisasBs = efectivoDivisas /* USD */ * rate;

subtotalProductos = sum(salesToday.map(s => s.total));   // todas las ventas del día
totalVenta        = subtotalProductos - creditosOtorgados;
diferencia        = totalCaja - totalVenta;

estadoCuadre = diferencia === 0 ? 'cuadrado'
             : diferencia >  0 ? 'sobrante'
             :                   'faltante';

totalDejadoCaja = (divisasRestante * rate) + bolivaresRestante;
```

> "Ventas del día" = todos los `SaleRecord` cuya `fecha` cae en el `dayKey` actual; **no hay filtro por cajero**. Si dos cajeros operan el mismo día, sus ventas se mezclan.

### 5.4 Validaciones presentes

- **Pago móvil/Mixto** (`Pos.tsx:103-117`): `referencia` con regex `^\d{6}$`; `banco` obligatorio; en mixto `monto_efectivo > 0`.
- **Abonos** (`debts-context.tsx`): se valida `monto > 0` y se descuenta de `deuda_total`.
- **Login** (`auth.tsx`): `normalizeRole` rechaza valores fuera del set.

### 5.5 Validaciones ausentes

- **Stock vs cantidad en carrito:** no hay verificación al añadir al carrito ni al confirmar. Permite vender por encima del stock.
- **Límite de crédito:** `DebtItem.limite_credito` se almacena pero `Pos.tsx` no impide registrar fiado que lo supere.
- **Cuenta desactivada:** no hay flag `active` en `AuthUser`; el requerimiento ("Tu cuenta está desactivada") no se puede implementar con el modelo actual.

---

## 6. Datos demo

Cargados por [lib/demo-seed.ts](../frontend/src/lib/demo-seed.ts) en el primer arranque (controlado por `abasto.demo.seeded.v`).

| Mock | Volumen | Forma | Notas |
|---|---|---|---|
| `mocks/products.ts` | **131 productos** (ids 101-905, agrupados por categoría) | `Product` | Categorías: Granos, Pastas, Aceites, Condimentos, Enlatados, Bebidas, Lácteos, Galletas, Snacks, Higiene, Limpieza, Papelería. `price` y `costo` en Bs; `stock` 0–200. |
| `mocks/demo-data.ts` (ventas) | **20 ventas** últimos 7 días | `SaleRecord[]` (escritas en `abasto.salesHistory`) | Cajeros demo: "Ana Méndez", "Luis Ramos". Aparece `metodo: 'tarjeta'` (no en enum). |
| `mocks/demo-data.ts` (deudas) | **4 clientes** (ids 1001-1004) | `DebtItem[]` (escritas en `abasto.debts`) | Incluyen abonos pre-cargados; `limite_credito` 3000-5000 Bs. |
| `mocks/dashboard.ts` | KPIs y series | usado solo por `Dashboard.tsx` | Mock estático, no agrega nada al dominio. |

---

## 7. Vacíos detectados

Marcados como input para el modelo de datos, no como bugs a tapar ahora.

### 7.1 Identidad y referencias

- `SaleRecord.cajero`, `CashierShift.cajero`, `distribucion[].responsable` son **strings libres**, no FKs a usuarios.
- `DebtItem.ventas` es `string[]` sin constraint contra `SaleRecord.id`.
- `Product.id` es `number`; no existe tabla persistente de productos — solo el array `MOCK_PRODUCTS`.

### 7.2 Campos de auditoría inexistentes

- Ninguna entidad tiene `created_at`/`updated_at`/`created_by`/`updated_by`.
- `Product` no tiene historial de cambios de precio/costo.
- `SaleRecord` no tiene `status` ni `cancelled_at`; las ventas no se pueden anular formalmente.

### 7.3 Estados no modelados

- **`AuthUser.active`**: el requerimiento de "cuenta desactivada" no está implementable.
- **Apertura de turno:** `CashierShift` solo guarda el cierre. No hay registro persistente de "turno abierto" con `opened_at`, `monto_inicial_bs`, `monto_inicial_usd`.
- **Verificación de pago móvil:** la `referencia` se guarda pero no hay flag `verificada`.

### 7.4 Datos denormalizados que pueden divergir

- `DebtItem.deuda_total` vs `sum(ventas)` − `sum(abonos)`: se mantiene a mano.
- `SaleProduct.name` y `price` son copias de `Product`: correcto para snapshot, pero hay que decidir si productos también guardan historial.

### 7.5 Configuración declarada pero no aplicada

- `AppSettings.iva` → POS no calcula IVA.
- `AppSettings.dias_alerta_morosidad` → `Debts.tsx` usa 30 hardcodeado.
- `AppSettings.limite_deuda_global` → no se usa.
- `AppSettings.stock_minimo_global` → no se usa para alertas.

### 7.6 Multi-moneda incompleto

- `SaleRecord.total` siempre en Bs. Si la venta fue en USD (`efectivo_usd`), no hay `total_usd` ni desglose `monto_bs` + `monto_usd`.
- `Abono.monto` también solo en Bs; si abonan en USD se convierte al guardar (con `tasa` opcional).

### 7.7 Inconsistencias de tipos

- `Product` tiene shape distinto en `mocks/products.ts` (con `costo`) y en `Pos.tsx` (sin `costo`).
- `SaleRecord.metodo` es `string`, no `PaymentMethodKey`. Datos demo usan `'tarjeta'` que no está en el enum.
- `UserRole` admite alias (`dueño`, `owner`, `admin`) pero la persistencia normaliza siempre a `dueno`/`cajero`.

### 7.8 Concurrencia / multi-cajero

- Cuadre de caja agrega "ventas del día" sin filtrar por cajero.
- No hay `shift_id` en `SaleRecord`. Imposible saber a qué turno pertenece una venta.

### 7.9 Sin entidades para…

- **Proveedores** (sección 4.6 de requerimientos): no existe tipo ni módulo.
- **Compras de mercancía / movimientos de inventario:** no existen. El stock no tiene historial.
- **Alertas:** no hay tipo `Alert`/`Notification` ni canal donde se publiquen.
- **Carga Excel:** no hay tipos para batch import.

---

## 8. Resumen para el modelo de datos

### 8.1 Entidades núcleo (presentes en código)

| Entidad | Estado en código | Persistido | Necesita FK formal a |
|---|---|---|---|
| `User` | tipo `AuthUser` definido | sí (sesión) | — |
| `Product` | tipo definido pero **inconsistente** entre archivos | **no** | (categoría como tabla aparte si se normaliza) |
| `Sale` | `SaleRecord` | sí | `User`, `CashierShift` (falta), `Client` (falta cuando es fiada) |
| `SaleItem` | `SaleProduct` | embebido en Sale | `Product` (snapshot) |
| `Client` | `DebtItem` | sí | — |
| `DebtPayment` | `Abono` | embebido en Client | `User` (quién recibió, falta), `PaymentMethod` (falta) |
| `CashierShift` | tipo definido (sólo cierre) | sí | `User`, ventas del turno (falta) |
| `ExchangeRate` actual | singleton | sí (2 claves) | — |
| `ExchangeRateHistory` | `RateEntry[]` | sí | — |
| `Settings` | `AppSettings` | sí (singleton) | — |

### 8.2 Entidades a crear (referenciadas pero ausentes)

- `Supplier` (proveedores)
- `InventoryMovement` (entradas/salidas de stock con causa: compra, venta, ajuste)
- `ShiftOpening` o extensión de `CashierShift` con apertura
- `Alert` / `Notification`
- Auditoría transversal (logs de cambios)

### 8.3 Decisiones de diseño que el código deja abiertas

1. **¿Snapshot vs join en líneas de venta?** Hoy se hace snapshot (`SaleProduct` copia `name`+`price`). Conservarlo simplifica reportes históricos pero impide editar productos retroactivamente.
2. **¿`deuda_total` derivada o almacenada?** Hoy almacenada y mutable manualmente. Migrar a derivada (vista) elimina la posibilidad de divergencia.
3. **¿`SaleRecord.metodo` enum estricto?** Hoy `string` libre. Decidir: incluir `'tarjeta'` o migrar demos.
4. **¿IVA por línea o total?** No hay IVA hoy. El modelo debe definir si se guarda `iva_pct` por venta, `subtotal_neto`, `iva_monto`, `total_bruto`.
5. **¿Multi-moneda en montos?** Decidir si cada monto guarda su moneda original (`amount + currency`) o si se normaliza todo a Bs con `tasa` snapshot.
6. **¿Turno como agregador de ventas?** Si `CashierShift` debe ser auditable, las ventas necesitan `shift_id`.
7. **¿Productos con historial de precio/costo?** Hoy mutable sin trazabilidad.

### 8.4 Identificadores en uso

| Entidad | Tipo de id | Generación |
|---|---|---|
| `AuthUser` | `number` | manual / mock |
| `Product` | `number` | manual / mock |
| `SaleRecord` | `string` | `VTA-YYYYMMDD-{1000-9999}` (colisión posible con volumen alto) |
| `CashierShift` | `string` | `CIERRE-YYYYMMDD-{1000-9999}` (idem) |
| `DebtItem` | `number` | `Date.now()` |
| `Abono` | `number` | `Date.now()` (colisión si dos abonos en mismo ms) |

> Para el modelo backend conviene unificar a UUIDs (o BIGSERIAL) y conservar los IDs legibles (`VTA-…`, `CIERRE-…`) como **número de comprobante** en columna aparte.

---

**Archivos fuente revisados:**
[App.tsx](../frontend/src/App.tsx), [main.tsx](../frontend/src/main.tsx),
[lib/auth.tsx](../frontend/src/lib/auth.tsx), [lib/settings-context.tsx](../frontend/src/lib/settings-context.tsx), [lib/exchange-rate.tsx](../frontend/src/lib/exchange-rate.tsx), [lib/rate-history.tsx](../frontend/src/lib/rate-history.tsx), [lib/sales-history.tsx](../frontend/src/lib/sales-history.tsx), [lib/debts-context.tsx](../frontend/src/lib/debts-context.tsx), [lib/cashier-shift.tsx](../frontend/src/lib/cashier-shift.tsx), [lib/i18n.tsx](../frontend/src/lib/i18n.tsx), [lib/storage.ts](../frontend/src/lib/storage.ts), [lib/demo-seed.ts](../frontend/src/lib/demo-seed.ts), [lib/theme.ts](../frontend/src/lib/theme.ts),
[pages/Pos.tsx](../frontend/src/pages/Pos.tsx), [pages/Inventory.tsx](../frontend/src/pages/Inventory.tsx), [pages/Debts.tsx](../frontend/src/pages/Debts.tsx), [pages/CashClosures.tsx](../frontend/src/pages/CashClosures.tsx), [pages/SalesHistory.tsx](../frontend/src/pages/SalesHistory.tsx), [pages/Costs.tsx](../frontend/src/pages/Costs.tsx), [pages/Settings.tsx](../frontend/src/pages/Settings.tsx), [pages/Dashboard.tsx](../frontend/src/pages/Dashboard.tsx), [pages/Reports.tsx](../frontend/src/pages/Reports.tsx), [pages/Login.tsx](../frontend/src/pages/Login.tsx),
[mocks/products.ts](../frontend/src/mocks/products.ts), [mocks/demo-data.ts](../frontend/src/mocks/demo-data.ts), [mocks/dashboard.ts](../frontend/src/mocks/dashboard.ts).
