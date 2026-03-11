1. VISIÓN GENERAL DEL SISTEMA

El sistema es una plataforma integral de gestión comercial orientada a negocios minoristas que requieren control de inventario, facturación individul, con calculo de IVA al finalizar la facturacion, gestión de deudas, análisis financiero y administración operativa.

Su diseño está basado en separación clara de roles, control centralizado de información y automatización de procesos críticos como:
	•	Descuento automático de inventario
	•	Registro estructurado de ventas
	•	Gestión de pagos múltiples
	calculo de impuestos
	•	Control de deudas
	•	Cierres diarios de caja
	•	Análisis de desempeño comercial
	•	Generación de alertas inteligentes

El sistema se divide en dos perfiles principales:
	•	Vendedor
	•	Dueño

Cada uno con acceso estrictamente delimitado según sus responsabilidades operativas.

⸻

2. ESTRUCTURA FUNCIONAL DEL SISTEMA

⸻

2.1 MÓDULO DE AUTENTICACIÓN (LOGIN)

Objetivo

Controlar el acceso seguro al sistema y redirigir según rol asignado.

Funcionalidad
	•	Validación de usuario
	•	Validación de contraseña
	•	Verificación de estado activo
	•	Identificación de rol

Redirección Automática
	•	Vendedor → POS + Inventario (modo consulta)
	•	Dueño → Panel Administrativo completo (excepto POS)

⸻

3. ESTRUCTURA DEL ROL VENDEDOR

El vendedor opera únicamente en entorno de ventas y consulta.

⸻

3.1 Inventario – Vista Operativa

Objetivo

Permitir consulta rápida de productos disponibles.

Visualización
	•	Lista de productos
	•	Buscador dinámico
	•	Vista tipo lista o tipo catálogo
	•	Información visible:
	•	Nombre
	•	ID
	•	Stock
	•	Precio en moneda local
	•	Precio en divisa

Permisos

Permitido:
	•	Consultar productos
	•	Consultar stock
	•	Consultar precios
	•	Enviar producto al POS

No permitido:
	•	Crear productos
	•	Editar productos
	•	Ajustar stock
	•	Ver costos
	•	Acceder a analíticas

⸻

3.2 POS (Punto de Venta)

Objetivo

Registrar ventas de forma estructurada y automatizada.

Estructura de Pantalla

Sección izquierda:
	•	Listado de productos
	•	Buscador
	•	Visualización de precios en ambas monedas
	•	Control de stock

Sección derecha:
	•	Carrito de venta
	•	Cantidad por producto
	•	Subtotales
	•	Total general en ambas monedas
	•	Conversión automática según tasa del día
	• 	Botones de "Pago movil"; "Efectivo $"; "Efectivo bs"; "Punto de venta"; "Mixto"
	• 	Boton de Cierre de caja

⸻

Flujo de Venta
	1.	Selección de productos.
	2.	Agregado al carrito.
	3.	Cálculo automático de totales.
	4.	Selección de método de pago:
	•	Efectivo
	•	Divisa
	•	Pago móvil
	•	Punto de venta
	•	Mixto
	5.	Registro de datos adicionales si aplica.
	6.	Confirmación de venta.
	7.	Registro estructurado de:
	•	Venta
	•	Método de pago
	•	Fecha y hora
	•	Vendedor responsable
	8.	Descuento automático del inventario.
	9.	Envío automático al cierre de caja.

⸻

4. ESTRUCTURA DEL ROL DUEÑO

El dueño posee acceso administrativo integral.

⸻

4.1 Inventario – Gestión Completa

Funcionalidades
	•	Crear productos
	•	Editar productos
	•	Ajustar stock
	•	Visualizar historial de movimientos
	•	Consultar precios y costos
	•	Control de inventario en ambas monedas
	•  	Carga de documento tipo excel para el inventario 

⸻

4.2 Módulo de Deudas

Objetivo

Control estructurado de ventas fiadas.

Funcionalidades
	•	Registro de clientes
	•	Asociación de productos fiados
	•	Cálculo automático de deuda
	•	Alertas por límite superado
	•	Alertas por morosidad (+30 días)
	•	Registro de abonos
	•	Integración automática con cierre de caja

⸻

4.3 Módulo de Pago Móvil

Función
	•	Registro de transacciones
	•	Consulta por fecha
	•	Verificación de referencias
	•	Historial mensual

⸻

4.4 Cierres de Caja

Objetivo

Control financiero diario consolidado.

Información mostrada
	•	Totales por método de pago
	•	Total de abonos
	•	Cantidad de ventas
	•	Responsable del cierre
	•  	Al final se debe mostrar cuanto debe haber recolectado en cada uno de los metodos de pago 

Funcionalidades
	•	Filtros por período
	•	Comparación entre fechas
	•	Exportación de información

⸻

4.5 Usuarios y Permisos

Funcionalidades
	•	Creación de usuarios
	•	Asignación de rol
	•	Activación / desactivación
	•	Cambio de credenciales
	•	Visualización de actividad

⸻

4.6 Proveedores

Funcionalidades
	•	Registro de proveedores
	•	Asociación de productos
	•	Historial de compras
	•	Incremento automático de inventario

⸻

4.7 Analíticas (Dashboard Ejecutivo)

Indicadores
	•	Productos más vendidos
	•	Productos de baja rotación
	•	Día con mayor facturación
	•	Ganancias totales y brutas
	•	Ventas por método de pago
	•	Ventas por franja horaria

Capacidades
	•	Filtros por período
	•	Visualización de tendencias
	•	Exportación de datos

⸻

4.8 Módulo de Costos

Objetivo

Control de rentabilidad por producto.

Indicadores
	•	Costo por unidad
	•	Precio de venta
	•	Ganancia por unidad
	•	Ganancia por lote
	•	Porcentaje de margen
	•	Conversión automática por tasa

Permite evaluar estructura de precios y márgenes de forma estratégica.

⸻

4.9 Reportes Exportables

Tipos de Reportes
	•	Ventas
	•	Ganancias
	•	Inventario
	•	Productos destacados
	•	Deudas
	•	Cierres de caja

Formatos disponibles:
	•	PDF
	•	Excel

⸻

4.10 Alertas Inteligentes

Generadas automáticamente por:
	•	Stock bajo
	•	Productos sin rotación
	•	Margen negativo
	•	Deudas críticas
	•	Morosidad prolongada
	•	Tasa no actualizada
	•	Comportamientos de venta atípicos

Permite acción preventiva antes de que el problema escale.

⸻

4.11 Configuración General

Parámetros ajustables
	•	Tasa del día
	•	Límite máximo de deuda
	•	Métodos de pago habilitados
	•	Datos del negocio
	•	Imagen corporativa

⸻

5. ARQUITECTURA TECNOLÓGICA PROPUESTA

⸻

5.1 Frontend

Tecnología Base

React + Vite + TypeScript

Objetivo

Construir una interfaz rápida, escalable y modular.

Capacidades Clave
	•	Componentes reutilizables
	•	Navegación basada en roles
	•	Manejo eficiente de estado global
	•	Visualización avanzada de analíticas
	•	Experiencia fluida en POS

⸻

5.2 Backend

Tecnología Base

Node.js + NestJS + TypeScript

Objetivo

Estructura modular, segura y escalable.

Características
	•	API estructurada
	•	Separación clara de módulos
	•	Control de permisos por rol
	•	Validación centralizada de datos
	•	Arquitectura preparada para crecimiento futuro

⸻

5.3 Base de Datos

Tecnología

PostgreSQL

Objetivo

Garantizar integridad, transacciones seguras y soporte para análisis complejos.

Capaz de manejar:
	•	Ventas
	•	Movimientos de inventario
	•	Deudas
	•	Cierres
	•	Costos
	•	Analíticas avanzadas

⸻

5.4 Infraestructura

Entorno Recomendado

Servicios en la nube para:
	•	Base de datos segura
	•	Backend escalable
	•	Almacenamiento de imágenes
	•	Alta disponibilidad
	•	Crecimiento progresivo

⸻

6. CONCLUSIÓN ESTRATÉGICA

Este sistema no es únicamente un punto de venta.
Es una plataforma integral de control comercial con enfoque en:
	•	Automatización
	•	Control financiero
	•	Prevención de pérdidas
	•	Análisis estratégico
	•	Escalabilidad tecnológica

Su estructura modular permite crecer hacia:
	•	Multi-sucursales
	•	Integración con comercio electrónico
	•	Control centralizado de múltiples negocios
	•	Analítica predictiva
	•	Microservicios independientes

Está diseñado para operar con precisión operativa en el presente y escalar con visión empresarial hacia el futuro.