// Erzeugt docs/baserow-schema.md aus src/data/schema.js:  npm run schema-doku
import { writeFileSync } from 'node:fs';
import { TABELLEN, LABELS } from '../src/data/schema.js';

const zeilen = ['# Baserow-Tabellen', '', '_Automatisch erzeugt aus `src/data/schema.js` – nicht von Hand ändern._', ''];
for (const [name, t] of Object.entries(TABELLEN)) {
  zeilen.push(`## \`${name}\` (${t.titel})`, '');
  if (t.hinweis) zeilen.push(t.hinweis, '');
  zeilen.push('| Feld | Baserow-Typ | Details |', '|---|---|---|');
  for (const [feld, f] of Object.entries(t.felder)) {
    const details = [
      f.primaer && '**Primärfeld**',
      f.pflicht && 'Pflicht',
      f.ziel && `→ \`${f.ziel}\``,
      f.optionen && `Optionen: ${f.optionen.map((o) => `\`${o}\``).join(', ')}`,
      f.nachkommastellen !== undefined && `${f.nachkommastellen} Nachkommastellen`,
      f.mit_zeit && 'mit Uhrzeit',
      f.hinweis,
    ].filter(Boolean).join(' · ');
    zeilen.push(`| \`${feld}\` | ${f.typ} | ${details} |`);
  }
  zeilen.push('');
}
zeilen.push('## Anzeigetexte der Auswahlwerte', '');
for (const [feld, werte] of Object.entries(LABELS)) {
  zeilen.push(`- **${feld}:** ${Object.entries(werte).map(([k, v]) => `\`${k}\` = ${v}`).join(', ')}`);
}
writeFileSync(new URL('../docs/baserow-schema.md', import.meta.url), zeilen.join('\n') + '\n');
console.log('docs/baserow-schema.md geschrieben');
