import { defineConfig } from 'vite';

export default defineConfig({
  base: '/voko/', // Base path for GitHub Pages
  build: {
    outDir: '../dist-site', // Build to a folder outside site/ to avoid confusion or just keep it inside
    emptyOutDir: true,
  },
});
