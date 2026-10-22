import { execSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

function gitCommit() {
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return 'unknown';
  }
}

const migrations = readdirSync(path.resolve(import.meta.dirname, '../../supabase/migrations'))
  .filter((file) => file.endsWith('.sql'))
  .map((file) => file.replace(/\.sql$/, ''))
  .sort();

function basePath() {
  const value = process.env.VITE_BASE_PATH?.trim() || '/';
  return `/${value.replace(/^\/+|\/+$/g, '')}/`.replace(/^\/\/$/, '/');
}

export default defineConfig({
  base: basePath(),
  plugins: [react()],
  define: {
    __APP_COMMIT__: JSON.stringify(gitCommit()),
    __APP_BUILT_AT__: JSON.stringify(new Date().toISOString()),
    __APP_MIGRATIONS__: JSON.stringify(migrations),
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'vendor',
              test: /node_modules[\\/](react|react-dom|scheduler|react-router|@mui[\\/](material|system|utils|styled-engine|private-theming)|@emotion[\\/][^\\/]+|@supabase[\\/][^\\/]+|@refinedev[\\/]core|@tanstack[\\/][^\\/]+)[\\/]/,
            },
          ],
        },
      },
    },
  },
});
