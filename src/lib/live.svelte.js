// Lädt eine Tabelle aus dem dataStore und hält sie aktuell.
// Muss während der Initialisierung einer Komponente aufgerufen werden.
import { dataStore } from '../data/dataStore.js';

export function liveTabelle(tabelle) {
  const zustand = $state({ zeilen: [], geladen: false, fehler: null });
  $effect(() => {
    let aktiv = true;
    const laden = async () => {
      try {
        const z = await dataStore.list(tabelle);
        if (aktiv) Object.assign(zustand, { zeilen: z, geladen: true, fehler: null });
      } catch (e) {
        if (aktiv) Object.assign(zustand, { geladen: true, fehler: e.message });
      }
    };
    laden();
    const abmelden = dataStore.subscribe((t) => {
      if (!t || t === tabelle) laden();
    });
    return () => {
      aktiv = false;
      abmelden();
    };
  });
  return zustand;
}
