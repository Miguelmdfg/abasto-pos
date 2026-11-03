# Despliegue en Cloudflare Pages

Configuracion recomendada:

- Framework preset: Vite
- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Node version: 20 o superior

Variables de produccion:

```env
VITE_SUPABASE_URL=https://qxymjbyfippbjpesbqbu.supabase.co
VITE_SUPABASE_ANON_KEY=<clave-publicable-de-supabase>
VITE_DEMO_AUTH=false
```

El archivo `public/_redirects` mantiene funcionando `BrowserRouter` al recargar rutas internas.

No configurar nunca la `service_role key` en Cloudflare Pages ni en el frontend.
