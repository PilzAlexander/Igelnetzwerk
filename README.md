# Igel-Leitstelle – klickbarer Prototyp

Prototyp für die Igelstation in Region 10 (Ingolstadt, Eichstätt, Neuburg-Schrobenhausen, Pfaffenhofen). Damit testen wir die Bedienung mit ehrenamtlichen Helfer*innen, vor allem am Handy. Es gibt kein Backend: Alle Daten liegen im Browser (localStorage) und werden beim ersten Start mit Testdaten befüllt.

Später läuft das Ganze auf **Baserow** (Daten) und **n8n** (Automatik). Der Prototyp ist so gebaut, dass beides ohne Umbau der Oberfläche dahinter passt.

## Starten

Voraussetzung ist Node.js ab 20.19 bzw. 22.12.

```bash
npm start
```

Der Befehl installiert die Pakete und startet den Entwicklungsserver. Danach im Browser **http://localhost:5173** öffnen.

Weitere Befehle:

| Befehl | Was passiert |
|---|---|
| `npm run dev` | nur starten (ohne Installation) |
| `npm test` | Tests für die Automatik-Regeln |
| `npm run build` | fertige Dateien nach `dist/` (lassen sich auf jeden Webspace legen) |
| `npm run schema-doku` | erzeugt `docs/baserow-schema.md` neu |

**Am Handy testen:** Handy und Rechner ins selbe WLAN, dann die „Network“-Adresse öffnen, die beim Start angezeigt wird (z. B. `http://192.168.1.20:5173`). Achtung: Über so eine `http://`-Adresse sperrt das Handy die Funktion „Standort verwenden“, weil Browser den Standort nur über `https` oder `localhost` freigeben. Kamera und alles andere funktionieren.

### Die Bereiche

| Adresse | Für wen | Was |
|---|---|---|
| `#/` | Testleitung | Startseite, Platzhalter-Markierung an/aus, Testdaten zurücksetzen |
| `#/melden` | Finder*innen | öffentliches Fundformular (ohne Login) |
| `#/board` | Helfer*innen | Fallübersicht (Kanban) |
| `#/igel` | Helfer*innen | Pflegeigel-Galerie, Detailansicht unter `#/igel/<id>` |
| `#/protokoll` | Helfer*innen / Testleitung | Push-Nachrichten, die rausgegangen wären, und abgewiesene PLZ |

Tipp: Formular und Board in zwei Tabs nebeneinander öffnen. Eine neue Meldung erscheint dann sofort im Board, zusammen mit dem Push-Hinweis.

## Wo liegt die Konfiguration?

Alles im Ordner **`config/`**. Die Dateien sind JSON und lassen sich mit jedem Texteditor bearbeiten:

| Datei | Inhalt |
|---|---|
| `config/region10-plz.json` | **PLZ-Liste für Region 10** (PLZ → Ort + Landkreis). ⚠️ **ZU PRÜFEN / VERVOLLSTÄNDIGEN.** Drin sind nur 15 Beispiel-PLZ, damit der Prototyp läuft. Jede PLZ, die hier fehlt, wird im Formular abgewiesen. |
| `config/stichworte.json` | Wann eine Meldung **dringend** ist: Merkmale (z. B. Maden, verletzt) und Stichworte im Freitext (z. B. „blutet“). |
| `config/push.json` | Empfänger der Push-Nachricht und ob sie nur bei dringenden Meldungen rausgeht. |
| `config/andere-stationen.json` | Stationen, auf die bei einer PLZ außerhalb verwiesen wird. Im Moment **nur Platzhalter.** |

Texte, die fachlich oder rechtlich geprüft werden müssen (Sofort-Tipps, „Was passiert jetzt?“, Datenschutz-Einwilligung, Abweisung), stehen gesammelt in **`src/texte.js`**. In der App sind sie gelb markiert. Die Markierung lässt sich auf der Startseite ausschalten, damit sie bei Tests nicht ablenkt.

## Aufbau (für die spätere Umstellung)

```
config/                    editierbare Konfiguration (siehe oben)
src/data/schema.js         Tabellen + Felder mit Baserow-Feldtypen (einzige Quelle)
src/data/dataStore.js      die einzige Datenschnittstelle der Oberfläche
src/data/adapters/mock.js  localStorage + Testdaten (aktiv)
src/data/adapters/baserow.js  Entwurf für die Baserow-API (noch ungetestet)
src/data/seed.js           Testdaten
src/rules/index.js         Automatik-Regeln als reine Funktionen → später n8n
src/rules/ablauf.js        führt die Regeln aus (speichern, Push protokollieren)
src/texte.js               Texte zur fachlichen Prüfung
src/views/, src/components/  Oberfläche (Svelte)
docs/baserow-schema.md     Tabellen zum Anlegen in Baserow (generiert)
```

- **Baserow:** Die Tabellen in `docs/baserow-schema.md` können so 1:1 angelegt werden. Zum Umstellen dann `VITE_DATA_ADAPTER=baserow` setzen (Details stehen oben in `src/data/adapters/baserow.js`). Wichtig: Das öffentliche Formular soll später **nicht** direkt mit einem Baserow-Token im Browser arbeiten, sondern Meldungen an einen n8n-Webhook schicken.
- **n8n:** `src/rules/index.js` ist so geschrieben, dass jede Funktion ungefähr einem n8n-Knoten entspricht: PLZ prüfen → bei „außerhalb“ abweisen, sonst Dringlichkeit prüfen → Zeile anlegen → Push. Die Tests in `src/rules/rules.test.js` zeigen die erwarteten Ergebnisse und sind praktisch, um den n8n-Workflow damit abzugleichen.

## Testdaten

- 11 Fundmeldungen. 10 davon werden zu Karten (verteilt auf alle Spalten und alle 4 Landkreise), 2 sind dringend: eine über „Maden“, eine über das Stichwort „blutet“ im Freitext. 1 Meldung hat die PLZ 80331 München und wird abgewiesen.
- 6 Pflegeigel mit 2–3 Wochen Gewichtsverlauf, Medikamenten und Notizen. Igor nimmt zuletzt ab, daran lässt sich der Trend-Pfeil nach unten zeigen.
- Fotos sind gezeichnete Platzhalter-Igel. Die Telefonnummern sind erfunden (Vorwahl 0123 ist nicht vergeben).
- Zurücksetzen geht über die Startseite oder „Protokoll“ → „Testdaten zurücksetzen“.

## So testet ihr mit Helfer*innen

**Vorbereitung:** Platzhalter-Markierung auf der Startseite ausschalten und die Testdaten zurücksetzen. Am besten am eigenen Handy der Person testen. Nichts erklären, nur die Aufgabe vorlesen und zuschauen: Wo zögert die Person, wo tippt sie daneben, was sagt sie dabei laut? Die Zeit pro Aufgabe mitschreiben.

1. **Igel melden (Rolle: Finder*in).** „Du hast im Garten in Eichstätt (PLZ 85072) einen kleinen Igel gefunden, der tagsüber herumläuft. Melde ihn mit Foto.“
   *Beobachten:* Wird das Foto gefunden? Wird bei „Was ist auffällig?“ getippt? Wird die Einwilligung verstanden? Ist klar, was nach dem Absenden passiert?
   *Variante:* PLZ 80331 eingeben. Versteht die Person die Abweisung und weiß sie, wen sie stattdessen anrufen kann?

2. **Neue Meldung bearbeiten.** „Im Board ist eine neue, dringende Meldung. Ruf die Person an und zeig dann im Board, dass du gerade zurückrufst.“
   *Beobachten:* Wird die dringende Karte sofort erkannt? Wird „Verschieben“ gefunden? Bemerkt die Person den „Rückgängig“-Hinweis?

3. **Igel aufnehmen.** „Der Igel aus Wolnzach ist auf der Station angekommen. Leg ihn als Pflegeigel an und nenn ihn ‚Stupsi‘.“
   *Beobachten:* Wird die Spalte „In Pflege“ am Handy gefunden (Tabs/Wischen)? Ist „Als Pflegeigel anlegen“ verständlich?

4. **Wiegen und Notiz.** „Du hast Krümel gerade gewogen: 430 Gramm. Trag das ein. Dann schau nach, ob Igor gerade Medikamente bekommt und bis wann.“
   *Beobachten:* Schafft die Person das Gewicht in 2 Taps? Werden Trend-Pfeil und Diagramm verstanden?

Nach den Aufgaben kurz fragen: Was war am schwierigsten? Was hast du vermisst? Würdest du das im Dienst so benutzen?

## Offene fachliche Fragen

**Gebiet und Regeln**
1. Vollständige PLZ-Liste für Region 10. Und wie gehen wir mit PLZ um, die über eine Landkreisgrenze reichen? Zählt die Stadt Ingolstadt als „IN“ mit dazu? (Region 10 = Stadt Ingolstadt + 3 Landkreise.)
2. Welche Stationen nennen wir Finder*innen von außerhalb, und dürfen wir deren Telefonnummern veröffentlichen?
3. Sind die Dringend-Stichworte richtig und vollständig? Zählen z. B. „sehr klein/leicht“ im Herbst, „Jungtier ohne Mutter“ oder „liegt apathisch“ auch als dringend?
4. Ab welchem Gewicht oder zu welcher Jahreszeit gilt ein Igel als „zu leicht“? Soll das Gewicht in die Dringlichkeit einfließen?
5. Push ans Dienst-Handy bei jeder Meldung oder nur bei dringenden? Über welchen Kanal (SMS, Signal, Telegram, Push-App)? Und was passiert nachts?

**Abläufe**
6. Reichen die fünf Spalten? Fehlt z. B. „Beratung reicht, Igel bleibt beim Finder“ oder „verstorben“?
7. Wer darf Karten verschieben? Braucht es eine Zuständigkeit („Ich kümmere mich“) pro Karte?
8. Wann gilt ein Pflegeigel als „abgegeben“, und wird der Fall dann automatisch abgeschlossen? (Im Prototyp: ja.)
9. Reichen Kürzel statt Login für die Helfer*innen?

**Datenschutz und Texte**
10. Einwilligungstext und Datenschutzerklärung: Wer prüft das? Wie lange bewahren wir Telefonnummer und Fundort auf, und wer löscht sie?
11. Dürfen Fotos von Finder*innen auch in der Pflegeigel-Akte bleiben?
12. Fachliche Prüfung der Sofort-Tipps (Wärme, Wasser, keine Milch, Maden) und der Texte „Was passiert jetzt?“.
13. „Sie“ im öffentlichen Formular, „du“ in der Leitstelle: Passt das so?

**Technik (später)**
14. Wo läuft Baserow/n8n, und wer betreut das? Wie melden sich die Helfer*innen an?
15. Medikamente: Freitext für die Dosis reicht, oder brauchen wir feste Listen (Wirkstoff, Einheit, Intervall)?
