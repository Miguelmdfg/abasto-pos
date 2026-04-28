# 03 — Decisiones del modelo de datos

> Registro de decisiones para el diseño del modelo de datos. Alimentado por [02-relevamiento-codigo.md](02-relevamiento-codigo.md) y conversación con el dueño del producto.
>
> Cada entrada es un ADR ligero. **Estados:**
>
> - ✅ **Decidida** — vinculante para el schema.
> - 💡 **Propuesta** — recomendación técnica pendiente de validación.
> - ⏸ **Pendiente** — bloqueada o en discusión (ver [§ ADRs pendientes](#adrs-pendientes)).
> - 🚀 **v2** — fuera de alcance del schema inicial.

## Tabla de decisiones

| ID     | Tema                                                            | Estado |
|--------|-----------------------------------------------------------------|--------|
| MD-001 | Multi-tenancy: una tienda inicial, schema clonable              | ✅ |
| MD-002 | `Settings` singleton (1 fila) en v1                             | ✅ |
| MD-003 | Productos como entidad persistente con CRUD                     | ✅ |
| MD-004 | Stock como libro mayor (`InventoryMovement`)                    | ✅ |
| MD-005 | `Category` como tabla normalizada                               | ✅ |
| MD-006 | `ProductPriceHistory`: histórico de precios                     | ✅ |
| MD-007 | `ProductCostHistory`: histórico de costos                       | ✅ |
| MD-008 | `SaleItem` con FK al producto + FK al precio/costo histórico    | ✅ |
| MD-009 | `SalePayment`: tabla de pagos N por venta                       | 💡 |
| MD-010 | `PaymentMethod` como tabla, no enum                             | 💡 |
| MD-011 | Multi-moneda: Bs como moneda funcional, montos originales preservados | 💡 |
| MD-012 | Dos tasas: BCV y Paralelo                                       | ✅ |
| MD-013 | Tabla `ExchangeRate(type, value, valid_from)` por tipo de tasa  | 💡 |
| MD-014 | Renombrar dominio "Deudas/Fiado" → **"Notas de Crédito"**       | ✅ |
| MD-015 | `Customer` como entidad propia, separada de la nota             | ✅ |
| MD-016 | `CreditNote` (nota de crédito) referenciada por `Sale.credit_note_id` | ✅ |
| MD-017 | Saldo de la nota: derivado de pagos vs cargos                   | 💡 |
| MD-018 | `CreditNotePayment` (abono) con método de pago y cajero         | 💡 |
| MD-019 | Estado de nota (`vigente`/`vencida`/`saldada`): derivado        | 💡 |
| MD-020 | Umbrales de morosidad en `Settings`, no hardcodeados            | 💡 |
| MD-021 | `CashierShift` única (apertura + cierre)                        | 💡 |
| MD-022 | `Sale.shift_id NOT NULL`                                        | 💡 |
| MD-023 | `PartialClosure` y `ShiftDistribution` como tablas              | 💡 |
| MD-024 | `User.active` + `password_hash`                                 | 💡 |
| MD-025 | Auditoría: `created_at` / `updated_at` universal                | 💡 |
| MD-026 | UUID como PK + `code` humano legible aparte                     | 💡 |
| MD-027 | IVA: cómo se aplica                                             | ⏸ |
| MD-028 | Anulaciones / devoluciones de venta                             | 🚀 v2 |
| MD-029 | Suppliers / Purchases                                           | 🚀 v2 |
| MD-030 | `AuditLog` detallado de cambios                                 | 🚀 v2 |
| MD-031 | Centro de Alertas como tabla                                    | 🚀 v2 |

---

## MD-001 · Multi-tenancy

**Contexto:** A1 — los requerimientos prevén multi-sucursal eventual.
**Decisión:** una sola tienda en producción inicial. El schema **no** lleva `store_id` en v1, pero se diseña para clonarse: cualquier ID es portable y sin estado global compartido.
**Consecuencias:** al migrar a multi-sucursal se agregará `store_id NOT NULL` con backfill al store original. Los códigos legibles (`VTA-…`, `CIERRE-…`) deberán prefijarse con identificador de sucursal en esa migración.

## MD-002 · Settings singleton

**Decisión:** tabla `Settings` con una sola fila (constraint `id = 1`). En multi-sucursal se vuelve `Settings(store_id PK)`.
**Consecuencias:** acceso por `SELECT * FROM settings WHERE id = 1`.

## MD-003 · Productos como entidad persistente

**Contexto:** B1 — hoy `MOCK_PRODUCTS` no se persiste.
**Decisión:** `Product` es entidad real con CRUD.
**Campos mínimos:** `id`, `code` (SKU legible), `name`, `category_id`, `current_price_id` (FK→PriceHistory, ver MD-006), `current_cost_id` (FK→CostHistory, ver MD-007), `active`, timestamps.
**Consecuencias:** el inventario deja de regenerarse desde mocks; las ediciones persisten.

## MD-004 · Stock como libro mayor

**Contexto:** B2 — el stock debe gestionarse con historial.
**Decisión:** el stock **no** es columna mutable en `Product`. Se deriva de `InventoryMovement(product_id, type, quantity, unit_cost?, reason, reference_type?, reference_id?, occurred_at, created_by)`.
**Tipos de movimiento:** `compra`, `venta`, `ajuste_positivo`, `ajuste_negativo`, `merma`, `devolucion`, `inventario_inicial`.
**Stock vigente:** vista materializada `ProductStock(product_id, current_qty)` o columna desnormalizada actualizada por trigger.
**Consecuencias:** auditoría completa de cómo cambió el stock; reconstruir stock a una fecha pasada es trivial. Implementar la carga por Excel será un batch de movimientos `inventario_inicial`.

## MD-005 · Categorías como tabla

**Contexto:** B3.
**Decisión:** `Category(id, name, parent_id NULL, active)`. Permite jerarquías futuras sin migración.

## MD-006 · `ProductPriceHistory`

**Contexto:** B4.
**Decisión:** `ProductPriceHistory(id, product_id, price_bs, valid_from, valid_to NULL, created_by, created_at)`.
**Regla:** una fila vigente por producto en cada momento (`valid_to IS NULL` para la actual). Al cambiar el precio: cerrar la fila vigente (`valid_to = NOW()`) e insertar nueva.
**Consecuencias:** consultar precio del producto X el 15/03 es `WHERE product_id=X AND valid_from <= '2026-03-15' AND (valid_to IS NULL OR valid_to > '2026-03-15')`.

## MD-007 · `ProductCostHistory`

**Decisión:** análogo a MD-006 pero para `cost_bs` (o `cost_usd`, ver MD-011).
**Consecuencias:** reportes de margen históricos son fieles aunque cambien costos hoy.

## MD-008 · `SaleItem` con referencias a histórico

**Contexto:** B5 + C5.
**Decisión:** la línea de venta no copia `price`/`costo` como valores planos. Guarda:
- `product_id` (FK → Product)
- `price_history_id` (FK → ProductPriceHistory) — precio aplicado
- `cost_history_id` (FK → ProductCostHistory) — costo vigente al vender
- `qty`
- `name_snapshot` (string; copia del nombre al momento, para resistir borrados/renames)
**Consecuencias:** cualquier reporte histórico (margen, ranking, ganancia) se reconstruye uniendo a las tablas de histórico — no hay datos duplicados ni divergentes.

## MD-009 · `SalePayment`

**Contexto:** C2.
**Decisión:** una venta tiene N filas en `SalePayment`. Pago simple = 1 fila; mixto = 2 o 3.
**Esquema:**
```
SalePayment(
  id, sale_id (FK), payment_method_id (FK),
  amount, currency ('BS' | 'USD'),
  exchange_rate_snapshot (NULL si currency='BS'),
  reference (6 dígitos pago móvil, NULL),
  bank (NULL),
  received_at,
  created_at, created_by
)
```
**Constraint:** `SUM(amount * tasa_to_bs)` por venta debe igualar `Sale.total`.
**Consecuencias:** simple y mixto comparten estructura. Reportes de arqueo y "ventas por método" son `GROUP BY payment_method_id`. La venta a crédito se representa como un `SalePayment` con `payment_method = 'NOTA_CREDITO'` (ver MD-016).

## MD-010 · `PaymentMethod` como tabla

**Contexto:** C3.
**Decisión:** tabla `PaymentMethod(id, code, name, active, requires_reference, requires_bank)` en lugar de enum.
**Catálogo inicial:** `EFECTIVO_BS`, `EFECTIVO_USD`, `PAGO_MOVIL`, `PUNTO_VENTA`, `NOTA_CREDITO`, `TARJETA` (cubre el caso de los datos demo que ya usan `'tarjeta'`).
**Consecuencias:** `Settings.metodos_habilitados` ya no es `Record<key, bool>` sino la columna `active` de la tabla. Agregar un método nuevo no requiere migración de schema. **`'mixto'` deja de ser un método** — se modela por la presencia de múltiples filas en `SalePayment`.

## MD-011 · Multi-moneda

**Contexto:** D1.
**Decisión:** **Bs es la moneda funcional.**
- `Sale.total_bs` (numerico, principal).
- `Sale.exchange_rate_bcv` y `Sale.exchange_rate_paralelo` (snapshots, valores al momento de cerrar la venta).
- `SalePayment.amount` + `SalePayment.currency` (preservar moneda original; tasa aplicada en `exchange_rate_snapshot`).
- Vistas precomputadas para `total_usd_bcv` y `total_usd_paralelo` si se requiere.
**Consecuencias:** la caja física puede tener mezcla de Bs y USD; cada billete se rastrea en su moneda original. Reportes contables suman `total_bs`. Reportes en USD eligen tipo de tasa.

## MD-012 · Dos tasas (BCV y Paralelo)

**Contexto:** D2.
**Decisión:** el sistema maneja dos tasas en paralelo. Cada venta y cada movimiento que requiera conversión guarda **ambas** como snapshot.

## MD-013 · `ExchangeRate(type, value, valid_from)`

**Decisión:** tabla con `(type ∈ {bcv, paralelo}, value, valid_from, valid_to NULL, created_by)`. La tasa "vigente" es la fila con `valid_to IS NULL` de cada tipo.
**Consecuencias:** sustituye al singleton actual + `RateEntry[]`. La función `getRateForDate(type, fecha)` se vuelve un `WHERE`.

## MD-014 · Renombrado: "Notas de Crédito"

**Contexto:** E1 — el dueño del producto usa "Nota de Crédito" como el término del dominio para lo que el código actual llama "fiado/deuda".
**Decisión:** el dominio se renombra a **"Notas de Crédito"** en toda la documentación y en el modelo de datos.
**Mapeo:**

| Código actual | Modelo de datos |
|---|---|
| Módulo "Deudas" / "Debts" | Módulo "Notas de Crédito" |
| `DebtItem` | `Customer` + `CreditNote` (separadas, ver MD-015 y MD-016) |
| `Abono` | `CreditNotePayment` |
| Método de pago `'fiado'` | `'NOTA_CREDITO'` |
| "Venta fiada" | "Venta con nota de crédito" |
| "Cliente con deuda" | "Cliente con nota de crédito vigente" |

**Notas:**
- "Deuda" como **concepto contable general** (saldo pendiente) sigue siendo válido. El término controlado es para el **instrumento** (la nota) y el **módulo**.
- El código del frontend (`Debts.tsx`, `DebtItem`, `Abono`, `'fiado'`) **se mantiene en esta fase**. El renombre se aplica al implementar el backend / migrar la app.

## MD-015 · `Customer` como entidad propia

**Contexto:** E1 — el cliente que paga al contado es solo una venta sin cliente; el cliente con nota es una entidad persistente.
**Decisión:** tabla `Customer(id, name, document, phone, email, credit_limit_bs, active, created_at, updated_at)` con índice único en `document` (cédula/RIF). Los clientes solo se crean cuando se les emite una nota; ventas sin cliente quedan como `Sale.customer_id = NULL`.

## MD-016 · `CreditNote`

**Decisión:**
```
CreditNote(
  id,
  code (NC-YYYYMMDD-XXXX),
  customer_id (FK),
  issued_at,
  issued_by (FK→User),
  total_bs,
  status DERIVADO (ver MD-019),
  notes
)
```
Y `Sale.credit_note_id` (FK NULL): toda venta a crédito apunta a la nota que la documenta. Una nota agrupa una o más ventas (típicamente 1).
**Consecuencias:** un cliente puede tener múltiples notas (cada compra a crédito). El histórico de compras del cliente es `JOIN CreditNote → Sale`.

## MD-017 · Saldo derivado

**Contexto:** E2.
**Decisión:** `CreditNote.balance_bs` es **derivado**, no almacenado:
```
balance = SUM(SaleItem * qty in note's sales) - SUM(CreditNotePayment.amount)
```
Materializado como vista o columna mantenida por trigger. Nunca como valor mutable libre.
**Consecuencias:** elimina la posibilidad de divergencia. El campo actual `DebtItem.deuda_total` desaparece.

## MD-018 · `CreditNotePayment`

**Contexto:** E4.
**Decisión:**
```
CreditNotePayment(
  id, credit_note_id (FK),
  amount, currency, exchange_rate_snapshot,
  payment_method_id (FK),     -- método con que se cobró el abono
  cashier_id (FK→User),       -- quién recibió el dinero
  received_at,
  reference, bank, notes,
  created_at
)
```
**Consecuencias:** auditoría completa: el abono ya no es un objeto suelto, queda asociado a un cajero y un método. El cierre de caja puede sumar abonos cobrados en el turno.

## MD-019 · Estado de la nota: derivado

**Contexto:** E5.
**Decisión:** estado calculado en runtime/vista, nunca almacenado:
- `saldada` si `balance ≤ 0`
- `vencida` si días desde `issued_at` > `Settings.dias_alerta_morosidad`
- `por_vencer` si días entre umbral y umbral menos N (configurable)
- `vigente` en otro caso

## MD-020 · Umbrales en `Settings`

**Decisión:** `Settings.dias_alerta_morosidad`, `Settings.limite_deuda_global`, `Settings.stock_minimo_global`, `Settings.iva_default` se aplican efectivamente. Hoy están definidos pero no usados (ver §7.5 del relevamiento).

## MD-021 · `CashierShift` única

**Contexto:** F1.
**Decisión:** una sola tabla con apertura y cierre. Campos de cierre nullable hasta cerrar.
```
CashierShift(
  id, code (CIERRE-YYYYMMDD-XXXX),
  cashier_id (FK→User),
  opened_at NOT NULL,
  initial_amount_bs, initial_amount_usd,
  closed_at NULL,
  -- todos los campos de cierre actuales como nullable:
  subtotal_productos, total_venta, efectivo_bs, efectivo_usd,
  punto_venta, pago_movil, abonos_recibidos, total_caja,
  diferencia, estado_cuadre,
  exchange_rate_at_close,
  ...
)
```
**Estado:** derivado por presencia de `closed_at`. Índice parcial `WHERE closed_at IS NULL` para encontrar turnos abiertos rápido.

## MD-022 · `Sale.shift_id NOT NULL`

**Contexto:** F2.
**Decisión:** toda venta debe pertenecer a un turno abierto. Si no hay turno abierto del cajero, el POS bloquea (ya está en el flujo de requerimientos).

## MD-023 · `PartialClosure` y `ShiftDistribution`

**Contexto:** F3.
**Decisión:** los arrays JSON actuales (`cierresParciales`, `distribucion`) se promueven a tablas:
- `PartialClosure(id, shift_id, name, efectivo_bs, efectivo_usd, punto_venta, pago_movil, abonos, total, occurred_at)`
- `ShiftDistribution(id, shift_id, recipient_user_id (FK→User NULL), recipient_name (string si externo), amount_bs, notes)`

## MD-024 · Usuario con `active` y password hasheado

**Decisión:** `User(id, name, email UNIQUE, role, password_hash, active, created_at, updated_at)`. `password_hash` con bcrypt/argon2. `active` permite el flujo "cuenta desactivada" del requerimiento §2.

## MD-025 · Auditoría universal

**Decisión:** todas las tablas de dominio tienen `created_at`, `updated_at`. Las que registren eventos económicos también `created_by` (FK→User).
**No incluido en v1:** registro detallado de qué cambió (ver MD-030).

## MD-026 · UUID + código legible

**Decisión:** PK = UUID v7 (ordenable por tiempo). Los códigos humanos (`VTA-YYYYMMDD-XXXX`, `CIERRE-…`, `NC-…`) van como columna `code` con `UNIQUE NOT NULL`.
**Consecuencias:** elimina riesgo de colisión de los IDs aleatorios actuales. Los códigos siguen siendo legibles para usuarios (impresiones, búsquedas).

---

## ADRs pendientes

### MD-027 · IVA · ⏸ Pendiente

**Estado:** sin decidir. El POS actual no aplica IVA aunque el campo existe en `Settings`.

**Preguntas a resolver antes de modelar:**

1. ¿El IVA va por línea o por venta?
2. ¿Existen productos exentos? Si sí, `iva_pct` por producto y no global.
3. ¿Los precios mostrados en la UI son **brutos** (con IVA incluido, "precio al público") o **netos** (sin IVA, se suma al final)?
4. ¿Se imprime desglose en el comprobante (`subtotal_neto`, `iva_monto`, `total_bruto`)?
5. ¿IVA por método de pago varía? (Algunos países sí lo hacen.)

**Implicaciones según opción:**
- **Por línea:** `SaleItem` necesita `iva_pct`, `iva_amount`, `subtotal_neto`. Reportes de IVA cobrado son sumas directas.
- **Por venta:** `Sale` lleva `iva_pct`, `iva_amount`, `subtotal_neto`. Más simple pero no soporta IVAs mixtos en una misma venta.
- **Producto con exento/gravado:** `Product.iva_pct NULL`-defaulted, `SaleItem` hereda del producto al momento (snapshot vía MD-006/008).

**Mientras esté pendiente:** el schema reservará columnas nullable para IVA (`Sale.iva_amount`, `SaleItem.iva_pct`) que se llenan cuando se decida.

### MD-028 · Anulaciones / devoluciones · 🚀 v2

**Decisión inicial:** no se modela en v1. Las ventas son inmutables.
**Reservas en el schema:** `Sale.status` con valor único `completed` por ahora; preparado para extender a `cancelled`, `refunded` en v2 con `cancelled_at`, `cancelled_by`, `refund_id`.

### MD-029 · Suppliers / Purchases · 🚀 v2

**Decisión inicial:** no se modela en v1. Las entradas a inventario en v1 se registran como `InventoryMovement(type='inventario_inicial' | 'ajuste_positivo')`.
**Preparación:** `InventoryMovement.reference_type`/`reference_id` permite asociar el movimiento a una compra futura sin alterar el schema base.

### MD-030 · `AuditLog` detallado · 🚀 v2

**Decisión inicial:** auditoría básica vía `created_at`/`updated_at`/`created_by` (MD-025). El log granular de cambios (qué columna cambió, valor antes/después) se difiere.

### MD-031 · Centro de Alertas · 🚀 v2

**Decisión inicial:** las alertas (stock bajo, morosidad, tasa stale) se calculan en runtime sobre las tablas existentes en v1. La tabla `Alert` con estado, fecha de creación, fecha de lectura, etc., se difiere.

---

## Próximos pasos

1. Validar las decisiones marcadas 💡 (son recomendaciones técnicas, no instrucciones del producto).
2. Resolver MD-027 (IVA) antes o durante la primera iteración del schema.
3. Producir el ERD/DDL inicial a partir de las decisiones ✅ y 💡 ya validadas.
