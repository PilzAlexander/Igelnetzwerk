// Einzige Quelle für Tabellen und Felder.
// `typ` entspricht dem Baserow-Feldtyp (so wie er in der Baserow-API heißt).
// Das erste Feld mit `primaer: true` ist in Baserow das Primärfeld.
//
// Wie die App die Werte sieht (unabhängig vom Adapter):
//   single_select   -> String (Option, z. B. 'neu')
//   multiple_select -> Array von Strings
//   link_row        -> Zahl (ID des verknüpften Datensatzes) oder null
//   file            -> String (URL bzw. Data-URL) oder null
//   date            -> ISO-String ('2026-10-01' bzw. '2026-10-01T08:15:00.000Z' mit Zeit)
// Der Baserow-Adapter rechnet das in das Baserow-Format um.

export const TABELLEN = {
  fundmeldungen: {
    titel: 'Fundmeldungen',
    felder: {
      id: { typ: 'autonumber', primaer: true },
      gemeldet_am: { typ: 'created_on', mit_zeit: true },
      plz: { typ: 'text', pflicht: true, hinweis: 'Text statt Zahl wegen möglicher führender Null' },
      ort: { typ: 'text', hinweis: 'aus der PLZ-Liste abgeleitet' },
      landkreis: { typ: 'single_select', optionen: ['IN', 'EI', 'ND', 'PAF'] },
      fundort: { typ: 'long_text' },
      standort_lat: { typ: 'number', nachkommastellen: 6 },
      standort_lng: { typ: 'number', nachkommastellen: 6 },
      gewicht_g: { typ: 'number', nachkommastellen: 0 },
      foto: { typ: 'file' },
      merkmale: {
        typ: 'multiple_select',
        optionen: ['maden_fliegeneier', 'verletzt', 'tagsueber', 'sehr_klein', 'apathisch', 'jungtier_allein', 'sonstiges'],
      },
      merkmale_freitext: { typ: 'long_text' },
      telefon: { typ: 'phone_number', pflicht: true },
      einwilligung_datenschutz: { typ: 'boolean', pflicht: true },
      status: { typ: 'single_select', optionen: ['neu', 'rueckruf', 'kommt', 'in_pflege', 'abgeschlossen'] },
      abschluss_art: { typ: 'single_select', optionen: ['ausgewildert', 'weitervermittelt'], hinweis: 'nur bei status = abgeschlossen' },
      dringend: { typ: 'boolean', hinweis: 'wird von der Regel gesetzt, kann von Hand geändert werden' },
      dringend_grund: { typ: 'text' },
      status_geaendert_am: { typ: 'date', mit_zeit: true },
      pflegeigel: { typ: 'link_row', ziel: 'pflegeigel' },
    },
  },

  pflegeigel: {
    titel: 'Pflegeigel',
    felder: {
      id: { typ: 'autonumber' },
      name: { typ: 'text', primaer: true, pflicht: true },
      foto: { typ: 'file' },
      fundmeldung: { typ: 'link_row', ziel: 'fundmeldungen' },
      aufgenommen_am: { typ: 'date' },
      status: { typ: 'single_select', optionen: ['in_pflege', 'ausgewildert', 'weitervermittelt'] },
      geschlecht: { typ: 'single_select', optionen: ['unbekannt', 'weiblich', 'maennlich'] },
    },
  },

  gewichte: {
    titel: 'Gewichte',
    felder: {
      id: { typ: 'autonumber', primaer: true },
      igel: { typ: 'link_row', ziel: 'pflegeigel' },
      datum: { typ: 'date' },
      gewicht_g: { typ: 'number', nachkommastellen: 0 },
      kuerzel: { typ: 'text' },
    },
  },

  medikamente: {
    titel: 'Medikamente',
    felder: {
      id: { typ: 'autonumber' },
      name: { typ: 'text', primaer: true },
      igel: { typ: 'link_row', ziel: 'pflegeigel' },
      dosis: { typ: 'text' },
      von: { typ: 'date' },
      bis: { typ: 'date' },
      kuerzel: { typ: 'text' },
    },
  },

  notizen: {
    titel: 'Notizen',
    felder: {
      id: { typ: 'autonumber', primaer: true },
      igel: { typ: 'link_row', ziel: 'pflegeigel' },
      erstellt_am: { typ: 'date', mit_zeit: true },
      text: { typ: 'long_text' },
      kuerzel: { typ: 'text' },
    },
  },

  push_protokoll: {
    titel: 'Push-Protokoll',
    felder: {
      id: { typ: 'autonumber', primaer: true },
      zeitpunkt: { typ: 'date', mit_zeit: true },
      fundmeldung: { typ: 'link_row', ziel: 'fundmeldungen' },
      nachricht: { typ: 'long_text' },
      empfaenger: { typ: 'text' },
    },
  },

  abweisungen: {
    titel: 'Abweisungen',
    hinweis: 'Bewusst ohne Telefonnummer – nur zur Statistik',
    felder: {
      id: { typ: 'autonumber', primaer: true },
      zeitpunkt: { typ: 'date', mit_zeit: true },
      plz: { typ: 'text' },
    },
  },
};

// Anzeigetexte für Auswahlwerte (Alltagssprache)
export const LABELS = {
  status: {
    neu: 'Neu',
    rueckruf: 'Rückruf läuft',
    kommt: 'Kommt auf Station',
    in_pflege: 'In Pflege',
    abgeschlossen: 'Ausgewildert / Weitervermittelt',
  },
  abschluss_art: {
    ausgewildert: 'Ausgewildert',
    weitervermittelt: 'Weitervermittelt',
  },
  merkmale: {
    maden_fliegeneier: 'Maden / Fliegeneier',
    verletzt: 'Verletzt',
    tagsueber: 'Tagsüber unterwegs',
    sehr_klein: 'Sehr klein / leicht',
    apathisch: 'Liegt apathisch da',
    jungtier_allein: 'Jungtier ohne Mutter',
    sonstiges: 'Sonstiges',
  },
  igel_status: {
    in_pflege: 'In Pflege',
    ausgewildert: 'Ausgewildert',
    weitervermittelt: 'Weitervermittelt',
  },
  geschlecht: {
    unbekannt: 'unbekannt',
    weiblich: 'weiblich',
    maennlich: 'männlich',
  },
};

export const STATUS_REIHENFOLGE = TABELLEN.fundmeldungen.felder.status.optionen;

export function pruefeFelder(tabelle, daten) {
  const def = TABELLEN[tabelle];
  if (!def) throw new Error(`Unbekannte Tabelle: ${tabelle}`);
  for (const feld of Object.keys(daten)) {
    if (!def.felder[feld]) throw new Error(`Feld „${feld}“ gibt es in Tabelle „${tabelle}“ nicht (siehe src/data/schema.js)`);
  }
}
