# 01 — Estado de implementación

> Snapshot del avance real del producto frente a [`requerimientos.md`](requerimientos.md). Se actualiza manualmente; verificar contra el código antes de tomar decisiones críticas.

**Última verificación:** 2026-04-28 (rama `final-code`).

## Leyenda

- 🟢 **Hecho** — funcional y usable de extremo a extremo (sobre `localStorage`).
- 🟡 **Parcial** — implementado a medias; faltan flujos o reglas de negocio.
- 🔴 **Pendiente** — no existe en el código.

## Tabla por módulo

| #   | Módulo                       | Estado | % | Página/Contexto                                          | Qué falta |
|-----|------------------------------|--------|---|-----------------------------------------------------------|-----------|
| 1   | Login                        | 🟡 | 70 | `pages/Login.tsx` + `lib/auth.tsx`                        | Auth real (hoy usuarios hardcodeados); validación de cuenta desactivada |
| 2   | Permisos por rol             | 🟢 | 90 | `lib/auth.tsx` (`canAccessPath`)                          | Solo cubre dos roles; no hay UI para gestionarlos |
| 3   | POS — venta simple           | 🟢 | 85 | `pages/Pos.tsx`                                           | Validación de stock granular en concurrencia (no aplica sin backend) |
| 4   | POS — pago mixto             | 🟡 | 60 | `pages/Pos.tsx`                                           | Validaciones en tiempo real; impresión de comprobante |
| 5   | POS — pago móvil             | 🟡 | 50 | `pages/Pos.tsx`                                           | Verificación contra cuenta destino; conciliación |
| 6   | POS — venta con nota de crédito | 🟡 | 50 | `pages/Pos.tsx` + `lib/debts-context.tsx`              | Límite de crédito; autorización del dueño; validaciones de cliente. Antes "venta fiada" (ver MD-014). |
| 7   | Apertura/Cierre de caja      | 🟢 | 75 | `pages/CashClosures.tsx` + `lib/cashier-shift.tsx`        | Reportes/exportación del cierre; arqueo multi-moneda completo |
| 8   | Inventario (consulta)        | 🟢 | 80 | `pages/Inventory.tsx` + `mocks/products.ts`               | Filtros avanzados; vista catálogo con imágenes |
| 9   | Inventario (CRUD dueño)      | 🟡 | 60 | `pages/Inventory.tsx`                                     | Carga masiva por Excel; movimientos de inventario; historial |
| 10  | Notas de Crédito (panel dueño)| 🟡 | 70 | `pages/Debts.tsx` + `lib/debts-context.tsx`              | Alertas de morosidad; estados de vencimiento automáticos; abonos parciales completos. Anteriormente "Deudas" (ver MD-014). |
| 11  | Cierres de caja (vista dueño)| 🟡 | 70 | `pages/CashClosures.tsx`                                  | Filtros por vendedor/período; export; consolidado diario |
| 12  | Costos                       | 🟡 | 50 | `pages/Costs.tsx`                                         | Simulador de margen; vínculo con productos |
| 13  | Configuración                | 🟡 | 60 | `pages/Settings.tsx` + `lib/settings-context.tsx`         | Gestión de cuentas destino; activar/desactivar métodos de pago |
| 14  | Tasa del día (Bs/USD)        | 🟢 | 80 | `lib/exchange-rate.tsx` + `lib/rate-history.tsx`          | Aviso visual >24h sin actualizar; fuente automática (manual hoy) |
| 15  | Multi-idioma                 | 🟢 | 80 | `lib/i18n.tsx` + `lib/i18n-dictionaries.ts`               | Cobertura completa de strings (algunos componentes hardcoded) |
| 16  | Tema claro/oscuro            | 🟢 | 90 | `lib/theme.ts`                                            | — |
| 17  | Dashboard / Analíticas       | 🟡 | 30 | `pages/Dashboard.tsx` + `mocks/dashboard.ts`              | KPIs con datos mock; falta integración con `salesHistory` real; gráficos |
| 18  | Historial de ventas          | 🟢 | 75 | `pages/SalesHistory.tsx` + `lib/sales-history.tsx`        | Filtros avanzados; export; detalle por venta |
| 19  | Reportes (PDF/Excel)         | 🔴 | 20 | `pages/Reports.tsx` (no enrutada)                         | Generación real de PDF/Excel; no está en el menú |
| 20  | Usuarios y permisos (CRUD)   | 🔴 | 0  | —                                                          | Módulo completo; hoy solo usuarios hardcodeados |
| 21  | Proveedores                  | 🔴 | 0  | —                                                          | Módulo completo |
| 22  | Alertas inteligentes         | 🔴 | 0  | —                                                          | Centro de notificaciones; reglas (stock, morosidad, margen) |
| 23  | Carga Excel de inventario    | 🔴 | 0  | —                                                          | Parser, validación, preview, commit |
| 24  | Backend / API                | 🔴 | 0  | (legacy en `__old/backend/` no consumido)                  | Reescribir según arquitectura objetivo de §5.2 |
| 25  | Base de datos                | 🔴 | 0  | (todo en `localStorage`)                                   | Modelado, migraciones, conexión |

## Resumen ejecutivo

- **Núcleo POS:** funcional para una operación básica de venta + cierre de caja sobre `localStorage`.
- **Panel administrativo:** las páginas existen pero varias muestran datos mock o tienen lógica parcial.
- **Backend/BD:** no existen. Cualquier escenario multi-usuario, multi-dispositivo o de respaldo fiable requiere construirlo.
- **Módulos enteros pendientes:** Usuarios, Proveedores, Alertas, Carga Excel, Reportes con export real.

## Riesgos vigentes

1. **Pérdida de datos** — un `localStorage.clear()` borra todo. No hay backup.
2. **Sin auditoría** — no se puede rastrear quién hizo qué (no hay backend ni logs persistentes).
3. **Login inseguro** — credenciales hardcodeadas; el `email`+`password` no se valida contra hash.
4. **Capacidad limitada** — `localStorage` ronda los 5 MB; un comercio activo puede llenarlo en meses.
5. **Inconsistencias documentadas** — ver el bloque de notas al inicio de [`requerimientos.md`](requerimientos.md).

## Cómo mantener este documento

- Cuando se cierre o avance un módulo, actualizar la fila correspondiente y la fecha de la cabecera.
- Cuando aparezca un nuevo requerimiento, añadir una fila como 🔴.
- Cambios estructurales (p. ej. introducir backend) → actualizar también [`00-arquitectura.md`](00-arquitectura.md).
