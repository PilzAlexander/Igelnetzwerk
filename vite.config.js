import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  // Relative Pfade, damit der Build auch in einem Unterordner läuft
  base: './',
  plugins: [svelte()],
});
