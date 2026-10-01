// Datenzugriff für die ganze Oberfläche. Die Views kennen nur dieses Objekt.
// Welcher Adapter dahinter steckt, entscheidet VITE_DATA_ADAPTER (Standard: mock).
//
// Schnittstelle (alle Methoden liefern Promises, wie eine echte API):
//   list(tabelle)                  -> Zeilen[]
//   get(tabelle, id)               -> Zeile | null
//   create(tabelle, daten)         -> neue Zeile (mit id)
//   update(tabelle, id, aenderung) -> geänderte Zeile
//   remove(tabelle, id)            -> void
//   subscribe(fn)                  -> Abmelde-Funktion; fn(tabelle) bei Änderungen
//   reset()                        -> Testdaten neu laden (nur Mock)
import { pruefeFelder } from './schema.js';
import { mockAdapter } from './adapters/mock.js';
import { baserowAdapter } from './adapters/baserow.js';

const adapter = import.meta.env?.VITE_DATA_ADAPTER === 'baserow' ? baserowAdapter : mockAdapter;

export const dataStore = {
  list: (tabelle) => adapter.list(tabelle),
  get: (tabelle, id) => adapter.get(tabelle, id),
  create: (tabelle, daten) => {
    pruefeFelder(tabelle, daten);
    return adapter.create(tabelle, daten);
  },
  update: (tabelle, id, aenderung) => {
    pruefeFelder(tabelle, aenderung);
    return adapter.update(tabelle, id, aenderung);
  },
  remove: (tabelle, id) => adapter.remove(tabelle, id),
  subscribe: (fn) => adapter.subscribe(fn),
  reset: () => adapter.reset?.(),
};
