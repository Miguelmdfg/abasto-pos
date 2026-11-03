# 05 — Estado técnico y pendientes

> Revisión del código local: 2026-11-03. El estado remoto descrito aquí es el último verificado el 2026-10-19; no se consultó Supabase durante esta revisión.

## Resumen

El frontend activo ya usa Supabase para autenticación, catálogo, ventas transaccionales y turnos. No es correcto describirlo como un prototipo que guarda todo en `localStorage`. En modo Supabase, ventas, turnos y tasas históricas se leen de la base; clientes/notas de crédito también tienen adaptadores remotos, pero estos dependen de migraciones que siguen pendientes de despliegue. Los datos locales de negocio se conservan solo para el modo demo/desarrollo.

Se conectó la configuración del negocio con `app_settings` y se eliminó la mezcla de cierres remotos con cierres locales. La lectura y guardado remotos de configuración requieren la nueva migración `20261103100000_persist_payment_method_settings.sql`; hasta aplicarla, la app informa el error y bloquea ventas en vez de aceptar valores por defecto.

## Estado por área

| Área | Código local | Estado remoto conocido | Pendiente |
|---|---|---|---|
| Auth y perfiles | Supabase Auth, roles/perfil y rutas protegidas | Siete migraciones verificadas el 2026-10-19 | Probar sesión, recuperación y permisos con cuentas reales de dueño y cajero |
| Catálogo e inventario | Lectura/mutaciones por RPC; movimientos y stock remoto | RPC y tablas base verificadas | Probar casos operativos; importar XLSX solo después de desplegar su migración |
| Ventas y pagos | RPC transaccional, validación de stock y pagos múltiples; historial remoto | RPC/tablas base verificadas | Prueba integral concurrente y prueba funcional con cajero |
| Caja | Apertura/cierre remoto; cierres remotos reemplazan el historial mostrado | Migración base de turnos/cierre verificada | Completar arqueo por método y asociar abonos a turnos; validar el flujo real |
| Clientes/notas de crédito | Adaptador para clientes, ventas a crédito, saldos y pagos remotos | Migración/RPC de crédito no aplicados | Respaldo restaurable, despliegue controlado y QA; pagos USD siguen fuera de alcance |
| Tasa BCV | Consulta remota de tasa y lectura remota del historial | Migración, Edge Function y programación BCV no desplegadas | Aplicar y desplegar según `supabase/README.md`; comprobar tasa actualizada y manejo de fallos |
| Configuración | Lectura/escritura remota de `app_settings`; evita guardar configuración de negocio localmente cuando Supabase está activo | La columna de métodos de pago requiere migración nueva; el resto del esquema base fue verificado en octubre | Aplicar migración de métodos de pago y probar lectura/guardado con dueño y denegación para cajero |
| Costos | Calculadora en memoria; lee catálogo y costos actuales | No verificado en este ciclo | Las entradas y precios calculados no se persisten; decidir si pasan a `product_cost_history` o a un modelo de costos propio |
| Preferencias UI | Tema e idioma locales | No aplica: preferencia por navegador | Aceptable que no se sincronicen |
| Reportes/dashboard | CSV de ventas y cierres; dashboard usa ventas/catálogo cargados | No se verificó en este ciclo | Validar KPIs, zonas horarias, filtros y saldos con datos de operación |
| Proveedores/usuarios/importación | Pantallas y adaptadores locales preparados | Migraciones/Edge Function aún no verificadas como desplegadas | Respaldar, desplegar y probar permisos antes de habilitar para uso real |

## Persistencia y fuente de verdad

- Con Supabase configurado, ventas, catálogo, turnos, cartera y tasas se consultan de Supabase; una falla de lectura se muestra como error y no se sustituye por una lista local.
- Las ventas y cierres locales solo se usan en modo demo sin Supabase. Los métodos que podrían crear o borrar registros locales rechazan la operación cuando Supabase está activo.
- La configuración empresarial se guarda remotamente en `app_settings`. Si no puede cargarse, el POS impide registrar ventas hasta recuperar la configuración.
- El módulo Costos no usa `localStorage`, pero sus parámetros y precios manuales solo viven en memoria y se pierden al salir; no es una fuente de costos persistente.
- Tema e idioma siguen en `localStorage` porque son preferencias del dispositivo, no datos del negocio.
- La presencia de migraciones en el repositorio no demuestra que estén aplicadas en el proyecto remoto.

## Pendientes ordenados

1. Crear una copia de Supabase y probar su restauración en un proyecto separado. Procedimiento: [`../supabase/README.md`](../supabase/README.md).
2. Solo después de validar la restauración, revisar y desplegar en orden las migraciones locales aún pendientes: crédito, tasa BCV, importación, administración y métodos de pago.
3. Desplegar y comprobar las Edge Functions/programaciones necesarias para BCV e invitación de usuarios.
4. Probar RLS y flujos completos con cuentas reales de dueño y cajero, incluyendo fallos de conexión, falta de stock, pagos mixtos, cierre y abono.
5. Completar auditoría, monitoreo, resolución del dominio de producción y política operativa de backups.
6. Completar reportes (por vendedor/método/producto, PDF/Excel), métricas del dashboard y conciliación de pago móvil.

## Verificación local

El 2026-11-03, `npm run build` pasó y las 21 pruebas pasaron. `npm run lint` terminó sin errores y mantiene tres advertencias existentes de Fast Refresh en `auth.tsx`. Vite advierte que el chunk principal supera 500 kB.
