// Testdaten. Zeiten werden relativ zu "jetzt" erzeugt, damit „seit 2 Std.“ immer stimmt.
// Die Fundmeldungen laufen durch dieselben Regeln wie das echte Formular
// (PLZ-Prüfung, Dringlichkeit, Push). Fotos sind gezeichnete Platzhalter.
// Telefonnummern sind ausgedacht (Vorwahl 0123 ist nicht vergeben) – bitte nicht anrufen.
import { verarbeiteMeldung } from '../rules/index.js';
import { regelConfig } from '../rules/config.js';

const MIN = 60 * 1000;
const STD = 60 * MIN;
const TAG = 24 * STD;

// Platzhalterbilder werden importiert, damit sie auch in der Einzeldatei-Version (npm run build:datei) enthalten sind
const BILDER = import.meta.glob('../assets/platzhalter/igel-*.svg', { eager: true, query: '?url', import: 'default' });
const bild = (n) => BILDER[`../assets/platzhalter/igel-${n}.svg`];
const datum = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const MELDUNGEN = [
  { vor: 25 * MIN, status: 'neu', foto: bild(1),
    e: { plz: '85049', fundort: 'Vorgarten, neben der Mülltonne', gewicht_g: 380, merkmale: ['maden_fliegeneier', 'tagsueber'], telefon: '0123 4567 101' } },
  { vor: 3 * STD, status: 'neu', foto: bild(2),
    e: { plz: '86633', fundort: 'Liegt im Laub hinterm Schuppen', gewicht_g: 210, merkmale: ['sehr_klein'], telefon: '0123 4567 102' } },
  { vor: 70 * MIN, status: 'rueckruf', foto: bild(3),
    e: { plz: '85276', fundort: 'Auf dem Gehweg an der Hauptstraße', merkmale: ['sonstiges'], merkmale_freitext: 'Hinterbein blutet etwas, humpelt', telefon: '0123 4567 103' } },
  { vor: 5 * STD, status: 'rueckruf', foto: null,
    e: { plz: '85072', fundort: 'Schulhof, mittags', merkmale: ['tagsueber', 'apathisch'], telefon: '0123 4567 104' } },
  { vor: 26 * STD, status: 'kommt', foto: bild(4),
    e: { plz: '85092', fundort: 'Komposthaufen', merkmale: ['jungtier_allein'], merkmale_freitext: 'Vier Kleine, Mutter seit gestern nicht gesehen', telefon: '0123 4567 105' } },
  { vor: 20 * STD, status: 'kommt', foto: bild(5),
    e: { plz: '86529', fundort: 'Garage', gewicht_g: 340, merkmale: ['sehr_klein'], telefon: '0123 4567 106' } },
  { vor: 16 * TAG, status: 'in_pflege', foto: bild(6), igel: 'Mia',
    e: { plz: '85055', fundort: 'Terrasse', gewicht_g: 290, merkmale: ['sehr_klein', 'apathisch'], telefon: '0123 4567 107' } },
  { vor: 2 * TAG, status: 'in_pflege', foto: bild(7),
    e: { plz: '85283', fundort: 'Hopfengarten am Feldweg', gewicht_g: 450, merkmale: ['tagsueber'], telefon: '0123 4567 108' } },
  { vor: 30 * TAG, status: 'abgeschlossen', abschluss: 'ausgewildert', foto: bild(8),
    e: { plz: '92339', fundort: 'Parkplatz Freibad', gewicht_g: 520, merkmale: [], telefon: '0123 4567 109' } },
  { vor: 12 * TAG, status: 'abgeschlossen', abschluss: 'weitervermittelt', foto: bild(2),
    e: { plz: '86643', fundort: 'Scheune', merkmale: ['jungtier_allein'], telefon: '0123 4567 110' } },
  // PLZ außerhalb von Region 10 -> wird abgewiesen, es entsteht keine Karte
  { vor: 4 * STD, e: { plz: '80331', fundort: 'Innenhof', merkmale: ['tagsueber'], telefon: '0123 4567 111' } },
];

// Gewichtsverläufe: Startgewicht, Zunahme pro Tag, Anzahl Tage
const PFLEGEIGEL = [
  { name: 'Mia', foto: bild(6), tage: 16, start: 290, proTag: 9, geschlecht: 'weiblich' },
  { name: 'Krümel', foto: bild(1), tage: 21, start: 260, proTag: 8, geschlecht: 'maennlich' },
  { name: 'Paula', foto: bild(3), tage: 18, start: 510, proTag: 5, geschlecht: 'weiblich' },
  { name: 'Igor', foto: bild(5), tage: 14, start: 660, proTag: 2, geschlecht: 'maennlich', knick: true },
  { name: 'Hagebutte', foto: bild(4), tage: 20, start: 180, proTag: 7, geschlecht: 'unbekannt' },
  { name: 'Fridolin', foto: bild(8), tage: 15, start: 450, proTag: 1, geschlecht: 'maennlich' },
];

const KUERZEL = ['AP', 'MK', 'SB', 'LW'];

export function erzeugeSeed(db, jetzt = new Date()) {
  const t = (abzug) => new Date(jetzt.getTime() - abzug);
  const igelZuFall = {};

  for (const m of MELDUNGEN) {
    const zeitpunkt = t(m.vor);
    const r = verarbeiteMeldung({ ...m.e, einwilligung_datenschutz: true, foto: m.foto }, regelConfig, zeitpunkt);
    if (r.aktion === 'abweisen') {
      db.create('abweisungen', r.abweisung);
      continue;
    }
    const zeile = db.create('fundmeldungen', {
      ...r.datensatz,
      status: m.status,
      abschluss_art: m.abschluss ?? null,
      status_geaendert_am: t(m.vor * 0.5).toISOString(),
    });
    if (r.push.senden) {
      db.create('push_protokoll', { zeitpunkt: zeitpunkt.toISOString(), fundmeldung: zeile.id, nachricht: r.push.nachricht, empfaenger: r.push.empfaenger });
    }
    if (m.igel) igelZuFall[m.igel] = zeile.id;
  }

  PFLEGEIGEL.forEach((p, i) => {
    const igel = db.create('pflegeigel', {
      name: p.name,
      foto: p.foto,
      fundmeldung: igelZuFall[p.name] ?? null,
      aufgenommen_am: datum(t(p.tage * TAG)),
      status: 'in_pflege',
      geschlecht: p.geschlecht,
    });
    if (igelZuFall[p.name]) db.update('fundmeldungen', igelZuFall[p.name], { pflegeigel: igel.id });

    // jeden 1–2 Tage gewogen, mit kleinen Schwankungen
    for (let tag = p.tage; tag >= 0; tag -= (tag % 3 === 0 ? 2 : 1)) {
      const vergangen = p.tage - tag;
      let g = p.start + vergangen * p.proTag + Math.round(Math.sin(vergangen * 1.7 + i) * 8);
      if (p.knick && tag <= 3) g -= (4 - tag) * 18; // Igor nimmt zuletzt ab
      db.create('gewichte', { igel: igel.id, datum: datum(t(tag * TAG)), gewicht_g: g, kuerzel: KUERZEL[(tag + i) % 4] });
    }

    db.create('notizen', {
      igel: igel.id,
      erstellt_am: t(p.tage * TAG - 2 * STD).toISOString(),
      text: 'Aufgenommen, gewogen, Box mit Wärmflasche vorbereitet.',
      kuerzel: KUERZEL[i % 4],
    });
  });

  // Medikamente und weitere Notizen (Beispiele, keine Dosierungsempfehlung!)
  const med = (igel, name, dosis, vonTage, bisTage, kuerzel) =>
    db.create('medikamente', { igel, name, dosis, von: datum(t(vonTage * TAG)), bis: datum(t(-bisTage * TAG)), kuerzel });
  med(1, 'Entwurmung (Beispiel)', '0,2 ml einmal täglich', 3, 2, 'AP');
  med(2, 'Antibiotikum (Beispiel)', '0,1 ml morgens und abends', 5, 4, 'MK');
  med(4, 'Schmerzmittel (Beispiel)', '0,05 ml morgens', 2, 1, 'SB');
  med(4, 'Aufbaupräparat (Beispiel)', 'eine Messerspitze ins Futter', 10, -2, 'SB');

  const notiz = (igel, vorStd, text, kuerzel) =>
    db.create('notizen', { igel, erstellt_am: t(vorStd * STD).toISOString(), text, kuerzel });
  notiz(1, 30, 'Frisst gut, Kot normal.', 'LW');
  notiz(2, 50, 'Augen etwas verklebt, mit Kochsalz gereinigt.', 'MK');
  notiz(4, 20, 'Frisst seit zwei Tagen schlechter. Tierärztin informiert.', 'SB');
  notiz(4, 3, 'Heute nur halbe Portion gefressen – bitte weiter beobachten.', 'AP');
  notiz(5, 40, 'Sehr munter, klettert aus der Box. Größere Box nötig.', 'LW');
}
