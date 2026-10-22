# Publicar el panel de administración en GoDaddy Node.js Hosting

El panel se publica en **GoDaddy Node.js Hosting** (app `nimzo-admin`, dirección `*.airoapp.ai`). Ese hosting toma una rama de GitHub y ejecuta `npm install`, `npm run build` y `npm start` ([requisitos de GoDaddy](https://developer.godaddy.com/en/docs/api-users/hosting/app-requirements)).

Esos comandos no pueden compilar este monorepo (usa pnpm y paquetes internos). Por eso GitHub Actions compila el panel y deja el resultado listo en una rama aparte, **`deploy-admin`**, que es la que lee GoDaddy:

```
merge a main ──► GitHub Actions: compila el panel (pnpm admin:package)
                                 └─► reemplaza la rama deploy-admin
                                         └─► GoDaddy: npm install (nada), npm run build (nada), npm start
```

La rama `deploy-admin` se genera sola en cada publicación. **No la edites ni hagas PRs hacia ella.** Contiene:

```
server.js        servidor sin dependencias (npm start)
package.json     sin dependencias; build vacío y start = node server.js
config.json      ruta base del panel (/)
public/          el panel compilado
```

## Configuración (una sola vez)

### 1. Variables en GitHub

Repositorio → **Settings → Secrets and variables → Actions → Variables → New repository variable**:

| Nombre | Valor |
|---|---|
| `VITE_SUPABASE_URL` | la de `apps/admin/.env` |
| `VITE_SUPABASE_ANON_KEY` | la de `apps/admin/.env` |

Son públicas (van dentro del panel). Nunca pongas aquí la `service_role` de Supabase.

### 2. Primera publicación a la rama `deploy-admin`

Mezcla `develop` a `main` con un PR, o ve a GitHub → **Actions → Deploy admin → Run workflow** (rama `main`). Al terminar en verde (2–3 minutos) aparece la rama `deploy-admin` en el repositorio.

### 3. Apuntar la app de GoDaddy a `deploy-admin`

1. En GoDaddy, abre la app **nimzo-admin** → ícono de engrane (**Configuración**).
2. Cambia la **rama** de `main` a **`deploy-admin`** y guarda. Si la rama no se puede cambiar, crea una app nueva conectada al mismo repositorio eligiendo la rama `deploy-admin`, y elimina la anterior.
3. **Ruta raíz** (prefijo de ruta): `/`.
4. Tiempo de ejecución: Node.js 22.
5. No hace falta agregar secretos en GoDaddy: el panel ya lleva sus variables públicas desde GitHub.

### 4. Probar y publicar

1. **Actualizar vista previa**. Espera a que "Estado de la compilación" quede en verde.
2. Abre la URL de vista previa (con tu sesión de GoDaddy iniciada) e inicia sesión en el panel.
3. Si todo está bien, **Publicar como activo**.

Para usar tu propio dominio, en la app → **Conectar un dominio a medida**.

## Publicaciones siguientes

1. Mezcla a `main` (PR de `develop` a `main`). GitHub Actions actualiza `deploy-admin` solo.
2. En GoDaddy: **Actualizar vista previa** y, si todo está bien, **Publicar como activo**.

## Qué hace `server.js`

- Sirve el panel desde `public/` y escucha en el puerto que asigna GoDaddy (`PORT`).
- Las direcciones del panel (`/clients/1/edit`, `/packages/3`…) funcionan al recargar.
- Caché de un año para `assets/` (cambian de nombre en cada versión) y sin caché para `index.html`; compresión gzip.
- Cabeceras de seguridad: no se puede mostrar el panel dentro de otro sitio, y el navegador solo carga scripts del propio panel y solo se conecta a Supabase.
- Nunca entrega archivos fuera de `public/`.

Para probarlo en tu computadora igual que GoDaddy: `pnpm admin:package`, luego en `apps/admin/deploy` ejecuta `npm install && npm run build && PORT=3000 npm start` y abre `http://localhost:3000`.

## Si algo falla

| Síntoma | Causa probable |
|---|---|
| GoDaddy muestra **502** o "Mal estado" | La app sigue leyendo `main` en lugar de `deploy-admin` (paso 3), o todavía no corres el paso 2. Revisa **Registros de la aplicación** |
| El workflow **Deploy admin** falla en "Publish" | Revisa en Settings → Actions → General que **Workflow permissions** permita escritura (*Read and write permissions*) |
| Página en blanco con un error de Supabase | Faltan `VITE_SUPABASE_URL` o `VITE_SUPABASE_ANON_KEY` en las variables de GitHub (paso 1); vuelve a correr el workflow |
| La vista previa no se abre | GoDaddy exige tener la sesión iniciada en tu cuenta para ver la vista previa; la versión publicada no |
| Sigue viéndose la versión anterior | En GoDaddy, **Actualizar vista previa** y **Publicar como activo**; luego recarga sin caché (Ctrl + Shift + R) |
