// Führt die Entscheidung aus src/rules/index.js aus (speichern + Push protokollieren).
// Das ist der Teil, den später n8n übernimmt. Die Oberfläche ruft nur meldungEingang() auf.
import { dataStore } from '../data/dataStore.js';
import { verarbeiteMeldung } from './index.js';
import { regelConfig } from './config.js';

export async function meldungEingang(eingabe, jetzt = new Date(), store = dataStore) {
  const ergebnis = verarbeiteMeldung(eingabe, regelConfig, jetzt);

  if (ergebnis.aktion === 'abweisen') {
    await store.create('abweisungen', ergebnis.abweisung);
    return ergebnis;
  }

  if (ergebnis.aktion === 'anlegen') {
    const zeile = await store.create('fundmeldungen', ergebnis.datensatz);
    if (ergebnis.push.senden) {
      await store.create('push_protokoll', {
        zeitpunkt: jetzt.toISOString(),
        fundmeldung: zeile.id,
        nachricht: ergebnis.push.nachricht,
        empfaenger: ergebnis.push.empfaenger,
      });
    }
    return { ...ergebnis, zeile };
  }

  return ergebnis;
}
