// Kurze Hinweise unten am Bildschirm, optional mit Aktion (z. B. „Rückgängig“)
export const toasts = $state([]);
let zaehler = 0;

export function zeigeToast(text, { aktion = null, dauer = 6000, art = 'info', link = null } = {}) {
  const id = ++zaehler;
  toasts.push({ id, text, aktion, art, link });
  if (toasts.length > 3) toasts.shift();
  setTimeout(() => schliesseToast(id), dauer);
  return id;
}

export function schliesseToast(id) {
  const i = toasts.findIndex((t) => t.id === id);
  if (i >= 0) toasts.splice(i, 1);
}
