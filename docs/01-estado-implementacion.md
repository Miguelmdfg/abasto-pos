# 01 — Estado de implementación

> Snapshot del avance real del producto frente a [`requerimientos.md`](requerimientos.md). Se actualiza manualmente; verificar contra el código antes de tomar decisiones críticas.

**Última revisión del código:** 2026-11-03. La verificación remota descrita abajo es histórica (2026-10-19); no se volvió a consultar Supabase en esta revisión.

## Verificación remota — 2026-10-19

La verificación remota del 2026-10-19 confirmó que:

- El proyecto de Supabase estaba pausado; se reanudó desde su consola y el API volvió a responder.
- El historial remoto tiene siete migraciones aplicadas, incluidas ventas transaccionales, endurecimiento de seguridad y cierre remoto de turnos. Los nombres/versiones locales se reconciliaron con el historial; no se reejecutó SQL sobre el proyecto.
- La base contiene las tablas/vistas consultadas y RPC para ventas, catálogo y turnos.
- Hay un perfil activo con rol `dueno`, 10 productos, 6 ventas y 2 turnos. Solo se consultaron conteos/roles; no se leyeron datos identificativos ni se crearon registros.
- RLS está habilitado en las 17 tablas públicas comprobadas; los 7 RPC revisados no conceden ejecución a `anon` y 6 la conceden a `authenticated`.
- La consulta de integridad no encontró ventas sin líneas, totales que no cuadren con pagos ni productos con stock negativo. Hay 1 turno abierto; no se modificó.
- Supabase Free no incluye backups programados. Se preparó `supabase/backup.ps1` para generar/verificar un archivo `pg_dump` local, sin cambiar el plan; aún falta instalar/disponer de las herramientas, introducir la contraseña de forma segura y probar una restauración. No migrar el ledger de crédito ni modificar el esquema remoto antes de validar una copia restaurable.
- Se agregó a Auth la URL de recuperación local `http://localhost:5173/reset-password`. El dominio de producción aún no está definido en la allowlist; el Site URL actual es `http://localhost:3000`.
- El frontend incluye autenticación Supabase, lectura y mutación remota del catálogo y RPC para ventas y apertura/cierre de turnos.
- En el código actual, ventas, caja, cartera y tasas se consultan remotamente cuando Supabase está activo; cierres/ventas locales no se mezclan con resultados remotos. Tema e idioma siguen siendo preferencias de `localStorage`.
- La configuración empresarial ya usa `app_settings` en el código local. La migración `20261103100000_persist_payment_method_settings.sql` debe aplicarse para persistir métodos de pago; si falta el esquema remoto, la app informa el error y bloquea ventas hasta cargar la configuración.
- Se preparó localmente una migración y RPC para crear clientes, emitir notas ligadas a ventas, consultar cartera y registrar pagos en Bs. No se ha aplicado a Supabase: con el proyecto remoto actual los RPC no existen y las operaciones remotas de crédito no están habilitadas hasta validar y desplegar la migración. Los abonos en USD siguen bloqueados hasta persistir una tasa autoritativa en el servidor.
- Se preparó localmente la consulta de la tasa BCV desde Supabase, el parser de la publicación oficial y una Edge Function programada varias veces al día. Aún no se desplegó; el frontend remoto no tendrá una tasa verificada hasta aplicar la migración y activar la programación.
- Se implementaron localmente alertas de morosidad basadas en la antigüedad de las notas con saldo, reportes CSV de ventas y cierres, importación XLSX con previsualización y carga transaccional, CRUD de proveedores e invitación/gestión de usuarios. Las operaciones nuevas dependen de migraciones/RPC/Edge Function aún no desplegadas; los vencimientos son alertas por antigüedad, no fechas contractuales almacenadas.
- La ruta `/reports` está habilitada para el dueño; permite filtrar ventas y cierres por fecha y exportar CSV. Dashboard muestra alertas de stock/crédito y permite reintentar la carga del historial, pero sus indicadores/gráficas aún requieren integración y validación.
- El historial remoto de cierres ahora muestra un aviso y permite reintentar cuando falla la carga, en lugar de presentar el resultado como completo.
- Verificación local del 2026-11-03: build pasa, 21 pruebas pasan y lint termina sin errores; quedan tres advertencias existentes de Fast Refresh en `auth.tsx` y el chunk principal supera 500 kB.
- Se detectó y corrigió la actualización del contexto de historial después de una venta remota; si la lectura posterior falla, la interfaz informa que la venta sí quedó registrada.

Antes de usar en producción, verificar permisos/RLS con una cuenta cajero, backups restaurables y flujos remotos completos.

## Leyenda

- 🟢 **Hecho** — funcional en el entorno de persistencia indicado.
- 🟡 **Parcial** — implementado a medias; faltan flujos o reglas de negocio.
- 🔴 **Pendiente** — no existe en el código.

## Tabla por módulo

| #   | Módulo                       | Estado | % | Página/Contexto                                          | Qué falta |
|-----|------------------------------|--------|---|-----------------------------------------------------------|-----------|
| 1   | Login                        | 🟡 | 75 | `pages/Login.tsx` + `lib/auth.tsx`                        | Autenticación real presente; falta probar login y recuperación con usuario de negocio; no hay UI de usuarios |
| 2   | Permisos por rol             | 🟢 | 90 | `lib/auth.tsx` (`canAccessPath`)                          | Solo cubre dos roles; no hay UI para gestionarlos |
| 3   | POS — venta simple           | 🟢 | 85 | `pages/Pos.tsx`                                           | Pruebas de concurrencia y manejo de reintentos |
| 4   | POS — pago mixto             | 🟡 | 60 | `pages/Pos.tsx`                                           | Validaciones en tiempo real; impresión de comprobante |
| 5   | POS — pago móvil             | 🟡 | 50 | `pages/Pos.tsx`                                           | Verificación contra cuenta destino; conciliación |
| 6   | POS — venta con nota de crédito | 🟡 | 60 | `pages/Pos.tsx` + `lib/credit-api.ts`                 | Requiere desplegar y probar la migración; falta autorización del dueño y validación operativa con cuentas reales. Antes "venta fiada" (ver MD-014). |
| 7   | Apertura/Cierre de caja      | 🟢 | 80 | `pages/CashClosures.tsx` + `lib/cashier-shift.tsx`        | Arqueo multi-moneda completo y pruebas operativas |
| 8   | Inventario (consulta)        | 🟢 | 80 | `pages/Inventory.tsx` + `mocks/products.ts`               | Filtros avanzados; vista catálogo con imágenes |
| 9   | Inventario (CRUD dueño)      | 🟡 | 75 | `pages/Inventory.tsx` + `pages/InventoryImport.tsx`       | La importación Excel tiene preview/RPC preparados localmente; migración pendiente de despliegue y pruebas |
| 10  | Notas de Crédito (panel dueño)| 🟡 | 70 | `pages/Debts.tsx` + `lib/debts-context.tsx` + `lib/credit-api.ts` | RPC de crédito pendiente de despliegue; faltan abonos USD y vencimientos contractuales. Alertas locales por antigüedad ya disponibles. Anteriormente "Deudas" (ver MD-014). |
| 11  | Cierres de caja (vista dueño)| 🟡 | 80 | Pestaña en `pages/SalesHistory.tsx` (`pages/CashClosures.tsx`) | Hay filtros de período y exportación CSV; falta filtro por vendedor y consolidado diario |
| 12  | Costos                       | 🟡 | 50 | `pages/Costs.tsx`                                         | Calculadora en memoria; definir modelo remoto para costos y precios manuales |
| 13  | Configuración                | 🟡 | 70 | `pages/Settings.tsx` + `lib/settings-context.tsx`         | Configuración empresarial conectada a `app_settings`; falta aplicar la migración de métodos de pago y probar permisos en remoto |
| 14  | Tasa del día (Bs/USD)        | 🟡 | 70 | `lib/exchange-rate.tsx` + `supabase/functions/bcv-rate-sync` | Lectura central y parser BCV preparados localmente; falta migración, despliegue y programación remotos |
| 15  | Multi-idioma                 | 🟢 | 80 | `lib/i18n.tsx` + `lib/i18n-dictionaries.ts`               | Cobertura completa de strings (algunos componentes hardcoded) |
| 16  | Tema claro/oscuro            | 🟢 | 90 | `lib/theme.ts`                                            | — |
| 17  | Dashboard / Analíticas       | 🟡 | 65 | `pages/Dashboard.tsx` + `lib/sales-history.tsx`           | Alertas de stock/crédito y desglose real de pagos preparados; falta completar KPIs y validar en operación real |
| 18  | Historial de ventas          | 🟢 | 75 | `pages/SalesHistory.tsx` + `lib/sales-history.tsx`        | Filtros avanzados; export; detalle por venta |
| 19  | Reportes                     | 🟡 | 65 | `pages/Reports.tsx` + exportadores CSV                    | Ventas/cierres filtrables con CSV; faltan PDF/Excel, filtros por vendedor y más análisis |
| 20  | Usuarios y permisos (CRUD)   | 🟡 | 65 | Pestaña en `pages/Settings.tsx` (`pages/UserManagement.tsx`) + `functions/invite-user` | Migración/Edge Function no desplegadas ni probadas con cuentas reales |
| 21  | Proveedores                  | 🟡 | 60 | `pages/Suppliers.tsx`                                      | Directorio CRUD local listo; falta desplegar tabla/políticas y relacionarlo con compras |
| 22  | Alertas inteligentes         | 🟡 | 55 | Dashboard + `lib/credit-alerts.ts`                        | Alertas de stock y crédito por antigüedad; faltan centro de notificaciones, reglas de margen y fechas contractuales |
| 23  | Carga Excel de inventario    | 🟡 | 70 | Pestaña en `pages/Inventory.tsx` (`pages/InventoryImport.tsx`) + `lib/inventory-import.ts` | Preview/validación/XLSX y RPC transaccional local; migración sin desplegar y pruebas operativas pendientes |
| 24  | Backend / API                | 🟡 | 60 | Supabase RPC + Edge Functions                             | Desplegar y probar migraciones y funciones de crédito, BCV, importación y administración |
| 25  | Base de datos                | 🟡 | 50 | Supabase remoto + `supabase/migrations`                     | Cinco migraciones locales pendientes; copia restaurable verificada y cambios remotos siguen en espera |

## Resumen ejecutivo

- **Núcleo POS:** existe un flujo remoto de catálogo, ventas y turnos; el flujo de crédito está preparado en código pero bloqueado hasta desplegar y probar su migración.
- **Panel administrativo:** las páginas existen pero varias muestran datos mock o tienen lógica parcial.
- **Backend/BD:** Supabase está conectado para catálogo, ventas y turnos según la última verificación remota; no hay copia/restauración verificada ni se desplegaron los cambios locales recientes.
- **Módulos preparados pero no desplegados:** importación Excel, proveedores, administración de usuarios y RPC de crédito. Reportes CSV y alertas de crédito por antigüedad están disponibles en el código local; PDF/Excel y vínculos proveedor-compra siguen pendientes.

## Riesgos vigentes

1. **Pérdida de datos** — un `localStorage.clear()` borra datos locales; no hay copia externa restaurada y probada.
2. **Sin auditoría** — no se puede rastrear quién hizo qué (no hay backend ni logs persistentes).
3. **Permisos no validados en uso real** — se verificó RLS y permisos de RPC en catálogo, pero todavía falta una prueba funcional con un usuario cajero.
4. **Sin backup restaurable verificado** — el plan actual no ofrece backup programado; validar una restauración antes de aplicar cambios de esquema.
5. **Inconsistencias documentadas** — ver el bloque de notas al inicio de [`requerimientos.md`](requerimientos.md).

## Cómo mantener este documento

- Cuando se cierre o avance un módulo, actualizar la fila correspondiente y la fecha de la cabecera.
- Cuando aparezca un nuevo requerimiento, añadir una fila como 🔴.
- Cambios estructurales (p. ej. introducir backend) → actualizar también [`00-arquitectura.md`](00-arquitectura.md).
