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
   | `VITE_SENTRY_DSN` | DSN del proyecto `nimzo-admin` en Sentry (**Settings → Projects → nimzo-admin → Client Keys**) |
   | `ENABLE_EXPERIMENTAL_COREPACK` | `1` (usa la versión de pnpm fijada en `package.json`) |
   | `SENTRY_AUTH_TOKEN` | token de organización de Sentry (**Settings → Auth Tokens**). Es **secreto**: márcalo como *Sensitive* |

   Todas, menos `SENTRY_AUTH_TOKEN`, son públicas (van dentro del panel). Nunca pongas aquí la `service_role` de Supabase. `SENTRY_AUTH_TOKEN` solo se usa al compilar: sube los source maps a Sentry para que los errores muestren la línea del código fuente, y después se borran del build, así que nunca se publican. Sin el token, el panel funciona igual y los errores llegan, pero con el código compilado.

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

## Verificación en dos pasos de los administradores

Cada administrador confirma su identidad con un código de 6 dígitos de una app de autenticación (Google Authenticator, Microsoft Authenticator o similar). La primera vez, después del correo, la contraseña y el captcha, el panel muestra un código QR para registrar la app; después solo pide el código. La base de datos también lo exige: una sesión de administrador sin el código no ve datos de los técnicos y no puede administrar usuarios. Los técnicos no usan 2FA.

En Supabase, **una sola vez**:

1. **Authentication → Multi-Factor** (o **Sign In / Providers → Multi-Factor Authentication**): **TOTP (App Authenticator)** activado.
2. **Authentication → Sign In / Providers → Email**: **Minimum password length** = 8 y **Password requirements** = *Lowercase, uppercase letters and digits*.

Orden para publicarlo, porque la migración exige el código a los administradores:

1. Unir el cambio y publicar el panel (que ya pide el código) en producción.
2. Cada administrador entra al panel y registra su app de autenticación.
3. Aplicar la migración `admins_require_mfa` (`pnpm supabase db push`) y publicar de nuevo la función `admin-users`.

Si la migración se aplica antes de que el panel de producción pida el código, los administradores entran pero no ven datos.

**Si un administrador pierde su teléfono:** en Supabase, **Authentication → Users**, abre su usuario y elimina su factor de autenticación (MFA). La próxima vez que entre al panel registrará una app nueva. Hazlo solo después de confirmar la identidad de la persona por otro medio.

## Dominio propio

**Settings → Domains → Add** y sigue las instrucciones del registro DNS (en GoDaddy: **Mis dominios → DNS**, agrega el registro `CNAME` o `A` que indique Vercel).

Las funciones `admin-login` y `admin-users` solo aceptan llamadas del navegador desde los dominios permitidos. Sin configurar nada, son `https://nimzo-app-web.vercel.app` y `http://localhost:5173`. Al agregar un dominio propio, guarda la lista completa (separada por comas) en el secreto `ALLOWED_ORIGINS` de Supabase (**Edge Functions → Secrets**, o `pnpm supabase secrets set ALLOWED_ORIGINS=https://nimzo-app-web.vercel.app,https://panel.tudominio.com,http://localhost:5173`). La lista reemplaza a la predeterminada, así que incluye todos los dominios que se usen. Agrega el mismo dominio a los **Hostnames** del widget de Turnstile.

## Si algo falla

| Síntoma | Causa probable |
|---|---|
| La compilación falla en "Install" con un error de pnpm | Falta `ENABLE_EXPERIMENTAL_COREPACK=1` en las variables |
| Página en blanco con un error de Supabase | Faltan `VITE_SUPABASE_URL` o `VITE_SUPABASE_ANON_KEY`; agrégalas y vuelve a publicar |
| 404 al recargar `/clients` u otra dirección | El **Root Directory** no es `apps/admin`, así que Vercel no lee `vercel.json` |
| No puedes iniciar sesión | Solo entran usuarios `admin` activos; revisa el usuario en Supabase |
| "Falta configurar la verificación de seguridad" | Falta `VITE_TURNSTILE_SITE_KEY`; agrégala y vuelve a publicar |
| "Origen no permitido" al iniciar sesión o administrar usuarios | El dominio desde el que abres el panel no está en `ALLOWED_ORIGINS` (ver **Dominio propio**) |
| "La verificación de seguridad falló" en todos los intentos | La Secret Key en Supabase no corresponde a la Site Key, o el dominio no está en los Hostnames del widget |
| "No se pudo iniciar sesión" siempre, con datos correctos | La función `admin-login` no está publicada o falta `TURNSTILE_SECRET_KEY` |
