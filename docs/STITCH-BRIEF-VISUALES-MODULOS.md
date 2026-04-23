# Brief del sistema para Stitch (visuales por módulo)

Este documento está diseñado para que Stitch entienda el sistema completo y genere visuales de cada módulo con consistencia visual, funcional y de roles.

## 1) Contexto del sistema

Nombre del producto: **BodegaFlow POS**  
Tipo de sistema: **Plataforma de gestión comercial para bodegas/abastos**  
Usuarios principales:
- **Vendedor**: opera caja y ventas.
- **Dueño**: administra operación, finanzas y configuración.

Problema que resuelve:
- Control de inventario en tiempo real.
- Registro estructurado de ventas con múltiples métodos de pago.
- Gestión de deudas (fiado) y abonos.
- Control de aperturas/cierres de caja.
- Alertas operativas y análisis de desempeño.

## 2) Guía visual global para Stitch

Generar una interfaz tipo **dashboard administrativo + POS operativo**, con:
- Layout limpio, moderno, alta legibilidad.
- Navegación lateral para módulos del dueño.
- Vista POS enfocada en rapidez (catálogo + carrito en dos columnas).
- Jerarquía visual clara para KPIs, tablas y estados.
- Colores sugeridos:
  - Primario: azul oscuro o índigo.
  - Éxito: verde.
  - Advertencia: amarillo.
  - Error/faltante: rojo.
  - Neutros claros para fondos y tarjetas.

Componentes base a reutilizar en todas las visuales:
- Barra superior con usuario activo y tasa del día (Bs/USD).
- Sidebar por módulos (en dueño).
- Tarjetas KPI.
- Tablas con filtros.
- Modales para operaciones críticas (pago, ajuste, confirmación).
- Badges de estado (activo, vencida, stock bajo, pendiente).
- Notificaciones/alertas con severidad.

## 3) Arquitectura funcional (para entender módulos)

Flujo general:
1. Login con validación de credenciales y rol.
2. Redirección por rol:
   - Vendedor -> Inventario operativo + POS + apertura/cierre.
   - Dueño -> Inventario admin + deudas + cierres + analíticas + configuración.
3. Toda venta actualiza inventario y se refleja en cierres/analíticas.
4. Deudas y abonos impactan cartera y reportes.
5. Alertas inteligentes guían acciones (stock bajo, morosidad, etc.).

## 4) Visuales requeridas por módulo

Pide a Stitch **1 pantalla principal por módulo** y, cuando aplique, **1 modal crítico**.

### Módulo 1: Autenticación (Login)
Objetivo:
- Ingreso seguro y redirección por rol.

Visual principal:
- Formulario centrado (usuario, contraseña).
- Selector/indicador de rol detectado.
- Mensajes de error (credenciales inválidas / usuario desactivado).

Estados a mostrar:
- Normal.
- Error credenciales.
- Cuenta desactivada.

---

### Módulo 2: POS (Vendedor)
Objetivo:
- Registrar ventas de forma rápida y confiable.

Visual principal:
- Dos columnas:
  - Izquierda: catálogo con buscador, filtros, precio Bs/USD, stock.
  - Derecha: carrito, cantidades, subtotal, IVA, total Bs/USD.
- Botones de pago: Efectivo Bs, Efectivo USD, Pago Móvil, Punto de Venta, Mixto, Fiado.
- Botón de cierre de caja.

Modal crítico:
- **Pago Mixto** con validación de montos por método y diferencia pendiente/excedente.

Estados a mostrar:
- Stock insuficiente.
- Total cuadrado / no cuadrado en pago mixto.
- Venta confirmada.

---

### Módulo 3: Inventario (Vendedor - consulta)
Objetivo:
- Consultar disponibilidad y enviar productos al POS.

Visual principal:
- Tabla o grid de productos.
- Buscador rápido.
- Toggle lista/catalogo.
- Campos visibles: nombre, codigo, stock, precio Bs, precio USD.

Restricciones visuales:
- Sin botones de crear/editar/eliminar.

---

### Módulo 4: Inventario (Dueño - gestión completa)
Objetivo:
- Administrar productos y movimientos de stock.

Visual principal:
- Tabla avanzada con filtros por categoria/stock.
- Acciones: crear, editar, ajustar stock, carga Excel.
- Columnas con costo, precio, margen, stock minimo.

Modal crítico:
- **Ajuste de stock** con motivo (correccion, perdida, vencimiento).

Estados a mostrar:
- Producto con stock bajo.
- Ajuste exitoso.

---

### Módulo 5: Deudas (Fiado)
Objetivo:
- Gestionar cartera de clientes deudores y abonos.

Visual principal:
- Lista de clientes + panel detalle.
- Deuda total, estado (al dia, por vencer, vencida, saldada).
- Historial de compras fiadas y abonos.
- Boton registrar abono.

Modal crítico:
- **Registrar abono** (monto, metodo, fecha, referencia opcional).

Estados a mostrar:
- Limite de credito superado.
- Deuda vencida +30 dias.

---

### Módulo 6: Pago Móvil
Objetivo:
- Trazabilidad de transacciones y verificacion de referencias.

Visual principal:
- Tabla de transacciones (fecha, banco, referencia, monto, estado, venta asociada).
- Filtros por fecha/referencia/banco.
- Indicador de referencias duplicadas.

Modal crítico:
- **Detalle de transaccion** con historial y estado de verificacion.

---

### Módulo 7: Apertura y Cierre de Caja
Objetivo:
- Control diario por vendedor y arqueo.

Visual principal:
- Timeline del turno (apertura -> ventas -> cierre).
- Resumen por metodo de pago.
- Monto esperado vs monto contado.
- Diferencia (sobrante/faltante) destacada.

Modal crítico:
- **Cerrar caja** con confirmacion y observaciones.

Estados a mostrar:
- Caja abierta.
- Caja cerrada.
- Diferencia positiva/negativa.

---

### Módulo 8: Usuarios y Permisos
Objetivo:
- Administrar accesos y roles.

Visual principal:
- Tabla de usuarios (nombre, usuario, rol, estado, ultima actividad).
- Acciones: crear, activar/desactivar, cambiar credenciales.

Modal crítico:
- **Crear/editar usuario** con asignacion de rol.

---

### Módulo 9: Proveedores y Compras
Objetivo:
- Registrar proveedores y compras para reabastecimiento.

Visual principal:
- Lista de proveedores + historial de compras.
- Formulario de compra con productos, cantidades y costo.
- Indicador de impacto en inventario.

Modal crítico:
- **Registrar compra** y confirmacion de incremento de stock.

---

### Módulo 10: Analíticas (Dashboard ejecutivo)
Objetivo:
- Visualizar desempeño comercial y financiero.

Visual principal:
- KPIs: ventas, ganancia, ticket promedio, productos top.
- Graficos: ventas por metodo, tendencia temporal, franjas horarias.
- Filtros por periodo y comparacion con periodo anterior.

Estados a mostrar:
- Sin datos.
- Tendencia positiva/negativa.

---

### Módulo 11: Costos y Margen
Objetivo:
- Evaluar rentabilidad por producto.

Visual principal:
- Tabla con costo, precio, ganancia por unidad, margen porcentual.
- Semaforo de margen (alto, medio, bajo, negativo).
- Simulador de precio por margen objetivo.

Modal crítico:
- **Simulador de precio**.

---

### Módulo 12: Alertas Inteligentes
Objetivo:
- Detectar y priorizar riesgos operativos.

Visual principal:
- Centro de alertas con severidad y estado (nueva, leida, resuelta).
- Tipos: stock bajo, morosidad, margen negativo, tasa desactualizada, cierre con diferencia.
- Boton "Ir a modulo relacionado".

---

### Módulo 13: Configuración General
Objetivo:
- Parametrizar reglas de negocio del sistema.

Visual principal:
- Formulario por secciones:
  - Tasa del dia.
  - IVA.
  - Metodos de pago habilitados.
  - Limites de deuda.
  - Datos del negocio y logo.
  - Cuenta de pago movil.

Estados a mostrar:
- Cambios guardados.
- Tasa desactualizada (+24h).

---

### Módulo 14: Reportes Exportables
Objetivo:
- Generar reportes para control y auditoria.

Visual principal:
- Selector de tipo de reporte (ventas, inventario, deudas, cierres, ganancias).
- Filtros por fecha, vendedor, metodo.
- Vista previa del reporte.
- Acciones exportar PDF/Excel.

## 5) Relaciones entre módulos (para que Stitch refleje coherencia)

- POS consume inventario y genera ventas.
- Ventas alimentan cierres, analiticas y reportes.
- Ventas fiadas crean registros en deudas.
- Abonos de deudas impactan caja y reportes.
- Compras a proveedores incrementan inventario.
- Configuracion define tasa, IVA, metodos y limites.
- Alertas se disparan por eventos de inventario, deudas, cierres y margenes.

## 6) Prompt final sugerido para Stitch

Usar este prompt tal cual en Stitch:

"Disena las visuales completas de BodegaFlow POS, un sistema de gestion comercial para bodegas con dos roles (Vendedor y Dueno).  
Necesito pantallas modulares y consistentes para: Login, POS, Inventario Vendedor, Inventario Dueno, Deudas, Pago Movil, Apertura/Cierre de Caja, Usuarios y Permisos, Proveedores, Analiticas, Costos, Alertas, Configuracion y Reportes.  
Estilo moderno admin dashboard + POS rapido, con enfoque en legibilidad, tablas, KPIs, modales criticos y estados visuales (exito, alerta, error).  
Mostrar doble moneda Bs/USD con tasa del dia visible en toda la app.  
Incluye para cada modulo: pantalla principal, componentes clave, acciones primarias y estados de error/advertencia.  
Prioriza UX operativa para uso diario en tienda: velocidad, claridad y validaciones en tiempo real." 

## 7) Entregables esperados de Stitch

Solicitar que entregue:
- Mapa de navegación por rol.
- 14 pantallas principales (1 por modulo).
- Modales criticos para POS, inventario, deudas y cierres.
- Sistema de componentes reutilizables (botones, tablas, badges, cards, modales, alertas).
- Guía visual base (tipografia, paleta, espaciado, iconografia).

