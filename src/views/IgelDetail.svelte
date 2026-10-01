<script>
  import { dataStore } from '../data/dataStore.js';
  import { LABELS } from '../data/schema.js';
  import { liveTabelle } from '../lib/live.svelte.js';
  import { zeigeToast } from '../lib/toast.svelte.js';
  import { gewichteVon, trend } from '../lib/gewicht.js';
  import { datum, datumKurz, datumZeit, tageBis, heute } from '../lib/zeit.js';
  import Trend from '../components/Trend.svelte';
  import GewichtDiagramm from '../components/GewichtDiagramm.svelte';
  import GewichtSheet from '../components/GewichtSheet.svelte';
  import BottomSheet from '../components/BottomSheet.svelte';
  import KuerzelFrage, { aktuellesKuerzel } from '../components/KuerzelFrage.svelte';

  let { id } = $props();

  const alleIgel = liveTabelle('pflegeigel');
  const gewichte = liveTabelle('gewichte');
  const medikamente = liveTabelle('medikamente');
  const notizen = liveTabelle('notizen');
  const faelle = liveTabelle('fundmeldungen');

  let igel = $derived(alleIgel.zeilen.find((i) => i.id === id));
  let fall = $derived(igel?.fundmeldung ? faelle.zeilen.find((f) => f.id === igel.fundmeldung) : null);
  let verlauf = $derived(gewichteVon(id, gewichte.zeilen));
  let t = $derived(trend(verlauf));
  let meds = $derived(
    medikamente.zeilen
      .filter((m) => m.igel === id)
      .map((m) => ({ ...m, rest: m.bis ? tageBis(m.bis) : null }))
      .sort((a, b) => (a.rest < 0) - (b.rest < 0) || (a.bis ?? '').localeCompare(b.bis ?? '')),
  );
  let notizListe = $derived(notizen.zeilen.filter((n) => n.igel === id).sort((a, b) => b.erstellt_am.localeCompare(a.erstellt_am)));
  let tageInPflege = $derived(igel?.aufgenommen_am ? -tageBis(igel.aufgenommen_am) : null);

  // Sheets
  let wiegeIgel = $state(null);
  let notizOffen = $state(false);
  let notizText = $state('');
  let medOffen = $state(false);
  let med = $state({ name: '', dosis: '', bis: '' });
  let fehler = $state({});

  function notizStarten() {
    notizText = '';
    fehler = {};
    notizOffen = true;
  }
  async function notizSpeichern(e) {
    e.preventDefault();
    const kuerzel = aktuellesKuerzel();
    fehler = { text: !notizText.trim(), kuerzel: !kuerzel };
    if (fehler.text || fehler.kuerzel) return;
    await dataStore.create('notizen', { igel: id, erstellt_am: new Date().toISOString(), text: notizText.trim(), kuerzel });
    notizOffen = false;
    zeigeToast('Notiz gespeichert.');
  }

  function medStarten() {
    med = { name: '', dosis: '', bis: '' };
    fehler = {};
    medOffen = true;
  }
  async function medSpeichern(e) {
    e.preventDefault();
    const kuerzel = aktuellesKuerzel();
    fehler = { name: !med.name.trim(), kuerzel: !kuerzel };
    if (fehler.name || fehler.kuerzel) return;
    await dataStore.create('medikamente', { igel: id, name: med.name.trim(), dosis: med.dosis.trim(), von: heute(), bis: med.bis || null, kuerzel });
    medOffen = false;
    zeigeToast('Medikament eingetragen.');
  }

  async function abgeben(art) {
    const vorherIgel = { status: igel.status };
    const vorherFall = fall ? { status: fall.status, abschluss_art: fall.abschluss_art, status_geaendert_am: fall.status_geaendert_am } : null;
    await dataStore.update('pflegeigel', id, { status: art });
    if (fall) await dataStore.update('fundmeldungen', fall.id, { status: 'abgeschlossen', abschluss_art: art, status_geaendert_am: new Date().toISOString() });
    zeigeToast(`${igel.name}: ${LABELS.igel_status[art]}`, {
      aktion: {
        label: 'Rückgängig',
        fn: async () => {
          await dataStore.update('pflegeigel', id, vorherIgel);
          if (vorherFall) await dataStore.update('fundmeldungen', fall.id, vorherFall);
        },
      },
    });
  }
</script>

<main class="seite">
  <a class="zurueck" href="#/igel">← Alle Pflegeigel</a>

  {#if !alleIgel.geladen}
    <p>Lädt …</p>
  {:else if !igel}
    <div class="leer"><strong>Diesen Igel gibt es nicht (mehr).</strong><a href="#/igel">Zur Übersicht</a></div>
  {:else}
    <header class="kopf">
      {#if igel.foto}<img class="foto" src={igel.foto} alt="Foto von {igel.name}" />{/if}
      <div>
        <h1>{igel.name}</h1>
        <p class="meta">
          {#if igel.status !== 'in_pflege'}<span class="tag">{LABELS.igel_status[igel.status]}</span>{/if}
          {#if tageInPflege === 0}Seit heute bei uns{:else if tageInPflege !== null}Seit {tageInPflege} {tageInPflege === 1 ? 'Tag' : 'Tagen'} bei uns (ab {datum(igel.aufgenommen_am)}){/if}
          {#if igel.geschlecht && igel.geschlecht !== 'unbekannt'} · {LABELS.geschlecht[igel.geschlecht]}{/if}
          {#if fall}<br />Fundort: {fall.plz} {fall.ort} (Fall {fall.id}){/if}
        </p>
      </div>
    </header>

    {#if igel.status === 'in_pflege'}
      <div class="schnell">
        <button class="knopf primaer gross" onclick={() => (wiegeIgel = igel)}>⚖️ Gewicht eintragen</button>
        <button class="knopf gross" onclick={notizStarten}>✏️ Notiz schreiben</button>
      </div>
    {/if}

    <section class="box">
      <h2>Gewicht</h2>
      <p class="aktuell"><Trend t={t} gross /> {#if t}<span class="am">am {datumKurz(t.datum)}</span>{/if}</p>
      <GewichtDiagramm werte={verlauf} />
      {#if verlauf.length}
        <details>
          <summary>Alle {verlauf.length} Wiegungen anzeigen</summary>
          <ul class="wiegungen">
            {#each [...verlauf].reverse() as w}
              <li><span>{datum(w.datum)}</span><strong>{w.gewicht_g} g</strong><span class="kuerzel">{w.kuerzel}</span></li>
            {/each}
          </ul>
        </details>
      {/if}
    </section>

    <section class="box">
      <h2>Medikamente</h2>
      {#if meds.length === 0}
        <p class="leer-text">Keine Medikamente eingetragen.</p>
      {/if}
      <ul class="meds">
        {#each meds as m}
          <li class:vorbei={m.rest !== null && m.rest < 0}>
            <strong>{m.name}</strong>
            <span>{m.dosis}</span>
            <span class="bis">
              {#if m.rest === null}ohne Enddatum
              {:else if m.rest < 0}beendet am {datum(m.bis)}
              {:else if m.rest === 0}<b>heute letzter Tag</b>
              {:else}bis {datum(m.bis)} (noch {m.rest} {m.rest === 1 ? 'Tag' : 'Tage'})
              {/if}
              {#if m.kuerzel}· {m.kuerzel}{/if}
            </span>
          </li>
        {/each}
      </ul>
      {#if igel.status === 'in_pflege'}<button class="knopf breit" onclick={medStarten}>＋ Medikament eintragen</button>{/if}
    </section>

    <section class="box">
      <h2>Notizen</h2>
      {#if notizListe.length === 0}<p class="leer-text">Noch keine Notizen.</p>{/if}
      <ul class="notizen">
        {#each notizListe as n}
          <li>
            <span class="notiz-kopf">{datumZeit(n.erstellt_am)} · <strong>{n.kuerzel}</strong></span>
            <p>{n.text}</p>
          </li>
        {/each}
      </ul>
      {#if igel.status === 'in_pflege'}<button class="knopf breit" onclick={notizStarten}>✏️ Notiz schreiben</button>{/if}
    </section>

    {#if igel.status === 'in_pflege'}
      <section class="box abgeben">
        <h2>Igel geht weg</h2>
        <p>Wenn {igel.name} die Station verlässt:</p>
        <div class="zwei">
          <button class="knopf" onclick={() => abgeben('ausgewildert')}>Ausgewildert</button>
          <button class="knopf" onclick={() => abgeben('weitervermittelt')}>Weitervermittelt</button>
        </div>
      </section>
    {:else}
      <button class="knopf leise breit" onclick={() => dataStore.update('pflegeigel', id, { status: 'in_pflege' })}>Doch wieder in Pflege</button>
    {/if}
  {/if}
</main>

<GewichtSheet bind:igel={wiegeIgel} letztes={t?.gewicht} />

<BottomSheet bind:offen={notizOffen} titel="Notiz zu {igel?.name ?? ''}">
  <form onsubmit={notizSpeichern} novalidate>
    <div class="feld">
      <label for="notiz">Was möchtest du festhalten?</label>
      <textarea id="notiz" rows="4" bind:value={notizText} data-autofokus aria-invalid={fehler.text} placeholder="z. B. Frisst gut, Kot normal"></textarea>
      {#if fehler.text}<p class="fehler">Bitte etwas eintragen.</p>{/if}
    </div>
    <KuerzelFrage fehler={fehler.kuerzel} />
    <button class="knopf primaer gross" type="submit">Notiz speichern</button>
  </form>
</BottomSheet>

<BottomSheet bind:offen={medOffen} titel="Medikament eintragen">
  <form onsubmit={medSpeichern} novalidate>
    <div class="feld">
      <label for="med-name">Name des Medikaments</label>
      <input id="med-name" type="text" bind:value={med.name} data-autofokus aria-invalid={fehler.name} />
      {#if fehler.name}<p class="fehler">Bitte den Namen eintragen.</p>{/if}
    </div>
    <div class="feld">
      <label for="med-dosis">Wie viel und wann?</label>
      <input id="med-dosis" type="text" bind:value={med.dosis} placeholder="z. B. 0,1 ml morgens und abends" />
    </div>
    <div class="feld">
      <label for="med-bis">Bis wann? <span class="freiwillig">(freiwillig)</span></label>
      <input id="med-bis" type="date" bind:value={med.bis} min={heute()} />
    </div>
    <KuerzelFrage fehler={fehler.kuerzel} />
    <button class="knopf primaer gross" type="submit">Speichern</button>
  </form>
</BottomSheet>

<style>
  .zurueck { display: inline-flex; align-items: center; min-height: var(--ziel); font-weight: 700; text-decoration: none; }
  .kopf { display: grid; gap: 0.8rem; margin-bottom: 1rem; }
  .foto { width: 100%; max-height: 280px; object-fit: cover; border-radius: var(--radius); }
  h1 { margin: 0 0 0.2rem; font-size: 2rem; }
  .meta { color: var(--text-2); margin: 0; }
  .schnell { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 1rem; }
  .schnell .knopf { padding: 0.5em; min-width: 0; }
  section.box { margin-bottom: 1rem; }
  .aktuell { display: flex; align-items: baseline; gap: 0.6rem; flex-wrap: wrap; }
  .am { color: var(--text-2); }
  details { margin-top: 0.6rem; }
  summary { min-height: var(--ziel); display: flex; align-items: center; cursor: pointer; font-weight: 600; color: var(--gruen-dunkel); }
  .wiegungen { list-style: none; padding: 0; margin: 0; }
  .wiegungen li { display: grid; grid-template-columns: 1fr auto 3rem; gap: 0.5rem; padding: 0.35rem 0; border-bottom: 1px solid #eee; }
  .kuerzel { color: var(--text-2); text-align: right; }
  .meds, .notizen { list-style: none; padding: 0; margin: 0 0 0.8rem; display: grid; gap: 0.6rem; }
  .meds li { display: grid; gap: 0.1rem; padding: 0.6rem 0.8rem; border-radius: 8px; background: var(--gruen-hell); border-left: 5px solid var(--gruen); }
  .meds li.vorbei { background: #f1f0ec; border-left-color: var(--rand-hell); color: var(--text-2); }
  .bis { font-size: 0.95rem; }
  .notizen li { border-left: 4px solid var(--rand-hell); padding-left: 0.8rem; }
  .notiz-kopf { font-size: 0.9rem; color: var(--text-2); }
  .notizen p { margin: 0.1rem 0 0; }
  .leer-text { color: var(--text-2); }
  .zwei { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.5rem; }
  @media (min-width: 700px) {
    .kopf { grid-template-columns: 260px 1fr; align-items: end; }
  }
</style>
