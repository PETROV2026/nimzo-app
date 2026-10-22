# Publicar el panel de administración en GoDaddy (app de Node.js)

El panel se publica en una ruta de tu dominio actual, por ejemplo `https://tudominio.com/admin`, como una **app de Node.js de cPanel**. No usa un dominio ni un subdominio nuevo, así que no cuenta contra el límite de dominios del plan.

```
merge a main ──► GitHub Actions: compila el panel y arma el paquete (pnpm admin:package)
                                 └─► lo sube por FTPS a la carpeta de la app ──► tudominio.com/admin
```

El hosting no compila nada ni instala dependencias: recibe un servidor `server.js` sin dependencias y el panel ya compilado.

```
nimzo-admin/              carpeta de la app en el hosting
├── server.js             servidor (archivo de inicio)
├── package.json
├── config.json           ruta base del panel (por ejemplo /admin)
├── public/               el panel compilado
└── tmp/restart.txt       cambia en cada publicación para reiniciar la app
```

## Configuración (una sola vez)

### 1. Crear la app de Node.js

cPanel → **Setup Node.js App** → **Create Application** (si ya creaste una antes, edítala con estos valores o bórrala y créala de nuevo):

| Campo | Valor |
|---|---|
| **Node.js version** | La más alta que ofrezca (mínimo 18) |
| **Application mode** | Production |
| **Application root** | `nimzo-admin` (carpeta fuera de `public_html`) |
| **Application URL** | tu dominio y, en el campo de la derecha, `admin` |
| **Application startup file** | `server.js` |

Presiona **Create**. No hace falta agregar variables de entorno ni presionar **Run NPM Install**: el servidor no tiene dependencias.

Si eliges otra ruta en lugar de `admin` (por ejemplo `panel`), anótala para el paso 3.

### 2. Crear una cuenta FTP solo para la app

1. cPanel → **FTP Accounts** → **Add FTP Account**.
2. Usuario: `deploy-admin` (queda como `deploy-admin@tudominio.com`).
3. Contraseña: usa **Password Generator** y guárdala.
4. **Directory**: `nimzo-admin` (la misma carpeta del paso 1). Así esta cuenta solo puede tocar la app.
5. En **Configure FTP Client** anota el **servidor FTP** (normalmente `ftp.tudominio.com`).

### 3. Guardar los datos en GitHub

Repositorio → **Settings → Environments → New environment** → nombre `production`.

**Environment secrets:**

| Nombre | Valor |
|---|---|
| `FTP_SERVER` | el servidor FTP del paso 2, sin `ftp://` |
| `FTP_USERNAME` | `deploy-admin@tudominio.com` |
| `FTP_PASSWORD` | la contraseña del paso 2 |

**Environment variables:**

| Nombre | Valor |
|---|---|
| `VITE_SUPABASE_URL` | la de `apps/admin/.env` |
| `VITE_SUPABASE_ANON_KEY` | la de `apps/admin/.env` |
| `ADMIN_BASE_PATH` | solo si no usaste `admin` en el paso 1, por ejemplo `/panel` |

Nunca pongas aquí la `service_role` de Supabase. Recomendado: en **Deployment branches** elige **Selected branches** y agrega `main`.

### 4. Primera publicación

GitHub → **Actions → Deploy admin → Run workflow** (rama `main`). Tarda unos 3 minutos. Después:

1. cPanel → **Setup Node.js App** → presiona **Restart** en la app (solo esta primera vez).
2. Abre `https://tudominio.com/admin`.

En las siguientes publicaciones la app se reinicia sola (`tmp/restart.txt`).

## Qué hace `server.js`

- Sirve el panel desde `public/`, también cuando Passenger le entrega la ruta con o sin el prefijo `/admin`.
- Las direcciones del panel (`/admin/clients/1/edit`, `/admin/packages/3`…) funcionan al recargar.
- Caché de un año para `assets/` (cambian de nombre en cada versión) y sin caché para `index.html`; compresión gzip.
- Cabeceras de seguridad: no se puede mostrar el panel dentro de otro sitio, y el navegador solo carga scripts del propio panel y solo se conecta a Supabase.
- Nunca entrega archivos fuera de `public/` (ni `server.js` ni `config.json`).

Para probarlo en tu computadora: `VITE_BASE_PATH=/admin pnpm admin:package`, luego `cd apps/admin/deploy && PORT=3000 node server.js` y abre `http://localhost:3000/admin`.

## Si algo falla

| Síntoma | Causa probable |
|---|---|
| El workflow falla en **Upload** con error de conexión | Servidor FTP mal escrito, o tu plan no acepta FTPS. Si solo acepta FTP sin cifrar, cambia `protocol: ftps` por `ftp` en `.github/workflows/deploy-admin.yml` |
| Error de login en **Upload** | Usuario o contraseña FTP. El usuario lleva `@tudominio.com` |
| `tudominio.com/admin` muestra "Incomplete response" o error 503 | La app no arrancó: revisa en **Setup Node.js App** que el archivo de inicio sea `server.js` y presiona **Restart**. El registro de errores está en la carpeta `nimzo-admin` (archivo `stderr.log`) |
| Página en blanco y en la consola del navegador aparecen errores 404 de `/assets/` | La ruta de la app no coincide con `ADMIN_BASE_PATH`. Deben ser iguales |
| Página en blanco con un error de Supabase | Faltan `VITE_SUPABASE_URL` o `VITE_SUPABASE_ANON_KEY` en el environment `production` |
| Sigue viéndose la versión anterior | Recarga sin caché (Ctrl + Shift + R); si persiste, **Restart** en la app |
