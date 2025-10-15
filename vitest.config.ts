import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  resolve: {
    alias: {
      '@voko/core': path.resolve(__dirname, 'packages/core/dist/index.js'),
    },
  },
  test: {
    globals: true,
    include: ['**/__tests__/**/*.spec.{ts,tsx,js,jsx}'],
    passWithNoTests: true,
    exclude: [
      '**/node_modules/**',
      '**/.pnpm/**',
      '**/dist/**',
      '**/coverage/**',
      '**/.tmp-tests-fs/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
    },
  },
});
