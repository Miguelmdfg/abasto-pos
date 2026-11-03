# 07 — Configuración real de autenticación para Supabase

## Objetivo

Dejar el proyecto listo para usar autenticación real en vez de usuarios hardcodeados o fallback local.

## 1) Crear el proyecto Supabase

1. Crear un proyecto nuevo en Supabase.
2. Guardar la URL del proyecto y la clave anónima.
3. No usar `VITE_DEMO_AUTH=true` en producción.

## 2) Variables de entorno

Crear el archivo `frontend/.env.local` a partir de `frontend/.env.local.example`:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
VITE_DEMO_AUTH=false
```

## 3) URLs de recuperación

En Supabase, configurar **Authentication → URL Configuration** para permitir la URL de recuperación en cada entorno:

- Desarrollo local: `http://localhost:5173/reset-password`
- Producción: `https://<dominio-publicado>/reset-password`

El frontend genera la redirección usando el origen actual. Supabase rechazará el enlace si el dominio no está en la lista de URLs permitidas.

Verificación del proyecto actual (2026-10-19): se agregó `http://localhost:5173/reset-password` a la allowlist. El `Site URL` continúa en `http://localhost:3000`; configurar el dominio exacto de producción cuando se decida y publicar la app. No se configuraron comodines.

## 4) Estado del esquema remoto

El esquema ya está aplicado en el proyecto remoto. **No volver a ejecutar estas migraciones en esa base.** El historial remoto verificado contiene:

- `20260909163732_initial_schema.sql`
- `20260909163751_transactional_sales.sql`
- `20260909163757_auth_profile_trigger.sql`
- `20260909163808_catalog_mutations.sql`
- `20260909163834_security_hardening.sql`
- `20260909163912_revoke_auth_trigger_rpc.sql`
- `20260909174151_remote_shift_closure.sql`

Para otro entorno, aplicar las migraciones una vez y comprobar que sus versiones se registren correctamente.

## 5) Crear el primer usuario real

En Supabase Auth:

1. crear usuario del dueño;
2. dejar el email real;
3. configurar la contraseña;
4. confirmar la cuenta si se requiere.

El trigger `handle_new_auth_user` crea automáticamente el perfil en `public.profiles` con rol `cajero`.

## 6) Promover a dueño

Ejecutar este SQL en el SQL editor de Supabase:

```sql
update public.profiles
set role = 'dueno', updated_at = now()
where email = 'dueno@tu-negocio.com';
```

## 7) Verificar uso

La app estará lista cuando:

- el login ya no cae al modo demo;
- `supabase.auth.signInWithPassword` funciona;
- `auth.getSession` restaura la sesión al recargar;
- el usuario se identifica con `profiles` y su rol correcto;
- el frontend usa permisos reales y no solo `localStorage`.

## 8) Recomendación

Mantener `VITE_DEMO_AUTH=false` en todos los ambientes reales. Solo usar `true` en desarrollo local aislado y nunca en build de producción.
