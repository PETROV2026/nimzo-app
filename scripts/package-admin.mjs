import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const out = join(root, 'apps/admin/deploy');
const basePath = `/${(process.env.VITE_BASE_PATH ?? '/').trim().replace(/^\/+|\/+$/g, '')}`.replace(
  /^\/$/,
  '',
);

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
cpSync(join(root, 'apps/admin/dist'), join(out, 'public'), { recursive: true });
cpSync(join(root, 'apps/admin/server/server.js'), join(out, 'server.js'));
cpSync(join(root, 'apps/admin/server/package.json'), join(out, 'package.json'));
writeFileSync(
  join(out, 'config.json'),
  `${JSON.stringify({ basePath: basePath || '/' }, null, 2)}\n`,
);
writeFileSync(
  join(out, 'README.md'),
  `# nimzo-admin (generated)\n\nBuilt from commit ${process.env.GITHUB_SHA ?? 'local'} by .github/workflows/deploy-admin.yml. Do not edit this branch: it is replaced on every deploy.\n`,
);

console.log(`Admin package ready in apps/admin/deploy (base path ${basePath || '/'})`);
