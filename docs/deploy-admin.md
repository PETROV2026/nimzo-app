# Publicar el panel de administración en GoDaddy

El panel es una página estática: no necesita Node.js en el servidor. GitHub Actions lo compila y lo sube por FTPS a GoDaddy, y Apache (el servidor web de GoDaddy) lo sirve.

```
merge a main ──► GitHub Actions: instala, compila (pnpm --filter @nimzo/admin build)
                                 └─► sube apps/admin/dist/ por FTPS ──► admin.tudominio.com
```

Cada vez que se mezcla a `main` un cambio del panel, se publica solo. También se puede publicar a mano desde GitHub: **Actions → Deploy admin → Run workflow**.

## Configuración (una sola vez)

### 1. Quitar la app de Node.js en cPanel

Si creaste una app en **cPanel → Setup Node.js App** para este dominio, elimínala (**Stop App** y luego el ícono de basura). Esa app intercepta las visitas al dominio y no deja que Apache sirva el panel. La conexión de **Git Version Control** también se puede quitar: la publicación la hace GitHub Actions.

### 2. Crear el subdominio

1. cPanel → **Domains** (o **Subdomains**) → **Create A New Domain**.
2. Dominio: `admin.tudominio.com`.
3. Desmarca "Share document root" y deja la carpeta que propone, por ejemplo `/home/USUARIO/admin.tudominio.com`. Anota esa ruta.
4. Si el DNS del dominio está en GoDaddy, el subdominio queda apuntado solo. Puede tardar unos minutos.

### 3. Activar HTTPS

cPanel → **SSL/TLS Status** → selecciona `admin.tudominio.com` → **Run AutoSSL**. En unos minutos debe aparecer con candado verde. El `.htaccess` del panel redirige siempre a HTTPS.

### 4. Crear una cuenta FTP solo para el panel

1. cPanel → **FTP Accounts** → **Add FTP Account**.
2. Usuario: `deploy-admin` (queda como `deploy-admin@tudominio.com`).
3. Contraseña: usa **Password Generator** y guárdala.
4. **Directory**: la carpeta del subdominio del paso 2 (por ejemplo `admin.tudominio.com`). Así esta cuenta solo puede tocar el panel, no el resto del sitio.
5. En la misma página, en **Special FTP Accounts** o **Configure FTP Client**, anota el **servidor FTP** (normalmente `ftp.tudominio.com` o la IP del hosting).

### 5. Guardar los datos en GitHub

En GitHub: repositorio → **Settings → Environments → New environment** → nombre `production`.

Dentro de `production`, agrega:

**Environment secrets** (nadie los puede volver a ver):

| Nombre | Valor |
|---|---|
| `FTP_SERVER` | el servidor FTP del paso 4, sin `ftp://` (ej. `ftp.tudominio.com`) |
| `FTP_USERNAME` | `deploy-admin@tudominio.com` |
| `FTP_PASSWORD` | la contraseña del paso 4 |

**Environment variables** (son públicas, van dentro del panel):

| Nombre | Valor |
|---|---|
| `VITE_SUPABASE_URL` | la de `apps/admin/.env` |
| `VITE_SUPABASE_ANON_KEY` | la de `apps/admin/.env` |

Nunca pongas aquí la `service_role` de Supabase.

Opcional pero recomendado: en el environment `production`, en **Deployment branches**, elige **Selected branches** y agrega `main`, para que solo `main` pueda publicar.

### 6. Primera publicación

GitHub → **Actions → Deploy admin → Run workflow** (rama `main`). Tarda 2–3 minutos. Cuando termine en verde, abre `https://admin.tudominio.com`.

## Qué incluye el `.htaccess`

`apps/admin/public/.htaccess` se copia a la carpeta publicada y hace que:

- Las direcciones del panel (`/clients/1/edit`, `/packages/3`…) funcionen al recargar o al abrirlas desde un enlace.
- Todo vaya por HTTPS.
- Los archivos de `assets/` se guarden en caché un año (cambian de nombre en cada versión) e `index.html` nunca, para que cada publicación se vea al instante.
- Se envíen cabeceras de seguridad: no se puede mostrar el panel dentro de otro sitio, y el navegador solo carga scripts del propio panel y solo se conecta a Supabase.

## Si algo falla

| Síntoma | Causa probable |
|---|---|
| El workflow falla en **Upload** con error de conexión | Servidor FTP mal escrito, o tu plan no acepta FTPS. Revisa `FTP_SERVER`; si GoDaddy solo acepta FTP sin cifrar, cambia `protocol: ftps` por `ftp` en `.github/workflows/deploy-admin.yml` |
| Error de login en **Upload** | Usuario o contraseña FTP. El usuario lleva `@tudominio.com` |
| La página abre en blanco con un error de Supabase | Faltan `VITE_SUPABASE_URL` o `VITE_SUPABASE_ANON_KEY` en el environment `production` |
| Al recargar `/clients` sale error 404 | El `.htaccess` no se subió o el hosting no tiene `mod_rewrite`; revisa que exista en la carpeta del subdominio (el Administrador de archivos oculta los archivos que empiezan con punto: activa "Show Hidden Files") |
| Sigue viéndose la versión anterior | Recarga sin caché (Ctrl + Shift + R) |
