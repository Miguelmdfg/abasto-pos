# Supabase

El proyecto remoto `abasto-pos` ya tiene el esquema aplicado y fue reanudado desde Supabase el 2026-10-19. La instancia estuvo pausada; no se deben volver a ejecutar las migraciones iniciales sobre la base existente.

## Incluye

- perfiles de usuario enlazados a `auth.users`;
- configuracion unica del negocio;
- categorias, productos e historial de precios y costos;
- tasas BCV/paralelo;
- turnos de caja con una sola apertura activa por cajero;
- ventas, lineas de venta y pagos multiples;
- clientes, notas de credito y pagos a notas (la migracion local nueva aun no esta aplicada al proyecto remoto);
- libro mayor de movimientos de inventario;
- cierres parciales y distribuciones;
- vistas de stock actual y saldo derivado de notas;
- restricciones de datos y Row Level Security basico.

## Historial remoto verificado

El historial `supabase_migrations.schema_migrations` del proyecto remoto contiene estas siete migraciones:

1. `20260909163732_initial_schema`
2. `20260909163751_transactional_sales`
3. `20260909163757_auth_profile_trigger`
4. `20260909163808_catalog_mutations`
5. `20260909163834_security_hardening`
6. `20260909163912_revoke_auth_trigger_rpc`
7. `20260909174151_remote_shift_closure`

Los nombres/versiones locales se alinearon con este historial para evitar que una futura sincronizacion intente recrear tablas existentes. La revocacion de permisos del trigger se mantiene separada, como en el historial remoto.

La lectura de la base confirmó tablas/vistas del esquema y RPC para ventas, catálogo y turnos. Hay un perfil activo con rol `dueno`, 10 productos, 6 ventas y 2 turnos, incluido 1 turno actualmente abierto. La consulta agregada no encontró ventas sin líneas, discrepancias entre total y pagos ni stock negativo. No se hicieron escrituras de datos de negocio durante esta verificacion.

RLS está habilitado en las 17 tablas públicas comprobadas. Los 7 RPC revisados no conceden ejecución al rol `anon`; 6 sí la conceden a `authenticated`. El Advisor de Supabase no reportaba hallazgos.

El proyecto usa el plan Free: la consola indica que no incluye copias de seguridad programadas. Se eligió la ruta externa gratuita con `pg_dump`, sin cambiar el plan ni iniciar cargos. El script [`backup.ps1`](backup.ps1) crea un archivo custom, comprueba que `pg_restore` pueda leerlo y calcula su SHA-256. Aún no se generó una copia: este entorno no tiene las herramientas PostgreSQL ni la contraseña de la base de datos. Antes de migrar datos o aplicar cambios al ledger, generar la copia y validar una restauración desde un entorno seguro; no compartir la contraseña por chat.

### Generar una copia manual en Windows

1. Instalar **PostgreSQL Command Line Tools** (no hace falta instalar ni iniciar un servidor local) y añadir la carpeta `bin` a `PATH`.
2. En el Dashboard, abrir **Connect** y copiar el hostname/puerto de la conexión de base de datos adecuada para la red. No pegar la URI completa ni la contraseña en una consola o chat.
3. Desde PowerShell, ejecutar `.\supabase\backup.ps1`. El script pedirá host, puerto, base, usuario y contraseña oculta; la contraseña no se escribe en los argumentos ni en los archivos del proyecto.
4. El archivo queda bajo `%LOCALAPPDATA%\AbastoPos\backups`. Verificar la ruta y SHA-256 que imprime; el archivo es sensible, cifrarlo y restringir quién puede leerlo.
5. Probar la restauración en un proyecto Supabase separado antes de considerarlo un backup operativo. Una verificación de formato no garantiza por sí sola que una restauración funcione.

El script no sube la copia a otro servicio, no modifica el proyecto Supabase y no elimina copias anteriores.

La allowlist de Auth ya incluye `http://localhost:5173/reset-password`. El `Site URL` del proyecto sigue en `http://localhost:3000`; agregar la URL real de producción cuando se confirme el dominio. No se añadió un comodín de redirección.

## Migraciones locales pendientes (no desplegadas)

Además de las siete versiones remotas ya verificadas, hay cambios posteriores preparados localmente:

- `20261019150000_credit_note_operations.sql`: operaciones de cartera/notas de crédito.
- `20261019151300_official_bcv_rate.sql`: origen y RPC para tasa oficial BCV.
- `20261019160000_inventory_import.sql`: importación de inventario transaccional desde planillas.
- `20261019170000_management_modules.sql`: proveedores y administración de perfiles.
- `20261103100000_persist_payment_method_settings.sql`: persistencia de métodos de pago habilitados en `app_settings`.
- `20261103110000_profile_avatars.sql`: rutas de avatar en perfiles, bucket privado para imágenes y permisos/RPC para que cada usuario administre su propia foto.

La Edge Function `invite-user` completa el flujo de invitaciones. Estos cambios fueron preparados en el repositorio, pero **ninguno ha sido aplicado ni desplegado en Supabase** por la espera explícita del respaldo.

## Aplicacion futura

No ejecutar otra vez las siete migraciones existentes en el proyecto remoto. Para cambios futuros, agregar una nueva migracion numerada, revisar primero su efecto y aplicarla mediante Supabase CLI autorizada o SQL Editor.

Estado de los cambios locales posteriores a la verificacion:

- Se preparó `20261019150000_credit_note_operations.sql` y su adaptador frontend para clientes, ventas a crédito, consulta de cartera y pagos en Bs. **No ejecutar ni desplegar esta migración** hasta contar con una copia restaurable y completar la revisión/QA de seguridad y negocio. Abonos en USD están bloqueados hasta tener un tipo de cambio autoritativo persistido en el servidor.
- Reportes permite filtrar ventas y cierres por fecha y exportarlos a CSV; aún no ofrece PDF/Excel ni análisis integral.
- El dashboard incluye alertas de stock bajo y de crédito por antigüedad; conserva indicadores y gráficas que requieren integración/validación adicional.
- La importación XLSX, el directorio CRUD de proveedores y la gestión/invitación de usuarios están preparados localmente. Sus migraciones/Edge Function no están desplegadas, por lo que requieren esos cambios y validación con cuentas reales antes del uso remoto.

## Sincronización de tasa oficial BCV (preparación local)

El frontend ya está preparado para leer la tasa vigente desde `exchange_rates` y no consulta APIs de terceros. La implementación local añade:

- `supabase/functions/bcv-rate-sync`: consulta la página oficial del BCV, extrae el bloque USD y su fecha de valor, y rechaza formatos inesperados o publicaciones de más de siete días.
- `20261019151300_official_bcv_rate.sql`: RPC restringido a `service_role`; diferencia tasas manuales de tasas BCV, conserva el historial y no sustituye una tasa por una publicación más antigua.
- `schedule_bcv_rate.sql`: programa consultas a las 12:00, 15:00 y 18:00 hora de Caracas (16:00, 19:00 y 22:00 UTC). La solicitud autenticada se protege con un secreto almacenado en Vault.

**No se desplegó ni se ejecutó nada en el proyecto remoto.** Después de validar una copia restaurable:

1. Aplicar `20261019151300_official_bcv_rate.sql`.
2. En **Edge Functions → Secrets**, guardar `BCV_SYNC_SECRET` (genera un secreto aleatorio y no lo compartas).
3. En **Database → Vault**, crear los secretos `abasto_supabase_url`, `abasto_publishable_key` y `abasto_bcv_sync_secret`; el último debe tener el mismo valor que `BCV_SYNC_SECRET`. La clave publishable puede obtenerse en Project Settings → API Keys.
4. Desplegar desde la carpeta del proyecto con `supabase functions deploy bcv-rate-sync --project-ref <project-ref>`.
5. Ejecutar `schedule_bcv_rate.sql` desde el SQL Editor. La tarea llama a la función a las 12:00, 15:00 y 18:00 de Caracas; las llamadas repetidas de una misma publicación no duplican el historial.

La función responde con error sin alterar la tasa vigente si el BCV no responde o cambia el formato. Si no existe una tasa marcada como verificada por BCV en Supabase, el POS bloquea el registro de ventas en vez de usar un valor manual o ficticio.

La página del BCV es una fuente HTML y no una API contractual; el parser tiene pruebas con el formato observado, pero debe probarse en el proyecto remoto y monitorearse ante cambios del sitio.

El frontend no debe insertar directamente ventas o movimientos de inventario. Esas operaciones deben ejecutarse mediante funciones PostgreSQL/RPC o endpoints protegidos que validen usuario, turno, stock y montos dentro de una transaccion.

## Configuracion local del frontend

Copiar `frontend/.env.example` a `frontend/.env.local` y completar:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_DEMO_AUTH=false
```

`VITE_DEMO_AUTH=true` solo debe usarse para una demo local con `npm run dev`. No habilitarlo en un build publicado.

## Primer dueño

1. Crear el usuario en Supabase Authentication.
2. El trigger `handle_new_auth_user` creara su perfil con rol `cajero`.
3. Cambiar ese perfil a `dueno` desde el SQL Editor:

```sql
update public.profiles
set role = 'dueno', updated_at = now()
where email = 'dueno@tu-negocio.com';
```

El frontend ya lee el catálogo remoto y utiliza RPC para apertura/cierre de turnos y ventas. Las nuevas operaciones de crédito, importación, proveedores, usuarios y sincronización BCV están preparadas solo en el código local; dependen de las migraciones/Edge Functions pendientes indicadas arriba.
