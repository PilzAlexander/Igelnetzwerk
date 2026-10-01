// Mock-Adapter: speichert alles im localStorage des Browsers.
// Beim ersten Start (oder nach reset) werden die Testdaten aus seed.js geladen.
// Änderungen in einem anderen Tab (z. B. Formular + Board nebeneinander) kommen
// über das storage-Event an.
import { TABELLEN } from '../schema.js';
import { erzeugeSeed } from '../seed.js';

const KEY = 'igel-leitstelle:daten:v1';
const zuhoerer = new Set();
let daten = null;

const kopie = (x) => structuredClone(x);

function leer() {
  return { tabellen: Object.fromEntries(Object.keys(TABELLEN).map((t) => [t, []])), naechsteId: {} };
}

function laden() {
  if (daten) return daten;
  try {
    const roh = localStorage.getItem(KEY);
    if (roh) daten = JSON.parse(roh);
  } catch {
    daten = null;
  }
  if (!daten) {
    daten = leer();
    erzeugeSeed(seedSchreiber);
    speichern();
  }
  return daten;
}

function speichern() {
  try {
    localStorage.setItem(KEY, JSON.stringify(daten));
  } catch (e) {
    // Meist: Speicher voll (zu viele Fotos)
    throw new Error('Speicher im Browser ist voll. Bitte unter „Protokoll“ die Testdaten zurücksetzen.', { cause: e });
  }
}

function melden(tabelle) {
  for (const fn of zuhoerer) fn(tabelle);
}

function einfuegen(tabelle, werte) {
  const id = (daten.naechsteId[tabelle] ?? 1);
  daten.naechsteId[tabelle] = id + 1;
  const leereZeile = Object.fromEntries(Object.keys(TABELLEN[tabelle].felder).map((f) => [f, null]));
  const zeile = { ...leereZeile, ...werte, id };
  daten.tabellen[tabelle].push(zeile);
  return zeile;
}

// Synchroner Schreiber nur für den Seed
const seedSchreiber = {
  create: (tabelle, werte) => einfuegen(tabelle, werte),
  update: (tabelle, id, werte) => Object.assign(daten.tabellen[tabelle].find((z) => z.id === id), werte),
};

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== KEY) return;
    daten = null;
    melden(null);
  });
}

export const mockAdapter = {
  async list(tabelle) {
    return kopie(laden().tabellen[tabelle]);
  },
  async get(tabelle, id) {
    const z = laden().tabellen[tabelle].find((r) => r.id === Number(id));
    return z ? kopie(z) : null;
  },
  async create(tabelle, werte) {
    laden();
    const zeile = einfuegen(tabelle, kopie(werte));
    speichern();
    melden(tabelle);
    return kopie(zeile);
  },
  async update(tabelle, id, werte) {
    const z = laden().tabellen[tabelle].find((r) => r.id === Number(id));
    if (!z) throw new Error(`${tabelle} #${id} nicht gefunden`);
    Object.assign(z, kopie(werte));
    speichern();
    melden(tabelle);
    return kopie(z);
  },
  async remove(tabelle, id) {
    const liste = laden().tabellen[tabelle];
    const i = liste.findIndex((r) => r.id === Number(id));
    if (i >= 0) liste.splice(i, 1);
    speichern();
    melden(tabelle);
  },
  subscribe(fn) {
    zuhoerer.add(fn);
    return () => zuhoerer.delete(fn);
  },
  async reset() {
    daten = leer();
    erzeugeSeed(seedSchreiber);
    speichern();
    melden(null);
  },
};
