import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/cli.ts'],
  splitting: false,
  sourcemap: true,
  clean: true,
  dts: false,
  format: ['esm', 'cjs'],
  banner: {
    // Ensure no shebang in CJS output to allow `node dist/cli.cjs` execution on Windows
    // ESM output doesn't include it either.
    js: '',
  },
  external: ['@voko/core', '@voko/adapter-react-next', 'commander'],
});
