# 04 — Scope de modelo de datos para discusión con el cliente

> Documento de discusión. Reúne todo lo analizado del relevamiento del código y la conversación de modelado. Orientado a alinearse con el cliente antes de producir el schema final.
>
> **Tres bloques:**
>
> 1. **Decisiones ya tomadas** — el cliente las confirmó; informativas.
> 2. **Propuestas técnicas** — el equipo recomienda; el cliente debe **validar o redireccionar**.
> 3. **Preguntas abiertas** — el cliente debe **responder** antes de poder modelar.
>
> Al final se listan los temas postergados a v2 y los próximos pasos.
>
> Trazabilidad: cada bloque referencia el ADR correspondiente en [`03-decisiones-modelo-datos.md`](03-decisiones-modelo-datos.md).

---

## Índice

1. [Decisiones confirmadas](#1-decisiones-confirmadas-por-el-cliente)
2. [Propuestas técnicas pendientes de validación](#2-propuestas-técnicas-pendientes-de-validación)
3. [Preguntas abiertas (bloqueantes)](#3-preguntas-abiertas-bloqueantes)
4. [Temas postergados a v2](#4-temas-postergados-a-v2)
5. [Próximos pasos](#5-próximos-pasos)
6. [Glosario y mapa de renombre](#6-glosario-y-mapa-de-renombre)

---

## 1. Decisiones confirmadas por el cliente

Estas decisiones están firmes; figuran aquí para contexto.

### 1.1 Una sola tienda en v1, schema clonable a multi-sucursal · MD-001

El producto inicial sirve a una sola tienda. El schema se diseña para clonarse por sucursal cuando llegue ese momento. **No** se agrega `store_id` a las tablas en v1.

> **Implicación a futuro:** la migración a multi-sucursal agregará `store_id NOT NULL` con backfill al "store original". Los códigos legibles (`VTA-…`, `CIERRE-…`) requerirán prefijo de sucursal.

### 1.2 Productos como entidad real · MD-003

`Product` deja de ser un mock estático. Se convierte en entidad persistente con CRUD completo (crear, editar, listar, desactivar). Al implementar el backend, los datos de demo se migrarán como inventario inicial.

### 1.3 Stock con historial de movimientos · MD-004

El stock **no** se guarda como un número mutable en el producto. Se construye a partir de un libro mayor de movimientos (`InventoryMovement`) con tipos: compra, venta, ajuste positivo/negativo, merma, devolución, inventario inicial.

> **Beneficio:** se puede reconstruir el stock de cualquier producto a cualquier fecha pasada. Se puede auditar por qué cambió. La carga inicial por Excel se modela como un batch de movimientos de tipo "inventario inicial".

### 1.4 Categorías como tabla · MD-005

Las categorías de productos pasan de strings sueltos ("Granos", "Pastas"…) a una tabla `Category`. Esto permite reordenarlas, traducirlas o crear jerarquías sin tocar el schema.

### 1.5 Historial de precios y costos · MD-006, MD-007

Cada vez que cambia el precio o el costo de un producto, se cierra la fila vigente y se inserta una nueva. Las líneas de venta apuntan a la fila histórica que estaba vigente al momento de vender.

> **Beneficio:** los reportes de margen y ganancia históricos son fieles aunque hoy se modifiquen los precios o costos.

### 1.6 Líneas de venta con referencia histórica · MD-008

Cada línea de una venta (`SaleItem`) guarda:

- A qué producto refiere.
- A qué precio histórico se vendió.
- A qué costo histórico estaba el producto en ese momento.
- Una copia del nombre del producto (por si el producto se borra o renombra).

### 1.7 Dos tasas de cambio: BCV y Paralelo · MD-012

El sistema maneja **ambas tasas** en paralelo. Cada venta y cada movimiento que requiera conversión guarda **ambas** como snapshot.

### 1.8 Renombrado del dominio: "Notas de Crédito" · MD-014

Lo que el código actual y los requerimientos antiguos llaman "fiado", "venta fiada" o "Módulo de Deudas" se renombra al término del cliente: **"Notas de Crédito"**.

| Antes | Ahora |
|---|---|
| Módulo de Deudas | Módulo de Notas de Crédito |
| Venta fiada | Venta con nota de crédito |
| Método de pago "Fiado" | Método de pago "Nota de crédito" |
| Cliente con deuda | Cliente con nota de crédito vigente |
| Abono | Pago a nota de crédito |

> **Aplicación:** ya está aplicado en toda la documentación. En el código del frontend se mantiene el nombre antiguo (`Debts.tsx`, `DebtItem`, `'fiado'`) hasta la migración al backend.

### 1.9 Cliente como entidad propia · MD-015

El cliente no se mezcla con la nota de crédito. El cliente que paga al contado **no se registra**: es solamente una venta sin cliente asociado. El cliente solo se crea cuando se le emite la primera nota.

### 1.10 Sale apunta a la nota de crédito · MD-016

La venta a crédito tiene una FK directa a la nota (`Sale.credit_note_id`). Una nota agrupa una o más ventas (típicamente una). La nota tiene su propio código (`NC-YYYYMMDD-XXXX`).

---

## 2. Propuestas técnicas pendientes de validación

Estas son recomendaciones del equipo. **Cada una necesita un OK explícito o una contrapropuesta del cliente.**

### 2.1 Pagos múltiples como tabla `SalePayment` · MD-009

**Propuesta:** una venta tiene **N filas** en `SalePayment`.

- Pago simple = 1 fila.
- Pago mixto = 2 o 3 filas.
- Venta a crédito = 1 fila con método "Nota de crédito".

Cada fila guarda: método, monto, moneda original (Bs o USD), tasa snapshot, referencia (para pago móvil), banco, cajero que recibió.

**Por qué importa:**

- El "mixto" deja de ser un método de pago especial: simplemente significa "esta venta tiene más de un pago".
- Los reportes de "cuánto cobré por método" son sumas directas.
- El arqueo de caja se hace sobre esta tabla.

**Pregunta al cliente:** ¿OK con que "Mixto" desaparezca como método de pago y pase a ser "una venta con varios pagos"?

### 2.2 Métodos de pago como tabla · MD-010

**Propuesta:** los métodos de pago no son un enum fijo; viven en una tabla `PaymentMethod` con catálogo: efectivo BS, efectivo USD, pago móvil, punto de venta, nota de crédito, tarjeta.

**Por qué importa:**

- Agregar un método nuevo (ej: "Zelle", "Binance Pay") no requiere cambio de schema, solo una fila nueva.
- "Métodos habilitados" en Configuración pasa a ser una columna `active` en la tabla.

**Pregunta al cliente:** ¿hay métodos adicionales previstos a futuro? (Zelle, criptomonedas, transferencia bancaria…)

### 2.3 Multi-moneda: Bs como moneda funcional · MD-011

**Propuesta:**

- Bs es la **moneda contable**. Todos los reportes financieros suman en Bs.
- Cada **pago físico** se preserva en su moneda original (un billete USD se rastrea como USD; un pago móvil como Bs).
- La tasa aplicada queda como snapshot en cada movimiento.

**Por qué importa:** refleja la realidad del comercio venezolano. La caja física tiene billetes en ambas monedas y hay que arquearlas por separado, pero la contabilidad necesita una sola moneda.

**Pregunta al cliente:** ¿es Bs efectivamente la moneda funcional del negocio, o el cliente prefiere ver todos los reportes principales en USD?

### 2.4 Saldo de la nota: derivado, no almacenado · MD-017

**Propuesta:** el saldo pendiente de una nota de crédito **no se guarda** en una columna; se calcula como:

```
saldo = monto de la nota − suma de pagos a la nota
```

**Por qué importa:**

- Hoy (en `localStorage`) el campo `deuda_total` se mantiene a mano y puede divergir de la realidad.
- Derivar el saldo elimina por construcción la posibilidad de divergencia.
- Tiene un costo mínimo en performance que es inapreciable a la escala del negocio.

**Pregunta al cliente:** ninguna; es decisión técnica. Se informa para transparencia.

### 2.5 Abonos con método de pago y cajero responsable · MD-018

**Propuesta:** cada abono a una nota registra:

- Método de pago (efectivo BS, efectivo USD, pago móvil, etc.).
- Cajero que recibió el dinero.
- Moneda y tasa aplicada si fue en USD.
- Referencia/banco si fue por pago móvil.

**Por qué importa:** sin esto, no se puede auditar si el dinero del abono efectivamente entró a la caja del cajero ni se puede integrar al cierre del turno.

**Pregunta al cliente:** ¿OK con que un abono pase a tener los mismos campos que un pago de venta (porque, en esencia, lo es)?

### 2.6 Estado de la nota: derivado · MD-019

**Propuesta:** los estados (`vigente`, `por vencer`, `vencida`, `saldada`) se calculan en runtime según el saldo y los días desde la emisión. No se almacenan.

**Pregunta al cliente:** ¿cuáles son los **umbrales exactos** que definen "por vencer" y "vencida"? Hoy el código usa hardcoded (≥20 días = por vencer, >30 días = vencida).

### 2.7 Umbrales en Configuración, no hardcodeados · MD-020

**Propuesta:** los siguientes valores viven en `Settings` (Configuración) y son ajustables por el dueño:

- Días para considerar una nota "por vencer".
- Días para considerar una nota "vencida".
- Stock mínimo global (umbral de alerta).
- Límite de crédito por defecto (al crear un cliente nuevo).

**Pregunta al cliente:** ¿son estos umbrales globales o por cliente individual? (Por ejemplo, ¿cliente A tiene 30 días de gracia y cliente B tiene 15?)

### 2.8 Turno de caja como una sola entidad (apertura + cierre) · MD-021

**Propuesta:** una tabla `CashierShift` con campos de apertura (`opened_at`, monto inicial) y campos de cierre (`closed_at`, totales, diferencia). Mientras `closed_at` está vacío, el turno está abierto.

**Por qué importa:**

- Un cierre nunca existe sin apertura. Tenerlos en tablas separadas sería artificial.
- "¿Hay turno abierto del cajero X?" se responde con un `WHERE closed_at IS NULL`.

**Pregunta al cliente:** ¿puede haber **dos cajeros operando simultáneamente** en cajas distintas? Si sí, ¿cada caja física tiene su propio turno o el turno es por persona?

### 2.9 Cada venta pertenece a un turno · MD-022

**Propuesta:** `Sale.shift_id` es obligatorio. Si el cajero no tiene turno abierto, el POS bloquea la venta (esto ya está en los requerimientos).

**Por qué importa:** sin esto, un cierre de caja no puede saber qué ventas debe consolidar. Hoy el código suma "todas las ventas del día" sin filtrar por cajero, lo que falla con dos cajeros simultáneos.

### 2.10 Cierres parciales y distribución como tablas · MD-023

**Propuesta:** los cierres parciales (cortes intermedios del turno) y la distribución (a quién se entrega el dinero al cerrar) pasan de ser arrays JSON a tablas propias.

**Pregunta al cliente:** ¿cuándo se hace un "cierre parcial"? ¿Es un corte para contar caja sin cerrar el turno? ¿Lo dispara el cajero o el dueño? Necesitamos entender el flujo real para confirmar el modelo.

### 2.11 Usuario con estado activo y contraseña hasheada · MD-024

**Propuesta:** la tabla `User` tiene:

- `active` (booleano) — permite el flujo de "cuenta desactivada" del requerimiento §2.
- `password_hash` — la contraseña se guarda como hash (bcrypt o argon2), nunca en texto plano.

**Pregunta al cliente:** ¿se necesita auto-recuperación de contraseña (vía email) o el dueño la resetea manualmente?

### 2.12 Auditoría básica universal · MD-025

**Propuesta:** todas las tablas llevan `created_at` y `updated_at`. Las tablas de eventos económicos (Sale, Payment, InventoryMovement, etc.) llevan también `created_by` (quién lo registró).

**Por qué importa:** trazabilidad mínima sin overhead.

### 2.13 Identificadores: UUID + código humano · MD-026

**Propuesta:**

- La clave primaria interna es UUID (un identificador opaco).
- El código que el usuario ve (`VTA-20260428-1234`, `NC-20260428-0001`, `CIERRE-20260428-0001`) es una columna **separada**, única, generada secuencialmente por día.

**Por qué importa:**

- Los códigos actuales son aleatorios de 4 dígitos por día → con volumen real hay riesgo de colisión.
- UUIDs son inmunes a colisiones y son seguros para sincronización futura entre sucursales.
- Los códigos legibles siguen siendo legibles para usuarios e impresiones.

**Pregunta al cliente:** ¿el formato de los códigos (`VTA-`, `NC-`, `CIERRE-`) está bien? ¿Se quiere algún prefijo distinto?

---

## 3. Preguntas abiertas (bloqueantes)

Estas necesitan respuesta del cliente **antes de cerrar el modelo de datos**.

### 3.1 IVA — ¿Cómo se aplica? · MD-027 ⏸

> Hoy el POS **no calcula IVA**, aunque el campo existe en Configuración. Esto debe resolverse o el schema queda con columnas reservadas pero sin lógica.

Cinco preguntas concretas:

1. **¿El IVA va por línea o por venta?**
   - Por línea: cada producto puede tener su propio IVA (algunos exentos, otros gravados, otros con IVA reducido).
   - Por venta: un único porcentaje se aplica al total.

2. **¿Existen productos exentos o con IVA distinto al estándar?**
   - Si sí → necesita ser por línea, y `Product` lleva el porcentaje de IVA.

3. **¿Los precios mostrados al cliente son brutos o netos?**
   - Brutos (con IVA incluido, "precio al público"): el IVA se calcula desglosado al final solo para el comprobante.
   - Netos (sin IVA): se suma al final.

4. **¿El comprobante de venta debe mostrar el desglose** `subtotal`, `IVA`, `total`?

5. **¿La tasa de IVA es fija (por ej. 16%) o cambia con frecuencia?**
   - Si cambia, ¿se necesita historial (como con precios) para reconstruir IVA de ventas pasadas?

### 3.2 Validaciones de negocio que el código no tiene

El relevamiento mostró que estas reglas no están implementadas. Antes de modelar, conviene confirmar **qué pasa cuando se violan**:

- **Stock insuficiente al vender:** ¿se bloquea la venta? ¿se permite con advertencia? ¿se permite y se registra stock negativo (caso "vendí algo que no había cargado en sistema")?
- **Límite de crédito superado al emitir nota:** ¿se bloquea? ¿requiere autorización del dueño con clave/PIN? ¿se registra la autorización?
- **Tasa de cambio sin actualizar > 24 h:** ¿se permite vender? ¿solo advertencia? ¿bloqueo total?
- **Venta sin turno abierto:** ¿se bloquea? (Es lo que dicen los requerimientos, pero conviene confirmar.)

### 3.3 Roles y permisos

El código actual maneja dos roles: `cajero` y `dueno`. Los requerimientos hablan de "Vendedor" y "Dueño".

- **¿Se necesitan más roles a futuro?** Por ejemplo: supervisor (ve reportes pero no edita), administrador de inventario, contador.
- **¿Se necesitan permisos granulares** (ej: "este cajero puede ver costos pero no editarlos") o el modelo de dos roles fijos es suficiente?
- **¿Un mismo usuario puede tener múltiples roles** o se elige uno?

### 3.4 Datos del cliente en una nota de crédito

¿Qué datos son **obligatorios** para registrar a un cliente al emitir su primera nota?

- Nombre — ¿obligatorio?
- Cédula/RIF — ¿obligatorio? ¿único? ¿se aceptan extranjeros?
- Teléfono — ¿obligatorio?
- Email — ¿se solicita?
- Dirección — ¿se solicita?

### 3.5 Múltiples ventas en una sola nota de crédito

El modelo propuesto permite que una nota de crédito agrupe **N ventas** (`Sale.credit_note_id` apunta a la nota; pueden haber muchas ventas que apunten a la misma nota).

**Pregunta:** ¿se usa este caso? Por ejemplo: "le abro una nota a Pedro y voy cargándole compras durante el mes hasta que paga". O cada venta a crédito genera una nota nueva.

> Esto cambia el flujo del POS: si una nota agrupa varias ventas, hay que decidir cuándo se "cierra" la nota o si se mantiene abierta hasta saldarla.

### 3.6 Precios en USD vs Bs

Hoy los precios del producto se guardan en Bs y la conversión a USD es un cálculo (`price / tasa`).

**Pregunta:** ¿el dueño establece los precios en **Bs o en USD**?

- Si en USD: `Product.price_usd` es la fuente de verdad y el precio en Bs se calcula con la tasa vigente. Esto es lo más común en Venezuela hoy.
- Si en Bs: como está hoy. Pero significa que el precio "real" cambia con la tasa y hay que ajustarlo manualmente cuando la tasa se mueve.

> Esto cambia significativamente `ProductPriceHistory`: si el precio nominal está en USD, no es necesario actualizarlo cuando solo se mueve la tasa.

### 3.7 Cuál de las dos tasas se usa por defecto

El sistema maneja BCV y Paralelo (decidido). ¿Cuál se usa por defecto para:

- Calcular el precio en Bs mostrado al público.
- Convertir un pago en USD a su equivalente en Bs en el cierre de caja.
- Calcular reportes de margen.

¿O el dueño elige la tasa por configuración global, o por venta?

### 3.8 Apertura de caja: ¿se cuenta lo físico?

El requerimiento dice que en la apertura el cajero ingresa el monto inicial. ¿Esto es:

- Un valor declarativo ("inicio con X Bs y Y USD") sin verificación.
- Un arqueo: el dueño deja un monto fijo de "fondo" y el cajero confirma que lo recibió.

Y **al cierre:** ¿el monto inicial se devuelve al fondo o queda en la caja física?

---

## 4. Temas postergados a v2

Decisiones tomadas para **no incluir en el schema inicial** y dejar para una segunda fase.

### 4.1 Anulaciones y devoluciones · MD-028

Las ventas son inmutables en v1. No se puede anular una venta ni hacer devolución parcial. El schema reserva `Sale.status` (que en v1 siempre será `completed`) para extender después.

**Implicación operativa:** si un cajero se equivoca en una venta hoy, no hay forma de corregirla en sistema.

### 4.2 Proveedores y compras · MD-029

No se modela la entidad `Supplier` ni `Purchase` en v1. Las entradas a inventario se registran como movimientos de tipo "ajuste positivo" o "inventario inicial" sin asociarlas a un proveedor.

### 4.3 Audit log detallado · MD-030

Auditoría básica vía `created_at`/`updated_at`/`created_by`, sí. Registro de "qué columna cambió, valor antes/después", no.

### 4.4 Centro de Alertas como tabla · MD-031

Las alertas (stock bajo, morosidad, tasa stale) se calculan en runtime sobre las tablas existentes. La tabla `Alert` con estados leído/no-leído se difiere.

### 4.5 Carga masiva de inventario por Excel

El flujo está priorizado en requerimientos pero no requiere cambios al schema (los movimientos cargados serán filas normales en `InventoryMovement`). Se implementa como funcionalidad, no como modelo.

### 4.6 Reportes exportables (PDF/Excel)

Misma situación: requiere implementación, no schema. Las consultas que alimentarán los reportes ya están cubiertas por las tablas decididas.

---

## 5. Próximos pasos

1. **Reunión de revisión con el cliente** sobre este documento.
2. **Cliente decide** las propuestas de §2 y responde las preguntas de §3.
3. **Equipo produce** el ERD (diagrama entidad-relación) consolidado.
4. **Equipo produce** el DDL inicial (`CREATE TABLE …`) para Postgres.
5. **Plan de migración** del estado actual (`localStorage`) hacia el backend.
6. **Definición de stack del backend** (Node + framework, ORM, despliegue).

---

## 6. Glosario y mapa de renombre

| Término del cliente / negocio | Implementación / código actual | Estado del renombre |
|---|---|---|
| Nota de crédito | `'fiado'` (método de pago) | docs renombrado, código pendiente |
| Módulo de Notas de Crédito | "Módulo de Deudas" (`pages/Debts.tsx`) | docs renombrado, código pendiente |
| Cliente con nota | `DebtItem` | docs renombrado, código pendiente |
| Pago a nota de crédito | `Abono` | docs renombrado, código pendiente |
| Cajero | `cajero` (en código) / "Vendedor" (en requerimientos antiguos) | unificado a "Cajero/Vendedor" |
| Dueño | `dueno` (en código) | sin cambios |
| Turno de caja | `CashierShift` | sin cambios |
| Cierre parcial | `cierresParciales` (array JSON anidado) | se promueve a tabla `PartialClosure` en el modelo |
| Tasa BCV / Tasa Paralelo | hoy una sola tasa (`abasto.exchangeRate.value`) | se introduce el concepto de dos tasas en el modelo |

---

**Documentos relacionados:**

- [`02-relevamiento-codigo.md`](02-relevamiento-codigo.md) — fotografía técnica del código actual.
- [`03-decisiones-modelo-datos.md`](03-decisiones-modelo-datos.md) — ADRs detallados (lectura técnica).
- [`requerimientos.md`](requerimientos.md) — especificación funcional del producto.
