import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
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
