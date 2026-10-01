// Kopiert die Einzeldatei nach prototyp/igel-leitstelle.html (wird mit eingecheckt)
import { copyFileSync, mkdirSync } from 'node:fs';

mkdirSync(new URL('../prototyp/', import.meta.url), { recursive: true });
copyFileSync(new URL('../dist-datei/index.html', import.meta.url), new URL('../prototyp/igel-leitstelle.html', import.meta.url));
console.log('prototyp/igel-leitstelle.html geschrieben');
