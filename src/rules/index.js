// Automatik-Regeln, später 1:1 nach n8n übertragbar.
//
// Alle Funktionen hier sind "rein": Sie bekommen Eingabe + Konfiguration und
// geben eine Entscheidung zurück. Sie speichern nichts und zeigen nichts an.
// In n8n entspricht jede Funktion ungefähr einem Code-/IF-Knoten:
//
//   Webhook (Formular) -> pruefePlz -> [außerhalb] -> Abweisung speichern + Antwort
//                                   -> [ok] -> bewerteDringlichkeit -> Zeile anlegen
//                                            -> pushNachricht -> [senden] -> Push ans Dienst-Handy
//
// Die Konfiguration liegt in /config (region10-plz.json, stichworte.json, push.json).

/** PLZ prüfen. Ergebnis: { ok, grund?, ort?, landkreis? } */
export function pruefePlz(plz, plzConfig) {
  const wert = String(plz ?? '').replace(/\s/g, '');
  if (!/^\d{5}$/.test(wert)) return { ok: false, grund: 'format', plz: wert };
  const treffer = plzConfig.plz[wert];
  if (!treffer) return { ok: false, grund: 'ausserhalb', plz: wert };
  return { ok: true, plz: wert, ort: treffer.ort, landkreis: treffer.landkreis };
}

/** Dringlichkeit bestimmen. Ergebnis: { dringend, grund } */
export function bewerteDringlichkeit(meldung, stichwortConfig, merkmalLabels = {}) {
  const gruende = [];

  for (const m of meldung.merkmale ?? []) {
    if (stichwortConfig.dringende_merkmale.includes(m)) gruende.push(`Merkmal: ${merkmalLabels[m] ?? m}`);
  }

  const text = `${meldung.fundort ?? ''} ${meldung.merkmale_freitext ?? ''}`.toLowerCase();
  for (const wort of stichwortConfig.dringende_stichworte) {
    if (text.includes(wort.toLowerCase())) {
      gruende.push(`Stichwort: „${wort}“`);
      break; // ein Stichwort reicht als Begründung
    }
  }

  return { dringend: gruende.length > 0, grund: gruende.join(', ') };
}

/** Text für die Push-Nachricht ans Dienst-Handy. Ergebnis: { senden, empfaenger, nachricht } */
export function pushNachricht(meldung, pushConfig, merkmalLabels = {}) {
  const senden = !pushConfig.nur_dringende || meldung.dringend;
  const merkmale = (meldung.merkmale ?? []).map((m) => merkmalLabels[m] ?? m).join(', ');
  const teile = [
    meldung.dringend ? '🔴 DRINGEND – Neue Igel-Meldung' : 'Neue Igel-Meldung',
    `${meldung.plz} ${meldung.ort} (${meldung.landkreis})`,
    merkmale || null,
    `Tel. ${meldung.telefon}`,
  ].filter(Boolean);
  return { senden, empfaenger: pushConfig.empfaenger, nachricht: teile.join(' · ') };
}

/**
 * Gesamter Ablauf für eine neue Meldung – nur die Entscheidung, ohne Speichern.
 * Ergebnis:
 *   { aktion: 'ungueltig', grund }                  -> Formularfehler
 *   { aktion: 'abweisen', abweisung }               -> keine Karte, freundliche Antwort
 *   { aktion: 'anlegen', datensatz, push }          -> Karte anlegen (+ ggf. Push)
 */
export function verarbeiteMeldung(eingabe, config, jetzt = new Date()) {
  const plz = pruefePlz(eingabe.plz, config.plz);
  if (!plz.ok && plz.grund === 'format') return { aktion: 'ungueltig', grund: 'plz' };
  if (!plz.ok) {
    return { aktion: 'abweisen', abweisung: { zeitpunkt: jetzt.toISOString(), plz: plz.plz } };
  }

  const dringlichkeit = bewerteDringlichkeit(eingabe, config.stichworte, config.merkmalLabels);
  const datensatz = {
    gemeldet_am: jetzt.toISOString(),
    plz: plz.plz,
    ort: plz.ort,
    landkreis: plz.landkreis,
    fundort: eingabe.fundort ?? '',
    standort_lat: eingabe.standort_lat ?? null,
    standort_lng: eingabe.standort_lng ?? null,
    gewicht_g: eingabe.gewicht_g ?? null,
    foto: eingabe.foto ?? null,
    merkmale: eingabe.merkmale ?? [],
    merkmale_freitext: eingabe.merkmale_freitext ?? '',
    telefon: eingabe.telefon,
    einwilligung_datenschutz: !!eingabe.einwilligung_datenschutz,
    status: 'neu',
    abschluss_art: null,
    dringend: dringlichkeit.dringend,
    dringend_grund: dringlichkeit.grund,
    status_geaendert_am: jetzt.toISOString(),
    pflegeigel: null,
  };

  return {
    aktion: 'anlegen',
    datensatz,
    push: pushNachricht(datensatz, config.push, config.merkmalLabels),
  };
}
