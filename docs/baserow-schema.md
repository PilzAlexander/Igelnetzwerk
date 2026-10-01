# Baserow-Tabellen

_Automatisch erzeugt aus `src/data/schema.js` – nicht von Hand ändern._

## `fundmeldungen` (Fundmeldungen)

| Feld | Baserow-Typ | Details |
|---|---|---|
| `id` | autonumber | **Primärfeld** |
| `gemeldet_am` | created_on | mit Uhrzeit |
| `plz` | text | Pflicht · Text statt Zahl wegen möglicher führender Null |
| `ort` | text | aus der PLZ-Liste abgeleitet |
| `landkreis` | single_select | Optionen: `IN`, `EI`, `ND`, `PAF` |
| `fundort` | long_text |  |
| `standort_lat` | number | 6 Nachkommastellen |
| `standort_lng` | number | 6 Nachkommastellen |
| `gewicht_g` | number | 0 Nachkommastellen |
| `foto` | file |  |
| `merkmale` | multiple_select | Optionen: `maden_fliegeneier`, `verletzt`, `tagsueber`, `sehr_klein`, `apathisch`, `jungtier_allein`, `sonstiges` |
| `merkmale_freitext` | long_text |  |
| `telefon` | phone_number | Pflicht |
| `einwilligung_datenschutz` | boolean | Pflicht |
| `status` | single_select | Optionen: `neu`, `rueckruf`, `kommt`, `in_pflege`, `abgeschlossen` |
| `abschluss_art` | single_select | Optionen: `ausgewildert`, `weitervermittelt` · nur bei status = abgeschlossen |
| `dringend` | boolean | wird von der Regel gesetzt, kann von Hand geändert werden |
| `dringend_grund` | text |  |
| `status_geaendert_am` | date | mit Uhrzeit |
| `pflegeigel` | link_row | → `pflegeigel` |

## `pflegeigel` (Pflegeigel)

| Feld | Baserow-Typ | Details |
|---|---|---|
| `id` | autonumber |  |
| `name` | text | **Primärfeld** · Pflicht |
| `foto` | file |  |
| `fundmeldung` | link_row | → `fundmeldungen` |
| `aufgenommen_am` | date |  |
| `status` | single_select | Optionen: `in_pflege`, `ausgewildert`, `weitervermittelt` |
| `geschlecht` | single_select | Optionen: `unbekannt`, `weiblich`, `maennlich` |

## `gewichte` (Gewichte)

| Feld | Baserow-Typ | Details |
|---|---|---|
| `id` | autonumber | **Primärfeld** |
| `igel` | link_row | → `pflegeigel` |
| `datum` | date |  |
| `gewicht_g` | number | 0 Nachkommastellen |
| `kuerzel` | text |  |

## `medikamente` (Medikamente)

| Feld | Baserow-Typ | Details |
|---|---|---|
| `id` | autonumber |  |
| `name` | text | **Primärfeld** |
| `igel` | link_row | → `pflegeigel` |
| `dosis` | text |  |
| `von` | date |  |
| `bis` | date |  |
| `kuerzel` | text |  |

## `notizen` (Notizen)

| Feld | Baserow-Typ | Details |
|---|---|---|
| `id` | autonumber | **Primärfeld** |
| `igel` | link_row | → `pflegeigel` |
| `erstellt_am` | date | mit Uhrzeit |
| `text` | long_text |  |
| `kuerzel` | text |  |

## `push_protokoll` (Push-Protokoll)

| Feld | Baserow-Typ | Details |
|---|---|---|
| `id` | autonumber | **Primärfeld** |
| `zeitpunkt` | date | mit Uhrzeit |
| `fundmeldung` | link_row | → `fundmeldungen` |
| `nachricht` | long_text |  |
| `empfaenger` | text |  |

## `abweisungen` (Abweisungen)

Bewusst ohne Telefonnummer – nur zur Statistik

| Feld | Baserow-Typ | Details |
|---|---|---|
| `id` | autonumber | **Primärfeld** |
| `zeitpunkt` | date | mit Uhrzeit |
| `plz` | text |  |

## Anzeigetexte der Auswahlwerte

- **status:** `neu` = Neu, `rueckruf` = Rückruf läuft, `kommt` = Kommt auf Station, `in_pflege` = In Pflege, `abgeschlossen` = Ausgewildert / Weitervermittelt
- **abschluss_art:** `ausgewildert` = Ausgewildert, `weitervermittelt` = Weitervermittelt
- **merkmale:** `maden_fliegeneier` = Maden / Fliegeneier, `verletzt` = Verletzt, `tagsueber` = Tagsüber unterwegs, `sehr_klein` = Sehr klein / leicht, `apathisch` = Liegt apathisch da, `jungtier_allein` = Jungtier ohne Mutter, `sonstiges` = Sonstiges
- **igel_status:** `in_pflege` = In Pflege, `ausgewildert` = Ausgewildert, `weitervermittelt` = Weitervermittelt
- **geschlecht:** `unbekannt` = unbekannt, `weiblich` = weiblich, `maennlich` = männlich
