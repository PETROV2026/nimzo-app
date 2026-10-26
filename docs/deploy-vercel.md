# Publicar el panel de administración en Vercel

Vercel compila el panel directamente desde GitHub: cada push genera una vista previa y cada merge a la rama de producción publica la versión activa. La configuración vive en `apps/admin/vercel.json` (comandos, rutas del panel y cabeceras de seguridad), así que en Vercel solo se eligen la carpeta y las variables.

## Configuración (una sola vez)

1. En [vercel.com/new](https://vercel.com/new), **Import Git Repository** → `PETROV2026/nimzo-app`. Si no aparece, en **Adjust GitHub App Permissions** dale acceso al repositorio.
2. **Root Directory**: `apps/admin` (botón **Edit**). Vercel detecta Vite y toma el resto de `vercel.json`; no cambies los comandos.
3. **Environment Variables** (las mismas de `apps/admin/.env`):

   | Nombre | Valor |
   |---|---|
   | `VITE_SUPABASE_URL` | URL del proyecto de Supabase |
   | `VITE_SUPABASE_ANON_KEY` | clave pública (anon) |
   | `ENABLE_EXPERIMENTAL_COREPACK` | `1` (usa la versión de pnpm fijada en `package.json`) |

   Son públicas (van dentro del panel). Nunca pongas aquí la `service_role` de Supabase.

4. **Deploy**. Al terminar, Vercel da una dirección `*.vercel.app`.
5. En **Settings → Git → Production Branch** elige `main`. Los PRs y las demás ramas quedan como vistas previas.

## Publicaciones siguientes

- Mezcla a `main` y Vercel publica solo.
- Si cambias una variable, vuelve a publicar (**Deployments → ⋯ → Redeploy**): las variables `VITE_*` se incrustan al compilar.

## Dominio propio

**Settings → Domains → Add** y sigue las instrucciones del registro DNS (en GoDaddy: **Mis dominios → DNS**, agrega el registro `CNAME` o `A` que indique Vercel).

## Si algo falla

| Síntoma | Causa probable |
|---|---|
| La compilación falla en "Install" con un error de pnpm | Falta `ENABLE_EXPERIMENTAL_COREPACK=1` en las variables |
| Página en blanco con un error de Supabase | Faltan `VITE_SUPABASE_URL` o `VITE_SUPABASE_ANON_KEY`; agrégalas y vuelve a publicar |
| 404 al recargar `/clients` u otra dirección | El **Root Directory** no es `apps/admin`, así que Vercel no lee `vercel.json` |
| No puedes iniciar sesión | Solo entran usuarios `admin` activos; revisa el usuario en Supabase |
