<script>
  import { dataStore } from '../data/dataStore.js';
  import { LABELS, STATUS_REIHENFOLGE } from '../data/schema.js';
  import { liveTabelle } from '../lib/live.svelte.js';
  import { zeigeToast } from '../lib/toast.svelte.js';
  import { seit, datumZeit } from '../lib/zeit.js';
  import Fallkarte from '../components/Fallkarte.svelte';
  import BottomSheet from '../components/BottomSheet.svelte';
  import AufnahmeSheet from '../components/AufnahmeSheet.svelte';
  import LandkreisTag from '../components/LandkreisTag.svelte';

  const faelle = liveTabelle('fundmeldungen');
  const igel = liveTabelle('pflegeigel');

  const LEER = {
    neu: ['Noch keine neuen Meldungen.', 'Neue Meldungen aus dem Formular erscheinen hier automatisch.'],
    rueckruf: ['Gerade wird niemand zurückgerufen.', 'Wenn du jemanden anrufst: Fall hierher verschieben.'],
    kommt: ['Kein Igel ist unterwegs zur Station.', 'Hierher kommen Fälle, bei denen der Igel gebracht oder abgeholt wird.'],
    in_pflege: ['Gerade kein Fall in Pflege.', 'Ist ein Igel angekommen? Fall hierher verschieben und als Pflegeigel anlegen.'],
    abgeschlossen: ['Noch nichts abgeschlossen.', 'Ausgewilderte und weitervermittelte Igel landen hier.'],
  };

  let kreisFilter = $state('alle');
  let nurDringend = $state(false);
  let jetzt = $state(Date.now());
  let aktiveSpalte = $state(0);
  let spaltenBox = $state();
  let offenerFall = $state(null);
  let sheetOffen = $state(false);
  let abschlussFrage = $state(null); // Fall, der per Drag & Drop auf „abgeschlossen“ gezogen wurde
  let abschlussOffen = $state(false);
  let aufnahmeFall = $state(null);
  let ziehtId = $state(null);
  let ueberSpalte = $state(null);

  // Drag & Drop nur mit Maus (am Handy: Antippen + Bottom-Sheet)
  const feinerZeiger = typeof matchMedia !== 'undefined' && matchMedia('(pointer: fine)').matches;

  $effect(() => {
    const t = setInterval(() => (jetzt = Date.now()), 60000);
    return () => clearInterval(t);
  });

  function sortiere(liste, status) {
    return [...liste].sort((a, b) => {
      if (a.dringend !== b.dringend) return a.dringend ? -1 : 1;
      if (status === 'abgeschlossen') return b.status_geaendert_am.localeCompare(a.status_geaendert_am);
      return a.gemeldet_am.localeCompare(b.gemeldet_am); // wer am längsten wartet, steht oben
    });
  }

  let gefiltert = $derived(
    faelle.zeilen.filter((f) => (kreisFilter === 'alle' || f.landkreis === kreisFilter) && (!nurDringend || f.dringend)),
  );
  let filterAktiv = $derived(kreisFilter !== 'alle' || nurDringend);
  let spalten = $derived(
    STATUS_REIHENFOLGE.map((s) => ({ status: s, faelle: sortiere(gefiltert.filter((f) => f.status === s), s) })),
  );
  // Fall im offenen Sheet immer aktuell halten
  let fallImSheet = $derived(offenerFall ? faelle.zeilen.find((f) => f.id === offenerFall) : null);
  let igelZumFall = $derived(fallImSheet?.pflegeigel ? igel.zeilen.find((i) => i.id === fallImSheet.pflegeigel) : null);

  function oeffnen(fall) {
    offenerFall = fall.id;
    sheetOffen = true;
  }

  async function verschiebe(fall, ziel, abschluss = null) {
    if (fall.status === ziel && (fall.abschluss_art ?? null) === abschluss) return;
    const vorher = { status: fall.status, abschluss_art: fall.abschluss_art, status_geaendert_am: fall.status_geaendert_am };
    await dataStore.update('fundmeldungen', fall.id, {
      status: ziel,
      abschluss_art: ziel === 'abgeschlossen' ? abschluss : null,
      status_geaendert_am: new Date().toISOString(),
    });
    sheetOffen = false;
    const zielName = abschluss ? LABELS.abschluss_art[abschluss] : LABELS.status[ziel];
    zeigeToast(`Fall ${fall.id} (${fall.ort}) → „${zielName}“`, {
      aktion: { label: 'Rückgängig', fn: () => dataStore.update('fundmeldungen', fall.id, vorher) },
    });
    if (ziel === 'in_pflege' && !fall.pflegeigel) aufnahmeFall = { ...fall };
  }

  async function dringendUmschalten(fall) {
    await dataStore.update('fundmeldungen', fall.id, {
      dringend: !fall.dringend,
      dringend_grund: fall.dringend ? '' : 'von Hand markiert',
    });
  }

  // Handy: Tabs <-> wischbare Spalten
  function zeigeSpalte(i) {
    const spalte = spaltenBox?.children[i];
    spaltenBox?.scrollTo({ left: spalte.offsetLeft - spaltenBox.offsetLeft, behavior: 'smooth' });
  }
  function beimScrollen() {
    const kinder = [...spaltenBox.children];
    const links = spaltenBox.scrollLeft;
    let beste = 0;
    kinder.forEach((k, i) => {
      if (Math.abs(k.offsetLeft - spaltenBox.offsetLeft - links) < Math.abs(kinder[beste].offsetLeft - spaltenBox.offsetLeft - links)) beste = i;
    });
    aktiveSpalte = beste;
  }

  // Desktop: Drag & Drop
  function ablegen(e, status) {
    e.preventDefault();
    ueberSpalte = null;
    const fall = faelle.zeilen.find((f) => f.id === Number(e.dataTransfer.getData('text/plain')));
    if (!fall || fall.status === status) return;
    if (status === 'abgeschlossen') {
      abschlussFrage = fall;
      abschlussOffen = true;
    } else verschiebe(fall, status);
  }
</script>

<main class="board">
  <div class="kopf">
    <h1>Fälle</h1>
    <div class="chips kreise" role="radiogroup" aria-label="Nach Landkreis filtern">
      {#each ['alle', 'IN', 'EI', 'ND', 'PAF'] as k}
        <button class="chip klein" role="radio" aria-checked={kreisFilter === k} onclick={() => (kreisFilter = k)}>
          {#if k === 'alle'}Alle{:else}<span class="punkt" style="background: var(--lk-{k})" aria-hidden="true"></span>{k}{/if}
        </button>
      {/each}
    </div>
    <button class="chip klein dringend-filter" aria-pressed={nurDringend} onclick={() => (nurDringend = !nurDringend)}>
      <span aria-hidden="true">{nurDringend ? '✓' : '⚠'}</span> Nur dringende
    </button>
  </div>

  <!-- Tabs (nur Handy) -->
  <div class="tabs" role="tablist" aria-label="Spalten">
    {#each spalten as s, i}
      <button role="tab" aria-selected={aktiveSpalte === i} class:aktiv={aktiveSpalte === i} onclick={() => zeigeSpalte(i)}>
        {LABELS.status[s.status].replace(' / ', '/')}
        <span class="anzahl" class:hat-dringende={s.faelle.some((f) => f.dringend)}>{s.faelle.length}</span>
      </button>
    {/each}
  </div>

  {#if faelle.fehler}
    <p class="leer"><strong>Daten konnten nicht geladen werden.</strong>{faelle.fehler}</p>
  {/if}

  <div class="spalten" bind:this={spaltenBox} onscroll={beimScrollen}>
    {#each spalten as s}
      <section
        class="spalte"
        class:ziel={ueberSpalte === s.status}
        aria-label="{LABELS.status[s.status]}, {s.faelle.length} Fälle"
        ondragover={(e) => { if (ziehtId) { e.preventDefault(); ueberSpalte = s.status; } }}
        ondragleave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) ueberSpalte = null; }}
        ondrop={(e) => ablegen(e, s.status)}
      >
        <h2 class="spalten-titel">{LABELS.status[s.status]} <span class="anzahl">{s.faelle.length}</span></h2>
        <div class="karten">
          {#each s.faelle as fall (fall.id)}
            <Fallkarte
              {fall}
              {jetzt}
              ziehbar={feinerZeiger}
              onoeffnen={oeffnen}
              ondragstart={(e) => { ziehtId = fall.id; e.dataTransfer.setData('text/plain', String(fall.id)); e.dataTransfer.effectAllowed = 'move'; }}
              ondragend={() => { ziehtId = null; ueberSpalte = null; }}
            />
          {:else}
            {#if faelle.geladen}
              <div class="leer">
                {#if filterAktiv}
                  <strong>Keine Fälle für diesen Filter.</strong>
                  <button class="knopf leise" onclick={() => { kreisFilter = 'alle'; nurDringend = false; }}>Filter zurücksetzen</button>
                {:else}
                  <strong>{LEER[s.status][0]}</strong>{LEER[s.status][1]}
                {/if}
              </div>
            {/if}
          {/each}
        </div>
      </section>
    {/each}
  </div>
  {#if feinerZeiger}<p class="dnd-hinweis">Tipp: Karten mit der Maus in eine andere Spalte ziehen – oder anklicken.</p>{/if}
</main>

<!-- Fall-Details + Verschieben -->
<BottomSheet bind:offen={sheetOffen} titel={fallImSheet ? `Fall ${fallImSheet.id} · ${fallImSheet.ort}` : ''}>
  {#if fallImSheet}
    {@const f = fallImSheet}
    <div class="sheet-kopf">
      {#if f.dringend}<p class="dringend-zeile">⚠ <strong>DRINGEND</strong> {f.dringend_grund ? `– ${f.dringend_grund}` : ''}</p>{/if}
      <p><LandkreisTag kreis={f.landkreis} /> <strong>{f.plz} {f.ort}</strong> · {seit(f.gemeldet_am, jetzt)}</p>
    </div>

    <h3 class="abschnitt">Verschieben nach …</h3>
    <div class="ziele">
      {#each STATUS_REIHENFOLGE as s}
        {#if s === 'abgeschlossen'}
          {#each ['ausgewildert', 'weitervermittelt'] as art}
            {@const hier = f.status === s && f.abschluss_art === art}
            <button class="knopf gross ziel-knopf" class:hier disabled={hier} onclick={() => verschiebe(f, s, art)}>
              {LABELS.abschluss_art[art]}{#if hier}<span class="hier-text">✓ ist gerade hier</span>{/if}
            </button>
          {/each}
        {:else}
          {@const hier = f.status === s}
          <button class="knopf gross ziel-knopf" class:hier disabled={hier} onclick={() => verschiebe(f, s)}>
            {LABELS.status[s]}{#if hier}<span class="hier-text">✓ ist gerade hier</span>{/if}
          </button>
        {/if}
      {/each}
    </div>

    {#if f.status === 'in_pflege' || f.pflegeigel}
      <div class="pflege">
        {#if igelZumFall}
          <a class="knopf breit" href="#/igel/{igelZumFall.id}">🦔 Zum Pflegeigel „{igelZumFall.name}“</a>
        {:else}
          <button class="knopf primaer breit" onclick={() => { sheetOffen = false; aufnahmeFall = { ...f }; }}>🦔 Als Pflegeigel anlegen</button>
        {/if}
      </div>
    {/if}

    <h3 class="abschnitt">Angaben aus der Meldung</h3>
    {#if f.foto}<img class="sheet-foto" src={f.foto} alt="Foto aus der Meldung" />{/if}
    <dl class="angaben">
      <dt>Gemeldet</dt><dd>{datumZeit(f.gemeldet_am)}</dd>
      <dt>Telefon</dt><dd><a href="tel:{f.telefon.replace(/[^\d+]/g, '')}">{f.telefon}</a></dd>
      {#if f.fundort}<dt>Fundort</dt><dd>{f.fundort}</dd>{/if}
      {#if f.standort_lat}
        <dt>Standort</dt>
        <dd><a href="https://www.openstreetmap.org/?mlat={f.standort_lat}&mlon={f.standort_lng}#map=17/{f.standort_lat}/{f.standort_lng}" target="_blank" rel="noopener">Auf Karte zeigen</a></dd>
      {/if}
      <dt>Gewicht</dt><dd>{f.gewicht_g ? `${f.gewicht_g} g` : 'nicht angegeben'}</dd>
      <dt>Auffällig</dt>
      <dd>
        {#if f.merkmale?.length}{f.merkmale.map((m) => LABELS.merkmale[m]).join(', ')}{:else}nichts angegeben{/if}
        {#if f.merkmale_freitext}<br />„{f.merkmale_freitext}“{/if}
      </dd>
    </dl>
    <a class="knopf primaer breit" href="tel:{f.telefon.replace(/[^\d+]/g, '')}">📞 {f.telefon} anrufen</a>
    <button class="knopf leise breit unten" onclick={() => dringendUmschalten(f)}>
      {f.dringend ? 'Nicht mehr dringend' : '⚠ Als dringend markieren'}
    </button>
  {/if}
</BottomSheet>

<!-- Nach Drag & Drop auf die letzte Spalte -->
<BottomSheet bind:offen={abschlussOffen} titel="Wie ging es aus?">
  {#if abschlussFrage}
    <p>Fall {abschlussFrage.id} ({abschlussFrage.ort}):</p>
    <div class="ziele">
      <button class="knopf gross" data-autofokus onclick={() => { abschlussOffen = false; verschiebe(abschlussFrage, 'abgeschlossen', 'ausgewildert'); }}>Ausgewildert</button>
      <button class="knopf gross" onclick={() => { abschlussOffen = false; verschiebe(abschlussFrage, 'abgeschlossen', 'weitervermittelt'); }}>Weitervermittelt</button>
    </div>
  {/if}
</BottomSheet>

<AufnahmeSheet bind:fall={aufnahmeFall} />

<style>
  .board { padding: 0.8rem 0 6rem; }
  .kopf {
    padding: 0 16px; display: grid; gap: 0.5rem 0.8rem; align-items: center;
    grid-template-columns: 1fr auto; grid-template-areas: 'titel dringend' 'kreise kreise';
  }
  .kopf h1 { margin: 0; grid-area: titel; }
  .dringend-filter { grid-area: dringend; }
  .kreise { grid-area: kreise; gap: 0.3rem; flex-wrap: nowrap; }
  .kreise .chip.klein { flex: 1 1 0; min-width: 0; justify-content: center; gap: 0.3em; padding: 0.3em 0.3em; }
  .chip.klein { min-height: var(--ziel); padding: 0.3em 0.75em; font-size: 0.95rem; white-space: nowrap; }
  .chip[aria-checked='true'] { background: var(--gruen); border-color: var(--gruen); color: #fff; }
  .punkt { width: 0.75em; height: 0.75em; border-radius: 50%; display: inline-block; outline: 2px solid #fff; }
  .dringend-filter[aria-pressed='true'] { background: var(--rot); border-color: var(--rot); }

  .tabs {
    display: flex; gap: 0.3rem; overflow-x: auto; padding: 0.8rem 16px 0.3rem; scrollbar-width: none;
    position: sticky; top: 52px; background: var(--hg); z-index: 5;
  }
  .tabs::-webkit-scrollbar { display: none; }
  .tabs button {
    flex: none; min-height: var(--ziel); padding: 0 0.85rem; border: 2px solid var(--rand-hell); border-radius: 999px;
    background: #fff; font: inherit; font-weight: 600; font-size: 0.95rem; color: var(--text); display: flex; align-items: center; gap: 0.4rem; cursor: pointer;
  }
  .tabs button.aktiv { background: var(--text); color: #fff; border-color: var(--text); }
  .anzahl { background: #e7e5df; color: var(--text); border-radius: 999px; min-width: 1.6em; padding: 0 0.4em; font-size: 0.85rem; text-align: center; font-weight: 700; }
  .anzahl.hat-dringende { background: var(--rot); color: #fff; }

  .spalten {
    display: grid; grid-auto-flow: column; grid-auto-columns: calc(100% - 40px); gap: 12px;
    overflow-x: auto; scroll-snap-type: x mandatory; padding: 0.4rem 16px 1rem; scroll-padding: 0 16px;
    scrollbar-width: thin;
  }
  .spalte { min-width: 0; scroll-snap-align: start; background: #e9e6df; border-radius: 14px; padding: 0.6rem; min-height: 50vh; border: 3px solid transparent; }
  .spalte.ziel { border-color: var(--gruen); background: var(--gruen-hell); }
  .spalten-titel { font-size: 1rem; margin: 0.1rem 0.2rem 0.6rem; display: flex; justify-content: space-between; align-items: center; }
  .karten { display: flex; flex-direction: column; gap: 0.6rem; }
  .dnd-hinweis { color: var(--text-2); padding: 0 16px; font-size: 0.95rem; }
  .leer .knopf { margin-top: 0.6rem; }

  @media (min-width: 900px) {
    .kopf { grid-template-columns: auto 1fr auto; grid-template-areas: 'titel kreise dringend'; }
    .kreise { justify-content: flex-end; }
    .kreise .chip.klein { flex: none; padding: 0.3em 0.75em; }
    .tabs { display: none; }
    .spalten { grid-auto-columns: minmax(250px, 1fr); }
  }

  /* Sheet */
  .sheet-kopf p { margin: 0 0 0.5rem; }
  .dringend-zeile { background: var(--rot-hell); color: var(--rot); padding: 0.5rem 0.7rem; border-radius: 8px; border-left: 5px solid var(--rot); }
  .abschnitt { margin: 1.2rem 0 0.6rem; font-size: 1rem; color: var(--text-2); text-transform: uppercase; letter-spacing: 0.03em; }
  .ziele { display: grid; gap: 0.5rem; }
  .ziel-knopf { justify-content: space-between; }
  .ziel-knopf.hier { opacity: 1; background: var(--gruen-hell); border-style: dashed; color: var(--text); }
  .hier-text { font-size: 0.85rem; font-weight: 600; }
  .pflege { margin-top: 1rem; }
  .sheet-foto { width: 100%; max-height: 220px; object-fit: cover; border-radius: var(--radius); margin-bottom: 0.6rem; }
  .angaben { display: grid; grid-template-columns: auto 1fr; gap: 0.35rem 1rem; margin: 0 0 1rem; }
  .angaben dt { font-weight: 700; }
  .angaben dd { margin: 0; }
  .unten { margin-top: 0.6rem; }
</style>
