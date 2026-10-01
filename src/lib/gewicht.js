// Gewichte eines Igels sortieren und Trend bestimmen
export function gewichteVon(igelId, alleGewichte) {
  return alleGewichte.filter((g) => g.igel === igelId).sort((a, b) => a.datum.localeCompare(b.datum) || a.id - b.id);
}

/** Trend aus den letzten beiden Einträgen. Bis ±5 g gilt als gleich. */
export function trend(liste) {
  if (liste.length === 0) return null;
  const letzter = liste.at(-1);
  if (liste.length === 1) return { gewicht: letzter.gewicht_g, diff: 0, richtung: 'gleich', datum: letzter.datum };
  const diff = letzter.gewicht_g - liste.at(-2).gewicht_g;
  const richtung = diff > 5 ? 'hoch' : diff < -5 ? 'runter' : 'gleich';
  return { gewicht: letzter.gewicht_g, diff, richtung, datum: letzter.datum };
}
