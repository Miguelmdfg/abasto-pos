# 06 — Plan de cierre y salida a producción

> Plan actualizado el 2026-11-03 con base en el código local. El estado del proyecto Supabase se verificó por última vez el 2026-10-19; no se debe asumir que sigue igual sin comprobarlo.

## Situación actual

La aplicación no parte de cero: autentica con Supabase, consulta el catálogo, registra ventas mediante RPC transaccional y abre/cierra turnos en remoto. La persistencia de configuración también está conectada localmente a `app_settings`; requiere desplegar la migración de métodos de pago antes de considerar esa función lista en el remoto. Ventas, cierres y tasas no deben recurrir a datos locales cuando Supabase está activo. Tema e idioma pueden permanecer como preferencias locales.

El código local incluye además cambios para crédito, BCV, importación de inventario, proveedores y gestión de usuarios. Las migraciones/Edge Functions asociadas no están verificadas como desplegadas. El backup restaurable sigue siendo el prerrequisito de cambios en la base.

## Fase 1 — Recuperación y seguridad operacional

- [ ] Generar copia externa con `supabase/backup.ps1`.
- [ ] Restaurar la copia en un proyecto Supabase separado y documentar el resultado.
- [ ] Verificar el proyecto remoto actual, su historial de migraciones, RLS, RPC y turnos abiertos antes de modificarlo.
- [ ] Definir responsable, frecuencia, retención y almacenamiento cifrado de copias.

**No aplicar migraciones de datos antes de completar esta fase.** Instrucciones y restricciones: [`../supabase/README.md`](../supabase/README.md).

## Fase 2 — Persistencia compartida

- [x] Ventas, pagos e inventario del POS transaccional en Supabase.
- [x] Apertura/cierre e historial remoto de turnos.
- [x] Evitar mezclar cierres/ventas guardados en el navegador cuando Supabase está activo.
- [x] Conectar configuración empresarial con `app_settings`; reportar errores y bloquear ventas si no carga.
- [x] Leer el historial de tasas desde `exchange_rates` en modo Supabase.
- [ ] Desplegar y comprobar `20261103100000_persist_payment_method_settings.sql`.
- [ ] Probar la lectura/edición de configuración con dueño y el rechazo de edición para cajero.
- [ ] Confirmar que Dashboard, reportes y cierres presentan únicamente datos remotos en producción.

## Fase 3 — Despliegue de funciones preparadas

Después de la Fase 1, revisar el SQL y desplegar de forma controlada, en un entorno de prueba primero:

- [ ] `20261019150000_credit_note_operations.sql` y probar cliente, venta a crédito, saldo y abono.
- [ ] `20261019151300_official_bcv_rate.sql`, Edge Function `bcv-rate-sync` y su programación.
- [ ] `20261019160000_inventory_import.sql` y probar previsualización, validación y carga transaccional.
- [ ] `20261019170000_management_modules.sql` y Edge Function `invite-user`.
- [ ] `20261103100000_persist_payment_method_settings.sql`.
- [ ] Registrar en Supabase el resultado real de cada cambio; no ejecutar de nuevo las siete migraciones ya reconciliadas con el historial remoto.

## Fase 4 — QA con roles reales

- [ ] Dueño: acceder a configuración, inventario, usuarios, proveedores, reportes y cierres.
- [ ] Cajero: vender, consultar inventario/cartera y operar caja; confirmar denegación de acciones administrativas tanto en UI como en RLS/RPC.
- [ ] Verificar venta sin stock, doble envío, error de red, pago mixto, tasa ausente/antigua, apertura duplicada y cierre sin turno.
- [ ] Verificar abono, límite de crédito y relación de venta/abono con caja una vez desplegado crédito.
- [ ] Comprobar saldos, métodos de pago, diferencias de cierre, zona horaria y exportaciones con datos de prueba.
- [ ] Ejecutar pruebas de regresión; ampliar cobertura automatizada para las operaciones críticas.

## Fase 5 — Producción

- [ ] Confirmar dominio, URLs de Auth y redirecciones de recuperación.
- [ ] Configurar variables de entorno por ambiente; `VITE_DEMO_AUTH` debe estar desactivado en producción.
- [ ] Desplegar frontend y verificar rutas SPA, HTTPS, login y recuperación.
- [ ] Acordar monitoreo de errores, procedimiento de soporte y prueba periódica de restauración.
- [ ] Hacer piloto controlado con dueño/cajero antes de declarar el sistema operativo.

## Criterio de salida

No declarar producción hasta tener una restauración probada, migraciones documentadas como aplicadas, pruebas exitosas por rol, datos de negocio sin fallback local y un despliegue probado. Reportes PDF/Excel, conciliación de pago móvil, auditoría ampliada y optimización del bundle son mejoras posteriores, salvo que sean requisitos del negocio para el piloto.
