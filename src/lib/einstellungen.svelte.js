// Pro Gerät gespeicherte Einstellungen (kein Login im Prototyp)
function lese(key, standard) {
  try {
    const w = localStorage.getItem(key);
    return w === null ? standard : JSON.parse(w);
  } catch {
    return standard;
  }
}
function schreibe(key, wert) {
  try {
    localStorage.setItem(key, JSON.stringify(wert));
  } catch {
    /* egal */
  }
}

export const einstellungen = $state({
  kuerzel: lese('igel.kuerzel', ''),
  platzhalterZeigen: lese('igel.platzhalterZeigen', true),
});

export function setzeKuerzel(k) {
  einstellungen.kuerzel = k.trim().toUpperCase().slice(0, 4);
  schreibe('igel.kuerzel', einstellungen.kuerzel);
}

export function setzePlatzhalterZeigen(an) {
  einstellungen.platzhalterZeigen = an;
  schreibe('igel.platzhalterZeigen', an);
}

export const lesePushGesehen = () => lese('igel.pushGesehen', null);
export const schreibePushGesehen = (id) => schreibe('igel.pushGesehen', id);
