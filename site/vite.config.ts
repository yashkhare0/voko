import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/voko/', // Base path for GitHub Pages
  build: {
    outDir: '../dist-site', // Build to a folder outside site/ to avoid confusion or just keep it inside
    emptyOutDir: true,
  },
});
