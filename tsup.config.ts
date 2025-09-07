import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [],
  splitting: false,
  sourcemap: true,
  clean: true,
  dts: true,
  format: ['esm', 'cjs'],
});
