import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const out = join(root, 'apps/admin/deploy');
const basePath = `/${(process.env.VITE_BASE_PATH ?? '/').trim().replace(/^\/+|\/+$/g, '')}`.replace(
  /^\/$/,
  '',
);

rmSync(out, { recursive: true, force: true });
mkdirSync(join(out, 'tmp'), { recursive: true });
cpSync(join(root, 'apps/admin/dist'), join(out, 'public'), { recursive: true });
cpSync(join(root, 'apps/admin/server/server.js'), join(out, 'server.js'));
cpSync(join(root, 'apps/admin/server/package.json'), join(out, 'package.json'));
writeFileSync(
  join(out, 'config.json'),
  `${JSON.stringify({ basePath: basePath || '/' }, null, 2)}\n`,
);
writeFileSync(
  join(out, 'tmp/restart.txt'),
  `${process.env.GITHUB_SHA ?? new Date().toISOString()}\n`,
);

console.log(`Admin package ready in apps/admin/deploy (base path ${basePath || '/'})`);
