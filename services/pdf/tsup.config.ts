import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node20',
  clean: true,
  // @nimzo/shared ships TypeScript sources, so bundle it into the output.
  noExternal: ['@nimzo/shared'],
});
