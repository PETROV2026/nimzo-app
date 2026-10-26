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
   | `VITE_TURNSTILE_SITE_KEY` | Site Key del widget de Cloudflare Turnstile (ver abajo) |
   | `ENABLE_EXPERIMENTAL_COREPACK` | `1` (usa la versión de pnpm fijada en `package.json`) |

   Son públicas (van dentro del panel). Nunca pongas aquí la `service_role` de Supabase.

4. **Deploy**. Al terminar, Vercel da una dirección `*.vercel.app`.
5. En **Settings → Git → Production Branch** elige `main`. Los PRs y las demás ramas quedan como vistas previas.

## Publicaciones siguientes

- Mezcla a `main` y Vercel publica solo.
- Si cambias una variable, vuelve a publicar (**Deployments → ⋯ → Redeploy**): las variables `VITE_*` se incrustan al compilar.

## Captcha del login (Cloudflare Turnstile)

El login del panel pide un captcha. El panel manda correo, contraseña y captcha a la Edge Function `admin-login`, que verifica el captcha con Cloudflare, inicia sesión y solo regresa la sesión si la cuenta es un administrador activo. La app móvil no usa captcha.

1. En el panel de Cloudflare, **Turnstile → Add widget**. Modo **Managed**. En **Hostnames** agrega el dominio del panel (`nimzo-app-web.vercel.app` y el dominio propio, si hay) y `localhost` para desarrollo.
2. Copia la **Site Key** a `VITE_TURNSTILE_SITE_KEY` en Vercel y en `apps/admin/.env`.
3. El líder de software guarda la **Secret Key** en Supabase y publica la función (una sola vez, y de nuevo cuando cambie la función):

   ```bash
   pnpm supabase secrets set TURNSTILE_SECRET_KEY=<secret key>
   pnpm supabase functions deploy admin-login
   ```

4. Vuelve a publicar el panel en Vercel.

La función debe estar publicada antes que el panel nuevo; si no, nadie puede entrar al panel.

## Dominio propio

**Settings → Domains → Add** y sigue las instrucciones del registro DNS (en GoDaddy: **Mis dominios → DNS**, agrega el registro `CNAME` o `A` que indique Vercel).

## Si algo falla

| Síntoma | Causa probable |
|---|---|
| La compilación falla en "Install" con un error de pnpm | Falta `ENABLE_EXPERIMENTAL_COREPACK=1` en las variables |
| Página en blanco con un error de Supabase | Faltan `VITE_SUPABASE_URL` o `VITE_SUPABASE_ANON_KEY`; agrégalas y vuelve a publicar |
| 404 al recargar `/clients` u otra dirección | El **Root Directory** no es `apps/admin`, así que Vercel no lee `vercel.json` |
| No puedes iniciar sesión | Solo entran usuarios `admin` activos; revisa el usuario en Supabase |
| "Falta configurar la verificación de seguridad" | Falta `VITE_TURNSTILE_SITE_KEY`; agrégala y vuelve a publicar |
| "La verificación de seguridad falló" en todos los intentos | La Secret Key en Supabase no corresponde a la Site Key, o el dominio no está en los Hostnames del widget |
| "No se pudo iniciar sesión" siempre, con datos correctos | La función `admin-login` no está publicada o falta `TURNSTILE_SECRET_KEY` |
