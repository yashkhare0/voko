import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/cli.ts'],
  splitting: false,
  sourcemap: true,
  clean: true,
  dts: false,
  format: ['esm', 'cjs'],
  banner: {
    js: '#!/usr/bin/env node',
  },
});
