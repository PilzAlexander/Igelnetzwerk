// Tests für die Automatik-Regeln: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pruefePlz, bewerteDringlichkeit, pushNachricht, verarbeiteMeldung } from './index.js';

const lese = (f) => JSON.parse(readFileSync(new URL(`../../config/${f}`, import.meta.url)));
const config = { plz: lese('region10-plz.json'), stichworte: lese('stichworte.json'), push: lese('push.json'), merkmalLabels: {} };

test('PLZ in Region 10 wird erkannt', () => {
  assert.deepEqual(pruefePlz('85049', config.plz), { ok: true, plz: '85049', ort: 'Ingolstadt', landkreis: 'IN' });
  assert.equal(pruefePlz(' 86 633 ', config.plz).landkreis, 'ND');
});

test('PLZ außerhalb wird abgewiesen, falsches Format erkannt', () => {
  assert.equal(pruefePlz('80331', config.plz).grund, 'ausserhalb');
  assert.equal(pruefePlz('8504', config.plz).grund, 'format');
  assert.equal(pruefePlz('', config.plz).grund, 'format');
});

test('Dringend über Merkmal oder Stichwort', () => {
  assert.equal(bewerteDringlichkeit({ merkmale: ['maden_fliegeneier'] }, config.stichworte).dringend, true);
  assert.equal(bewerteDringlichkeit({ merkmale: ['sonstiges'], merkmale_freitext: 'Bein BLUTET' }, config.stichworte).dringend, true);
  assert.equal(bewerteDringlichkeit({ merkmale: ['tagsueber'], fundort: 'Garten' }, config.stichworte).dringend, false);
});

test('Push-Nachricht', () => {
  const p = pushNachricht({ plz: '85049', ort: 'Ingolstadt', landkreis: 'IN', telefon: '0123', dringend: true, merkmale: [] }, config.push);
  assert.equal(p.senden, true);
  assert.match(p.nachricht, /DRINGEND/);
  assert.equal(pushNachricht({ dringend: false }, { ...config.push, nur_dringende: true }).senden, false);
});

test('Gesamtablauf', () => {
  assert.equal(verarbeiteMeldung({ plz: '80331', telefon: '1' }, config).aktion, 'abweisen');
  const r = verarbeiteMeldung({ plz: '85276', telefon: '1', merkmale: ['verletzt'] }, config);
  assert.equal(r.aktion, 'anlegen');
  assert.equal(r.datensatz.status, 'neu');
  assert.equal(r.datensatz.dringend, true);
  assert.equal(r.datensatz.landkreis, 'PAF');
});
