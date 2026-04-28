# SISTEMA DE GESTIÓN COMERCIAL — REQUERIMIENTOS CURADOS

### Versión 2.0 | Revisado y completado para producción

---

> **⚠ Notas de alineación con el código actual (rama `final-code`)**
>
> Este documento es la **especificación funcional objetivo**. La implementación vigente difiere en varios puntos:
>
> - **Roles:** este documento usa "Vendedor"/"Dueño". El código usa los identificadores `cajero` y `dueno` (ver `frontend/src/lib/auth.tsx`). "Vendedor" y "cajero" se refieren al mismo rol.
> - **Acceso al POS:** el documento dice que el dueño NO accede al POS. En la implementación actual, el rol `dueno` sí tiene acceso a `/pos` (decisión deliberada para permitir reemplazo del cajero).
> - **Backend/BD:** la sección 5 describe arquitectura objetivo. Hoy no hay backend; todo persiste en `localStorage`.
> - **Terminología "Notas de Crédito":** lo que aquí y en código se llama "fiado", "venta fiada" o "Módulo de Deudas" se redenomina al **dominio "Notas de Crédito"** (ver [`03-decisiones-modelo-datos.md`](03-decisiones-modelo-datos.md), MD-014). Mientras se completa el renombre se mantienen ambos términos en este documento.
> - **Estado real por módulo:** ver [`01-estado-implementacion.md`](01-estado-implementacion.md).

---

## 1. VISIÓN GENERAL DEL SISTEMA

El sistema es una plataforma integral de gestión comercial orientada a negocios minoristas (bodegas, abastos, tiendas de primera necesidad) que requieren control de inventario, facturación individual con cálculo de IVA, gestión de deudas, análisis financiero y administración operativa.

Su diseño está basado en separación clara de roles, control centralizado de información y automatización de procesos críticos:

- Descuento automático de inventario
- Registro estructurado de ventas
- Gestión de pagos múltiples (efectivo BsF, efectivo USD, pago móvil, punto de venta, mixto)
- Cálculo de impuestos (IVA)
- Control de notas de crédito (ventas a crédito a clientes)
- Apertura y cierre diario de caja
- Análisis de desempeño comercial
- Generación de alertas inteligentes con acción directa

El sistema se divide en dos perfiles principales:

- **Vendedor**
- **Dueño**

Cada uno con acceso estrictamente delimitado según sus responsabilidades operativas.

---

## 2. MÓDULO DE AUTENTICACIÓN (LOGIN)

### Objetivo

Controlar el acceso seguro al sistema y redirigir según rol asignado.

### Funcionalidad

- Validación de usuario
- Validación de contraseña
- Verificación de estado activo (usuario habilitado/deshabilitado)
- Identificación de rol

### Redirección Automática

- **Vendedor** → POS + Inventario (modo consulta)
- **Dueño** → Panel Administrativo completo (sin acceso al POS)

### Consideraciones

- Si el usuario está desactivado, mostrar mensaje: _"Tu cuenta está desactivada. Contacta al administrador."_
- Sesión con token de expiración configurable.
- La tasa del día vigente debe cargarse automáticamente al iniciar sesión.

---

## 3. ESTRUCTURA DEL ROL VENDEDOR

El vendedor opera únicamente en entorno de ventas y consulta.

---

### 3.1 Barra Superior — Indicador de Tasa del Día

**NUEVO — Crítico para operación venezolana**

En todo momento durante la sesión del vendedor, debe ser visible:

- Tasa del día vigente (Bs/USD)
- Fecha de última actualización de la tasa
- Indicador visual si la tasa tiene más de 24 horas sin actualizarse (alerta amarilla)

---

### 3.2 Inventario — Vista Operativa

#### Objetivo

Permitir consulta rápida de productos disponibles para agregar al POS.

#### Visualización

- Lista de productos con buscador dinámico
- Vista tipo lista o tipo catálogo (toggle)
- Información visible por producto:
  - Nombre del producto
  - ID / código
  - Stock disponible
  - Precio en Bolívares (Bs)
  - Precio en Dólares (USD)

#### Permisos

**Permitido:**

- Consultar productos
- Consultar stock
- Consultar precios en ambas monedas
- Enviar producto al POS

**No permitido:**

- Crear productos
- Editar productos
- Ajustar stock manualmente
- Ver costos o márgenes
- Acceder a analíticas o reportes

---

### 3.3 POS (Punto de Venta)

#### Objetivo

Registrar ventas de forma estructurada, rápida y automatizada.

#### Estructura de Pantalla

**Sección izquierda — Catálogo:**

- Listado de productos con buscador
- Filtros por categoría
- Precio visible en Bs y USD
- Indicador de stock disponible
- Tasa del día visible en la parte superior

**Sección derecha — Carrito:**

- Productos agregados con cantidad editable
- Subtotal por producto en ambas monedas
- Total general en Bs y USD
- Conversión automática según tasa del día
- Botones de método de pago:
  - Efectivo Bs
  - Efectivo USD
  - Pago Móvil
  - Punto de Venta
  - Mixto
  - Nota de crédito _(nuevo — anteriormente "Fiado")_
- Botón de Cierre de Caja _(solo visible si hay caja abierta)_

---

#### FLUJO COMPLETO DE VENTA

**Paso 1 — Selección de productos**

- El vendedor busca o selecciona productos desde el catálogo.
- Al hacer clic en un producto se agrega al carrito.
- Puede ajustar la cantidad directamente en el carrito.
- Si el stock es insuficiente, mostrar alerta: _"Stock insuficiente. Disponible: X unidades."_

**Paso 2 — Revisión del carrito**

- El sistema calcula automáticamente subtotales y total general en Bs y USD.
- El vendedor puede eliminar productos del carrito.
- Se muestra el IVA calculado sobre el total.

**Paso 3 — Selección de método de pago**
El vendedor selecciona uno de los siguientes métodos:

- **Efectivo Bs** → Ingresar monto recibido → Sistema calcula vuelto en Bs.
- **Efectivo USD** → Ingresar monto recibido en USD → Sistema calcula vuelto en USD y equivalente en Bs.
- **Pago Móvil** → Ver flujo 3.3.A
- **Punto de Venta** → Ingresar últimos 4 dígitos de referencia → Confirmar monto.
- **Mixto** → Ver flujo 3.3.B
- **Nota de crédito** → Ver flujo 3.3.C

**Paso 4 — Confirmación de venta**

- El sistema muestra pantalla de resumen con:
  - Productos vendidos
  - Total cobrado
  - Método de pago utilizado
  - Vuelto (si aplica)
  - Nombre del vendedor
  - Fecha y hora
- Botón: _"Confirmar Venta"_

**Paso 5 — Post-confirmación**

- Descuento automático del inventario.
- Registro de la venta en el historial con: productos, cantidades, precios, método de pago, vendedor, fecha/hora.
- Envío automático al cierre de caja activo.
- Pantalla regresa al POS limpio para nueva venta.
- Opción de imprimir o enviar recibo (si aplica).

---

#### FLUJO 3.3.A — PAGO MÓVIL

1. El vendedor selecciona "Pago Móvil".
2. Sistema muestra modal con:
   - Número de cuenta destino (configurado por el dueño)
   - Monto a pagar en Bs
   - Campo: Número de referencia (ingresado por el vendedor)
   - Campo: Banco origen
   - Campo: Número de teléfono del cliente (opcional)
3. Vendedor ingresa la referencia recibida.
4. Sistema registra la transacción con estado: _"Pendiente de verificación"_ o _"Confirmado"_ según configuración.
5. Confirmación de venta y registro en cierre de caja.

---

#### FLUJO 3.3.B — PAGO MIXTO

**NUEVO — Flujo crítico**

1. El vendedor selecciona "Mixto".
2. Sistema muestra modal con el total de la venta en Bs y USD.
3. El vendedor selecciona cuántos métodos combinará (mínimo 2, máximo 3).
4. Por cada método seleccionado, se muestra un campo de monto:
   - Efectivo Bs: campo de monto
   - Efectivo USD: campo de monto (convertido automáticamente)
   - Pago Móvil: campo de referencia + monto
   - Punto de Venta: campo de referencia + monto
5. El sistema valida en tiempo real que la suma de los montos ingresados sea igual al total de la venta. Muestra: _"Falta: Bs X"_ o _"Excede: Bs X"_ hasta que cuadre.
6. Al cuadrar el monto, se habilita el botón _"Confirmar Pago Mixto"_.
7. Cada método de pago queda registrado individualmente en el cierre de caja.

---

#### FLUJO 3.3.C — VENTA CON NOTA DE CRÉDITO

**NUEVO — Flujo crítico**

> Anteriormente "Venta Fiada". El método de pago se nombra **"Nota de crédito"** en la UI; en código aún figura como `'fiado'` (renombre pendiente).

1. El vendedor selecciona "Nota de crédito".
2. Sistema muestra modal con buscador de clientes registrados.
3. Si el cliente existe:
   - Se muestra nombre, saldo pendiente actual (suma de notas vigentes) y límite de crédito configurado.
   - Si la nueva nota supera el límite: mostrar advertencia. El dueño debe haberlo autorizado previamente o el sistema bloquea.
   - Vendedor confirma la emisión de la nota.
4. Si el cliente no existe:
   - Opción de registrar cliente nuevo con: nombre, teléfono, cédula (opcional).
   - Continuar con la emisión de la nota.
5. Sistema registra:
   - Venta con método de pago "Nota de crédito"
   - Nota de crédito asociada al cliente, con sus productos y monto
   - Fecha de emisión
6. La nota queda reflejada en el Módulo de Notas de Crédito del dueño.
7. El vendedor ve confirmación: _"Nota de crédito registrada a nombre de [Cliente]."_

---

### 3.4 Apertura de Caja (Vendedor)

**NUEVO — Flujo crítico**

Cada vez que un vendedor inicia su turno debe abrir la caja antes de poder realizar ventas.

#### Flujo de Apertura

1. Al ingresar al POS, si no hay caja abierta para ese turno, el sistema muestra obligatoriamente la pantalla de apertura.
2. El vendedor ingresa:
   - Monto de efectivo inicial en Bs (fondo de caja)
   - Monto de efectivo inicial en USD (si aplica)
3. Confirma la apertura.
4. Sistema registra: vendedor, fecha, hora de apertura, montos iniciales.
5. POS queda habilitado para operar.

#### Restricción

- No se puede realizar ninguna venta sin caja abierta.
- Solo puede haber una caja abierta por vendedor a la vez.

---

### 3.5 Cierre de Caja (Vendedor)

El vendedor puede cerrar su caja al finalizar su turno desde el botón visible en el POS.

#### Flujo de Cierre

1. Vendedor hace clic en "Cierre de Caja".
2. Sistema muestra resumen del turno:
   - Total de ventas realizadas
   - Desglose por método de pago
   - Total de abonos recibidos (si aplicó)
   - Monto inicial de apertura
   - Total esperado en efectivo Bs
   - Total esperado en efectivo USD
3. El vendedor ingresa el monto físico contado en caja (arqueo):
   - Efectivo Bs contado
   - Efectivo USD contado
4. Sistema calcula diferencia: sobrante o faltante.
5. Vendedor confirma el cierre.
6. Sistema registra el cierre con todos los datos y lo envía al panel del dueño.
7. POS queda bloqueado hasta nueva apertura.

---

## 4. ESTRUCTURA DEL ROL DUEÑO

El dueño posee acceso administrativo integral. No tiene acceso al POS.

---

### 4.1 Inventario — Gestión Completa

#### Funcionalidades

- Crear productos con: nombre, categoría, SKU/código, precio de venta Bs, precio de venta USD, costo, stock inicial, stock mínimo de alerta, imagen (opcional)
- Editar productos existentes
- Ajuste manual de stock con motivo registrado (pérdida, corrección, vencimiento)
- Historial completo de movimientos de inventario (entradas, salidas, ajustes)
- Consultar precios, costos y márgenes
- Control de inventario en ambas monedas con conversión automática
- Carga masiva desde archivo Excel (.xlsx) con plantilla descargable

#### Campos obligatorios por producto

- Nombre
- Categoría
- Precio de venta (Bs)
- Stock inicial
- Stock mínimo (para alerta)

#### Campos opcionales

- SKU / Código
- Precio en USD (si no se ingresa, se calcula automáticamente por tasa)
- Costo unitario
- Imagen
- Proveedor asociado

---

### 4.2 Módulo de Notas de Crédito

> Anteriormente "Módulo de Deudas". Ver MD-014 en [`03-decisiones-modelo-datos.md`](03-decisiones-modelo-datos.md).

#### Objetivo

Control estructurado de ventas con nota de crédito (a pagar a futuro), con seguimiento de clientes.

#### Funcionalidades

- Registro y gestión de clientes con límite de crédito individual
- Visualización del saldo pendiente por cliente (suma de notas vigentes)
- Historial de compras con nota de crédito por cliente
- Registro de abonos parciales o totales contra una nota de crédito
- Cálculo automático del saldo de cada nota
- Alertas automáticas por:
  - Límite de crédito superado al emitir una nueva nota
  - Morosidad (nota vigente más allá del umbral configurado)
- Integración automática con cierre de caja (abonos recibidos en el turno)
- Exportación de cartera de notas de crédito en PDF y Excel

#### Estados de la nota de crédito

- Vigente (al día)
- Por vencer (acercándose al umbral de morosidad)
- Vencida (superó el umbral)
- Saldada

---

### 4.3 Módulo de Pago Móvil

#### Función

- Registro manual de transacciones de pago móvil
- Consulta y filtro por fecha, banco, monto o referencia
- Verificación de referencias duplicadas (alerta si una referencia ya fue usada)
- Historial mensual exportable
- Integración con ventas registradas desde el POS

---

### 4.4 Cierres de Caja — Vista del Dueño

#### Objetivo

Control financiero diario consolidado de todos los turnos y vendedores.

#### Información mostrada por cierre

- Vendedor responsable
- Fecha y hora de apertura y cierre
- Cantidad de ventas realizadas
- Desglose por método de pago:
  - Efectivo Bs
  - Efectivo USD
  - Pago Móvil
  - Punto de Venta
- Total de abonos de deudas recibidos
- Monto inicial de apertura
- **Total que DEBERÍA haber en caja** (calculado automáticamente)
- **Total que el vendedor reportó** (arqueo)
- **Diferencia: sobrante o faltante** (resaltado en verde o rojo)

#### Funcionalidades

- Vista de todos los cierres con filtros por período, vendedor, fecha
- Comparación entre cierres de diferentes fechas
- Exportación en PDF y Excel
- Posibilidad de agregar nota/observación al cierre

---

### 4.5 Usuarios y Permisos

#### Funcionalidades

- Creación de usuarios con: nombre, usuario, contraseña, rol
- Asignación de rol (Vendedor / Dueño)
- Activación y desactivación de usuarios
- Cambio de contraseña
- Visualización de actividad reciente por usuario (última sesión, ventas del día)

---

### 4.6 Proveedores

#### Funcionalidades

- Registro de proveedores con: nombre, RIF, teléfono, correo, productos que suministra
- Asociación de productos al proveedor
- Registro de compras con: proveedor, productos, cantidades, precios de costo, fecha
- Incremento automático del inventario al registrar una compra
- Historial de compras por proveedor
- Exportación del historial

---

### 4.7 Analíticas (Dashboard Ejecutivo)

#### Indicadores principales

- Ventas totales del día / semana / mes
- Ganancias brutas y netas por período
- Productos más vendidos (ranking)
- Productos de baja rotación
- Día y franja horaria con mayor facturación
- Ventas por método de pago (gráfico)
- Comparación de períodos (este mes vs mes anterior)

#### Capacidades

- Filtros por período personalizable
- Visualización en gráficos de barras, líneas y torta
- Exportación de datos en Excel y PDF

---

### 4.8 Módulo de Costos

#### Objetivo

Control de rentabilidad por producto.

#### Indicadores por producto

- Costo unitario
- Precio de venta
- Ganancia por unidad (Bs y USD)
- Ganancia por lote vendido
- Porcentaje de margen
- Conversión automática según tasa vigente

#### Funcionalidades adicionales

- Simulador de precio: el dueño ingresa un margen deseado y el sistema sugiere el precio de venta
- Alerta automática si el margen de un producto cae por debajo del mínimo configurado

---

### 4.9 Reportes Exportables

#### Tipos de reportes

- Ventas (por período, vendedor, método de pago)
- Ganancias (brutas y netas)
- Inventario (stock actual, movimientos)
- Productos destacados (más vendidos, menos vendidos)
- Notas de crédito (cartera completa, por cliente, vencidas)
- Cierres de caja (por período, por vendedor)
- Proveedores e historial de compras

#### Formatos disponibles

- PDF
- Excel (.xlsx)

---

### 4.10 Alertas Inteligentes

#### Generadas automáticamente por

| Alerta                           | Acción directa al hacer clic      |
| -------------------------------- | --------------------------------- |
| Stock bajo                       | Ir al producto en inventario      |
| Productos sin rotación en X días | Ir al producto en inventario      |
| Margen negativo en producto      | Ir al módulo de costos            |
| Deuda crítica de cliente         | Ir al cliente en módulo de deudas |
| Morosidad prolongada (+30 días)  | Ir al cliente en módulo de deudas |
| Tasa no actualizada (+24h)       | Ir a configuración general        |
| Comportamiento de venta atípico  | Ir a analíticas                   |
| Diferencia en cierre de caja     | Ir al cierre correspondiente      |

#### Características

- Centro de notificaciones accesible desde cualquier pantalla del dueño
- Marcado de alertas como leídas / resueltas
- Historial de alertas pasadas

---

### 4.11 Configuración General

#### Parámetros ajustables

- **Tasa del día** (Bs/USD) — con fecha y hora de última actualización
- **IVA** — porcentaje aplicable (configurable, por defecto 16%)
- **Límite máximo de deuda** global y por cliente
- **Métodos de pago habilitados** (activar/desactivar por el dueño)
- **Datos del negocio** (nombre, RIF, dirección, teléfono)
- **Imagen corporativa** (logo para reportes y recibos)
- **Datos de cuenta para pago móvil** (banco, número, cédula/RIF titular)
- **Stock mínimo global** (umbral default para alertas de stock bajo)
- **Días para alerta de morosidad** (default: 30 días)

---

## 5. ARQUITECTURA TECNOLÓGICA

---

> **Nota sobre el estado actual:** lo que aparece a continuación es la **arquitectura objetivo**. La implementación vigente (rama `final-code`) solo tiene frontend, sin backend ni base de datos — la persistencia es en `localStorage`. Ver [`01-estado-implementacion.md`](01-estado-implementacion.md) para el detalle.

### 5.1 Frontend

**Tecnología actual:** React 19 + Vite 6 + TypeScript + HeroUI 3 + Tailwind 4 + react-router-dom 7.

**Capacidades clave:**

- Componentes reutilizables y modulares
- Navegación y rutas protegidas por rol (implementado vía `canAccessPath` en `lib/auth.tsx`)
- Estado global mediante Context API de React (no se usa Zustand/Redux)
- Visualización de analíticas (pendiente: librería de gráficas no integrada aún)
- Experiencia fluida en POS (optimizada para uso continuo)
- Soporte responsive para tablets (uso en mostrador)

---

### 5.2 Backend

**Tecnología objetivo:** Node.js + Express (servicio RESTful).

**Estado actual:** **no hay backend activo.** Existe una API Express legacy bajo `__old/backend/` que no es consumida por el frontend actual. Todas las operaciones se resuelven en el cliente contra `localStorage`.

**Características objetivo:**

- API RESTful estructurada por módulos
- Autenticación y control de sesiones
- Control de permisos por rol en cada endpoint
- Validación centralizada de datos
- Arquitectura preparada para crecimiento futuro

---

### 5.3 Base de Datos

**Tecnología objetivo:** por definir (PostgreSQL candidata).

**Estado actual:** persistencia en `localStorage` del navegador (claves prefijadas con `abasto.*`). Los datos demo iniciales viven en `frontend/src/mocks/`.

**Entidades a modelar (alto nivel):**

- usuarios y roles
- productos, categorías y movimientos de inventario
- ventas y detalle de ventas (incluye métodos de pago)
- clientes, deudas y abonos
- cierres de caja y aperturas de caja
- proveedores y compras
- alertas y configuración

---

### 5.4 Infraestructura

**Entorno recomendado (nube):**

- Base de datos segura con backups automáticos
- Backend escalable (Railway, Render o DigitalOcean)
- Almacenamiento de imágenes (Cloudinary o S3)
- Alta disponibilidad y crecimiento progresivo

---

## 6. FLUJOS CRÍTICOS RESUMEN

Esta sección es una referencia rápida de los flujos que deben estar 100% desarrollados y probados antes de producción:

| #   | Flujo                              | Módulo                | Prioridad |
| --- | ---------------------------------- | --------------------- | --------- |
| 1   | Login → redirección por rol        | Autenticación         | 🔴 Alta   |
| 2   | Apertura de caja                   | POS - Vendedor        | 🔴 Alta   |
| 3   | Venta con pago simple              | POS - Vendedor        | 🔴 Alta   |
| 4   | Venta con pago mixto               | POS - Vendedor        | 🔴 Alta   |
| 5   | Venta con pago móvil               | POS - Vendedor        | 🔴 Alta   |
| 6   | Venta con nota de crédito desde POS| POS - Vendedor        | 🔴 Alta   |
| 7   | Cierre de caja                     | POS - Vendedor        | 🔴 Alta   |
| 8   | Vista de cierre por dueño          | Cierres - Dueño       | 🔴 Alta   |
| 9   | Registro de abono a nota de crédito| Notas de Crédito - Dueño | 🟠 Media  |
| 10  | Creación y edición de productos    | Inventario - Dueño    | 🟠 Media  |
| 11  | Carga masiva de inventario (Excel) | Inventario - Dueño    | 🟠 Media  |
| 12  | Registro de compra a proveedor     | Proveedores - Dueño   | 🟠 Media  |
| 13  | Alerta → acción directa            | Alertas - Dueño       | 🟡 Normal |
| 14  | Exportación de reportes            | Reportes - Dueño      | 🟡 Normal |
| 15  | Configuración de tasa del día      | Configuración - Dueño | 🔴 Alta   |

---

## 7. CONCLUSIÓN ESTRATÉGICA

Este sistema no es únicamente un punto de venta. Es una plataforma integral de control comercial diseñada específicamente para el contexto operativo venezolano, con enfoque en:

- Operación en doble moneda (Bs y USD) con tasa configurable
- Automatización de procesos críticos
- Control financiero diario con trazabilidad completa
- Prevención de pérdidas mediante alertas inteligentes
- Análisis estratégico para decisiones del dueño
- Escalabilidad tecnológica

Su estructura modular permite crecer hacia:

- Multi-sucursales
- Integración con comercio electrónico
- Control centralizado de múltiples negocios
- Analítica predictiva
- Microservicios independientes

Está diseñado para operar con precisión en el presente y escalar con visión empresarial hacia el futuro.
