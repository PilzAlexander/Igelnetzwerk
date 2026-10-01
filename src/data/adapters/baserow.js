// Baserow-Adapter – ENTWURF, noch nicht gegen eine echte Baserow-Instanz getestet.
//
// Aktivieren über .env.local:
//   VITE_DATA_ADAPTER=baserow
//   VITE_BASEROW_URL=https://baserow.example.org
//   VITE_BASEROW_TOKEN=...            (Database Token, NUR für interne Tests!)
//   VITE_BASEROW_TABELLEN={"fundmeldungen":123,"pflegeigel":124,"gewichte":125,"medikamente":126,"notizen":127,"push_protokoll":128,"abweisungen":129}
//
// WICHTIG zur Sicherheit: Ein Token im Browser kann jede*r auslesen.
// Für den Echtbetrieb gehört das öffentliche Formular NICHT direkt an Baserow,
// sondern an einen n8n-Webhook (der die Regeln aus src/rules ausführt).
// Die interne Leitstelle braucht eine Anmeldung (z. B. Baserow-JWT pro Person
// oder ein kleiner Proxy).
//
// Umrechnung App-Format <-> Baserow-Format (siehe Kopf von schema.js):
//   single_select:   'neu'          <-> { id, value: 'neu', color }
//   multiple_select: ['a','b']      <-> [{ id, value }]
//   link_row:        12             <-> [{ id: 12, value }]
//   file:            'https://…'    <-> [{ url, name, thumbnails, … }]
//   created_on/autonumber werden von Baserow gesetzt und beim Schreiben weggelassen.
import { TABELLEN } from '../schema.js';

const env = import.meta.env ?? {};
const URL_BASIS = env.VITE_BASEROW_URL;
const TOKEN = env.VITE_BASEROW_TOKEN;
const TABELLEN_IDS = env.VITE_BASEROW_TABELLEN ? JSON.parse(env.VITE_BASEROW_TABELLEN) : {};
const zuhoerer = new Set();

async function api(pfad, optionen = {}) {
  const antwort = await fetch(`${URL_BASIS}/api/database/rows/${pfad}`, {
    ...optionen,
    headers: { Authorization: `Token ${TOKEN}`, 'Content-Type': 'application/json', ...optionen.headers },
  });
  if (!antwort.ok) throw new Error(`Baserow ${antwort.status}: ${await antwort.text()}`);
  return antwort.status === 204 ? null : antwort.json();
}

function vonBaserow(tabelle, zeile) {
  const aus = { id: zeile.id };
  for (const [feld, def] of Object.entries(TABELLEN[tabelle].felder)) {
    const w = zeile[feld];
    if (feld === 'id') continue;
    if (def.typ === 'single_select') aus[feld] = w?.value ?? null;
    else if (def.typ === 'multiple_select') aus[feld] = (w ?? []).map((o) => o.value);
    else if (def.typ === 'link_row') aus[feld] = w?.[0]?.id ?? null;
    else if (def.typ === 'file') aus[feld] = w?.[0]?.url ?? null;
    else if (def.typ === 'number') aus[feld] = w == null || w === '' ? null : Number(w);
    else aus[feld] = w ?? null;
  }
  return aus;
}

function zuBaserow(tabelle, daten) {
  const aus = {};
  for (const [feld, w] of Object.entries(daten)) {
    const def = TABELLEN[tabelle].felder[feld];
    if (!def || ['autonumber', 'created_on'].includes(def.typ) || feld === 'id') continue;
    // Baserow akzeptiert bei Auswahlfeldern auch den Optionstext (neuere Versionen) – sonst hier auf Options-IDs mappen.
    if (def.typ === 'link_row') aus[feld] = w == null ? [] : [w];
    else if (def.typ === 'file') {
      // TODO: Data-URL erst über /api/user-files/upload-file/ hochladen, dann [{ name }] setzen.
      if (typeof w === 'string' && w.startsWith('data:')) continue;
      aus[feld] = w ? [{ name: w }] : [];
    } else aus[feld] = w;
  }
  return aus;
}

const tabId = (t) => {
  if (!TABELLEN_IDS[t]) throw new Error(`Keine Baserow-Tabellen-ID für „${t}“ in VITE_BASEROW_TABELLEN`);
  return TABELLEN_IDS[t];
};
const melden = (t) => zuhoerer.forEach((fn) => fn(t));

export const baserowAdapter = {
  async list(tabelle) {
    const zeilen = [];
    let seite = 1;
    for (;;) {
      const r = await api(`table/${tabId(tabelle)}/?user_field_names=true&size=200&page=${seite}`);
      zeilen.push(...r.results.map((z) => vonBaserow(tabelle, z)));
      if (!r.next) break;
      seite++;
    }
    return zeilen;
  },
  async get(tabelle, id) {
    return vonBaserow(tabelle, await api(`table/${tabId(tabelle)}/${id}/?user_field_names=true`));
  },
  async create(tabelle, daten) {
    const r = await api(`table/${tabId(tabelle)}/?user_field_names=true`, { method: 'POST', body: JSON.stringify(zuBaserow(tabelle, daten)) });
    melden(tabelle);
    return vonBaserow(tabelle, r);
  },
  async update(tabelle, id, daten) {
    const r = await api(`table/${tabId(tabelle)}/${id}/?user_field_names=true`, { method: 'PATCH', body: JSON.stringify(zuBaserow(tabelle, daten)) });
    melden(tabelle);
    return vonBaserow(tabelle, r);
  },
  async remove(tabelle, id) {
    await api(`table/${tabId(tabelle)}/${id}/`, { method: 'DELETE' });
    melden(tabelle);
  },
  subscribe(fn) {
    // TODO: Baserow bietet Echtzeit über WebSocket (/ws/core/). Für den Anfang reicht Neuladen.
    zuhoerer.add(fn);
    return () => zuhoerer.delete(fn);
  },
};
