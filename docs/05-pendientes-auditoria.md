# 05 — Pendientes Para Terminar el Sistema

> Auditoría enfocada en lo que falta para convertir la app actual en un sistema usable en producción para un abasto: base de datos, login real, persistencia, reportes y despliegue.

## Pendientes exactos, versión concisa

Estos son los puntos pendientes reales del sistema:

1. **Base de datos real:** hoy los datos principales viven en `localStorage`, mocks o estado temporal del navegador.
2. **Backend activo:** no hay API de producción conectada al frontend actual.
3. **Login seguro:** existen credenciales hardcodeadas y fallback local si la API falla.
4. **Sesiones y permisos reales:** el rol se valida solo en frontend; falta protección de endpoints en backend.
5. **Persistencia de inventario:** productos, precios, costos y stock no están centralizados en una base de datos.
6. **Movimientos de stock:** falta historial de entradas, salidas, ajustes, ventas, mermas e inventario inicial.
7. **Ventas transaccionales:** el POS guarda ventas localmente antes de confirmar backend y stock.
8. **Pagos bien modelados:** pago mixto, pago móvil, efectivo, punto de venta y crédito deben guardarse como pagos asociados a la venta.
9. **Clientes y notas de crédito:** el módulo actual de deudas necesita convertirse en clientes, notas, saldos y abonos persistentes.
10. **Cierres de caja reales:** faltan turnos/cierres conectados a ventas y abonos reales.
11. **Reportes reales:** `Reports.tsx` existe, pero no está enrutado ni genera PDF/Excel real.
12. **Dashboard sin datos demo:** actualmente mezcla ventas reales con datos demo.
13. **Eliminar mocks/fallbacks de producción:** POS, inventario, costos, dashboard y reportes usan datos de respaldo.
14. **Desactivar seed demo en producción:** el seed puede sobrescribir ventas/deudas locales.
15. **Aplicar reglas de negocio:** IVA, límites de crédito, morosidad, métodos habilitados y tasa deben aplicarse de forma consistente.
16. **Auditoría básica:** falta registrar quién hizo cada venta, ajuste, abono, cierre o cambio de configuración.
17. **Exportaciones:** faltan PDF/Excel/CSV reales para ventas, caja, inventario y deudas.
18. **Limpieza del repo:** hay duplicación entre `abasto-pos/`, `abasto-pos-1/` y código legacy en `__old/`.
19. **Variables de entorno:** falta configuración formal para API URL, entorno demo/producción y secretos.
20. **Despliegue web:** falta publicar frontend, backend y base de datos en una infraestructura estable.
21. **Pruebas mínimas:** no hay verificación automatizada para login, ventas, stock, abonos, caja y permisos.

## Pendientes estructurados

### 1. Datos y persistencia

Estado actual:
- La app usa `localStorage` para sesión, ventas, deudas, cierres, tasa y configuración.
- El inventario usa API si existe, pero cae a `MOCK_PRODUCTS` si no hay backend.
- El historial de ventas tiene límite local de 500 registros.

Pendiente:
- Crear una base de datos real.
- Migrar productos, ventas, deudas, cierres y configuración fuera de `localStorage`.
- Definir migración desde los datos demo/mocks iniciales.

Tablas mínimas recomendadas:
- `users`
- `products`
- `categories`
- `inventory_movements`
- `sales`
- `sale_items`
- `sale_payments`
- `customers`
- `credit_notes`
- `credit_note_payments`
- `cashier_shifts`
- `settings`
- `exchange_rates`

### 2. Backend/API

Estado actual:
- No hay backend activo para producción.
- Existe un backend legacy en `__old/backend/`, pero no coincide con la app final ni tiene seguridad suficiente.

Pendiente:
- Crear backend nuevo o rehacer el legacy.
- Agregar validación de datos.
- Proteger endpoints por sesión y rol.
- Manejar errores de forma clara para el frontend.
- Hacer que ventas, stock y pagos se guarden en transacciones.

Endpoints mínimos:
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`
- `GET/POST/PUT /products`
- `POST /inventory-movements`
- `POST /sales`
- `GET /sales`
- `GET/POST /customers`
- `POST /credit-notes`
- `POST /credit-note-payments`
- `GET/POST /cashier-shifts`
- `GET/PUT /settings`
- `GET/POST /exchange-rates`
- `GET /reports/...`

### 3. Login, usuarios y permisos

Estado actual:
- El login tiene usuarios demo hardcodeados.
- Si la API falla, permite entrar localmente.
- El rol se guarda en `localStorage`.
- Los permisos solo se aplican en el frontend.

Pendiente:
- Crear usuarios reales en base de datos.
- Guardar contraseñas con hash.
- Crear sesión/token.
- Validar permisos en backend.
- Agregar estado de usuario activo/inactivo.
- Crear o preparar CRUD de usuarios para el dueño.

Roles mínimos:
- `dueno`: acceso administrativo completo.
- `cajero`: POS, inventario consultivo, deudas/abonos según permisos definidos.

### 4. POS y ventas

Estado actual:
- El POS funciona visualmente.
- Registra ventas en historial local.
- Intenta enviar ventas al backend, pero ignora fallos.
- Descuenta stock solo si el backend legacy responde correctamente.

Pendiente:
- Registrar ventas solo después de confirmación del backend.
- Validar stock en servidor.
- Descontar stock en la misma transacción de la venta.
- Guardar snapshot de precio, costo, tasa y cajero.
- Guardar pagos como filas separadas.
- Mostrar error si la venta no pudo guardarse.

### 5. Inventario

Estado actual:
- La pantalla de inventario permite listar, crear y editar.
- Si no hay API, trabaja en memoria con productos mock.
- Los cambios fallback se pierden al recargar.

Pendiente:
- Persistir productos en base de datos.
- Crear historial de movimientos.
- Separar edición de producto de ajuste de stock.
- Agregar carga inicial de inventario.
- Definir carga masiva por Excel si sigue dentro del alcance.

### 6. Deudas / notas de crédito

Estado actual:
- El módulo funciona como "Deudas".
- Guarda saldo como número mutable.
- Los abonos están embebidos dentro del cliente/deuda.
- La morosidad usa reglas hardcodeadas.

Pendiente:
- Separar `Customer` de `CreditNote`.
- Calcular saldo desde ventas menos abonos.
- Registrar abonos como entidad propia.
- Asociar cajero, método de pago, tasa y fecha a cada abono.
- Aplicar límite de crédito.
- Definir si exceder límite requiere autorización del dueño.

### 7. Cierres de caja

Estado actual:
- Hay pantalla y lógica visual de cierre.
- Los cierres se guardan en `localStorage`.
- No hay relación fuerte entre turno, cajero, ventas y abonos.

Pendiente:
- Crear turnos/aperturas de caja.
- Asociar cada venta a un turno.
- Asociar abonos cobrados al turno.
- Calcular cierre desde datos reales.
- Guardar diferencia, sobrante/faltante y distribución.
- Exportar cierre.

### 8. Reportes y dashboard

Estado actual:
- Dashboard mezcla ventas reales con datos demo.
- Reportes existen como componente, pero no están enrutados.
- No hay PDF/Excel real.

Pendiente:
- Quitar datos demo del dashboard en producción.
- Enrutar módulo de reportes.
- Crear reportes reales por ventas, caja, inventario, productos, deudas y ganancias.
- Agregar filtros por fecha, cajero, método, producto y cliente.
- Exportar CSV/PDF/Excel.

### 9. Configuración y reglas de negocio

Estado actual:
- Existen pantallas para tasa, IVA, métodos de pago, pago móvil y alertas.
- Varias configuraciones no se aplican completamente en la lógica.

Pendiente:
- Persistir configuración en backend.
- Aplicar IVA al POS si el negocio lo necesita.
- Aplicar métodos de pago habilitados desde backend.
- Usar umbral de morosidad configurable.
- Usar stock mínimo configurable.
- Guardar tasa histórica y snapshot por venta.

### 10. Producción y despliegue

Pendiente:
- Definir proveedor de hosting.
- Configurar variables de entorno.
- Separar modo demo de modo producción.
- Configurar dominio.
- Configurar HTTPS.
- Configurar backups de base de datos.
- Ejecutar build de frontend.
- Publicar backend.
- Monitorear errores básicos.

### 11. Calidad y pruebas

Pendiente:
- Ejecutar `npm run lint`.
- Ejecutar `npm run build`.
- Agregar pruebas mínimas de backend.
- Probar flujo completo: login, venta, stock, deuda, abono, cierre y reporte.

No se pudo ejecutar build/lint en esta revisión porque el entorno no tenía `node`/`npm` disponible en `PATH`.

## Alternativas para terminar el sistema

### Alternativa A — Más económica y rápida

**Frontend actual + backend Node/Express + SQLite/PostgreSQL pequeño + hosting barato.**

Arquitectura:
- Mantener React/Vite actual.
- Crear backend Express.
- Usar SQLite si será una sola tienda con pocos usuarios, o PostgreSQL económico si se quiere más seguridad.
- Desplegar frontend en Vercel/Netlify/Cloudflare Pages.
- Desplegar backend en Render/Fly.io/Railway/VPS pequeño.
- Base de datos en el mismo VPS, Supabase free/low cost o PostgreSQL administrado barato.

Ventajas:
- Menor costo inicial.
- Se reutiliza gran parte de la app actual.
- Más rápido de terminar.
- Bueno para validar el negocio real.

Desventajas:
- SQLite no es ideal para crecer o multiusuario intenso.
- Si se elige VPS barato, hay más responsabilidad técnica.
- Puede requerir migración posterior si el negocio crece.

Recomendación si el presupuesto es limitado:
- Usar **PostgreSQL desde el inicio**, aunque sea en un plan gratuito/económico.
- Evitar SQLite si ya se piensa publicar web y usar desde varios dispositivos.

### Alternativa B — Más correcta para producción inicial

**Frontend actual + backend Node/Express o NestJS + PostgreSQL + ORM + hosting administrado.**

Arquitectura:
- React/Vite actual.
- Backend con Express bien estructurado o NestJS.
- PostgreSQL.
- ORM: Prisma o Drizzle.
- Auth con JWT/cookies seguras.
- Migraciones versionadas.
- Backups automáticos.
- Deploy separado: frontend, API y base de datos.

Ventajas:
- Base sólida para producción.
- Mejor integridad de datos.
- Más fácil de mantener.
- Permite auditoría, reportes y crecimiento.
- Mejor para varios usuarios/dispositivos.

Desventajas:
- Más trabajo inicial.
- Mayor costo mensual que una solución completamente local.
- Requiere más disciplina técnica.

Recomendación técnica:
- Esta es la opción más correcta para publicar el SaaS.

### Alternativa C — Backend-as-a-Service

**Frontend actual + Supabase/Firebase/Appwrite.**

Opción recomendada dentro de esta categoría:
- Supabase, porque usa PostgreSQL.

Arquitectura:
- React/Vite actual.
- Supabase Auth.
- Supabase PostgreSQL.
- Row Level Security para permisos.
- Edge Functions o backend pequeño solo para operaciones críticas.

Ventajas:
- Reduce tiempo de backend.
- Auth y base de datos vienen listas.
- PostgreSQL real.
- Panel administrativo incluido.
- Puede iniciar barato.

Desventajas:
- Reglas complejas como ventas transaccionales y cierre de caja pueden requerir funciones SQL o backend adicional.
- Dependencia fuerte del proveedor.
- Hay que diseñar bien permisos/RLS para no exponer datos.

Recomendación:
- Buena opción si se quiere avanzar rápido sin montar mucho backend propio.
- Para POS con stock y caja, conviene usar Supabase + funciones/backend para operaciones críticas.

### Alternativa D — App local con base de datos local

**Mantenerlo como sistema local para una sola tienda.**

Arquitectura:
- App web local o empaquetada.
- Backend local.
- SQLite local.
- Sin SaaS real.

Ventajas:
- Muy económico.
- No depende tanto de internet.
- Fácil para un solo abasto.

Desventajas:
- No es SaaS.
- Acceso remoto limitado.
- Backups manuales o más difíciles.
- Multiusuario/dispositivos más complicado.
- Publicarlo en la web pierde sentido si la base vive localmente.

Recomendación:
- Solo conviene si el objetivo cambió y ya no se quiere SaaS.

## Comparación rápida

| Alternativa | Costo inicial | Costo mensual | Calidad técnica | Velocidad | Recomendada para |
|---|---:|---:|---:|---:|---|
| A. Express + PostgreSQL económico | Bajo | Bajo | Media/Alta | Alta | Terminar rápido con buen balance |
| B. Backend sólido + PostgreSQL | Medio | Bajo/Medio | Alta | Media | Producción seria |
| C. Supabase | Bajo/Medio | Bajo/Medio | Alta si se diseña bien | Alta | Avanzar rápido con PostgreSQL |
| D. Local + SQLite | Bajo | Muy bajo | Media | Alta | Una sola tienda, no SaaS |

## Recomendación final

La mejor relación entre costo y corrección es:

**React actual + backend Node/Express + PostgreSQL + Prisma/Drizzle + deploy barato.**

Ruta sugerida:

1. Mantener el frontend actual.
2. Crear backend nuevo, no reutilizar directamente `__old/backend`.
3. Usar PostgreSQL desde el principio.
4. Implementar primero login, productos, ventas y stock.
5. Luego deudas/notas de crédito, abonos y cierres.
6. Después reportes y exportaciones.
7. Al final, limpiar mocks, activar modo producción y desplegar.

Si se quiere terminar todavía más rápido y con menor carga de backend, la segunda mejor alternativa es:

**React actual + Supabase Auth + Supabase PostgreSQL + funciones para ventas/stock/cierres.**

## Primer bloque de trabajo recomendado

Para avanzar sin perderse, el primer sprint debería cerrar esto:

1. Crear backend y conectarlo al frontend con `VITE_API_URL`.
2. Crear base de datos con usuarios y productos.
3. Reemplazar login hardcodeado por login real.
4. Reemplazar inventario mock por inventario desde base de datos.
5. Registrar ventas en backend.
6. Descontar stock en transacción.
7. Quitar fallback silencioso del POS.

Con eso el sistema deja de ser demo y pasa a tener una base real sobre la cual terminar caja, deudas y reportes.
