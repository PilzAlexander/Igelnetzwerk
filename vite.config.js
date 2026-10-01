import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `npm run build:datei` erzeugt eine einzige HTML-Datei (alles eingebettet),
// die man ohne Server per Doppelklick öffnen kann.
export default defineConfig(({ mode }) => ({
  // Relative Pfade, damit der Build auch in einem Unterordner läuft
  base: './',
  plugins: [svelte(), ...(mode === 'datei' ? [viteSingleFile()] : [])],
  build: mode === 'datei' ? { outDir: 'dist-datei', emptyOutDir: true } : {},
}));
