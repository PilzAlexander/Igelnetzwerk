<script>
  // Fall aus dem Board als Pflegeigel anlegen: Foto + Daten übernehmen, Name vergeben
  import { dataStore } from '../data/dataStore.js';
  import { LABELS } from '../data/schema.js';
  import { zeigeToast } from '../lib/toast.svelte.js';
  import { heute, datum } from '../lib/zeit.js';
  import BottomSheet from './BottomSheet.svelte';
  import KuerzelFrage, { aktuellesKuerzel } from './KuerzelFrage.svelte';

  let { fall = $bindable(null) } = $props();
  let offen = $state(false);
  let name = $state('');
  let gewicht = $state('');
  let geschlecht = $state('unbekannt');
  let fehler = $state({});
  let speichert = $state(false);

  $effect(() => {
    if (fall) {
      name = '';
      gewicht = fall.gewicht_g ? String(fall.gewicht_g) : '';
      geschlecht = 'unbekannt';
      fehler = {};
      offen = true;
    }
  });

  async function anlegen(e) {
    e.preventDefault();
    const kuerzel = aktuellesKuerzel();
    fehler = { name: !name.trim(), kuerzel: !kuerzel };
    if (fehler.name || fehler.kuerzel) return;
    speichert = true;
    const igel = await dataStore.create('pflegeigel', {
      name: name.trim(),
      foto: fall.foto,
      fundmeldung: fall.id,
      aufgenommen_am: heute(),
      status: 'in_pflege',
      geschlecht,
    });
    if (Number(gewicht) > 0) {
      await dataStore.create('gewichte', { igel: igel.id, datum: heute(), gewicht_g: Math.round(Number(gewicht)), kuerzel });
    }
    const merkmale = (fall.merkmale ?? []).map((m) => LABELS.merkmale[m]).join(', ');
    await dataStore.create('notizen', {
      igel: igel.id,
      erstellt_am: new Date().toISOString(),
      text: `Aus Fall ${fall.id} übernommen (gemeldet am ${datum(fall.gemeldet_am)}, ${fall.plz} ${fall.ort}). ${merkmale ? `Auffällig: ${merkmale}.` : ''} ${fall.fundort ? `Fundort: ${fall.fundort}` : ''}`.trim(),
      kuerzel,
    });
    await dataStore.update('fundmeldungen', fall.id, { pflegeigel: igel.id });
    speichert = false;
    offen = false;
    fall = null;
    zeigeToast(`${igel.name} ist jetzt bei den Pflegeigeln.`, { link: { href: `#/igel/${igel.id}`, label: 'Ansehen' } });
  }
</script>

<BottomSheet bind:offen titel="Igel aufnehmen" onclose={() => (fall = null)}>
  {#if fall}
    <form onsubmit={anlegen} novalidate>
      <p>Fall {fall.id} ist jetzt in Pflege. Leg ihn gleich als Pflegeigel an – Foto und Daten werden übernommen.</p>
      {#if fall.foto}<img class="foto" src={fall.foto} alt="Foto aus der Fundmeldung" />{/if}

      <div class="feld">
        <label for="igelname">Name für den Igel</label>
        <input id="igelname" type="text" bind:value={name} data-autofokus autocomplete="off" placeholder="z. B. Krümel" aria-invalid={fehler.name} />
        {#if fehler.name}<p class="fehler">Bitte einen Namen eingeben.</p>{/if}
      </div>

      <div class="feld">
        <label for="aufnahmegewicht">Gewicht heute <span class="freiwillig">(Gramm, freiwillig)</span></label>
        <input id="aufnahmegewicht" type="text" inputmode="numeric" bind:value={gewicht} oninput={() => (gewicht = gewicht.replace(/\D/g, ''))} />
      </div>

      <fieldset>
        <legend>Geschlecht</legend>
        <div class="chips" style="margin-top: 0.4rem">
          {#each Object.entries(LABELS.geschlecht) as [key, label]}
            <button type="button" class="chip" aria-pressed={geschlecht === key} onclick={() => (geschlecht = key)}>{label}</button>
          {/each}
        </div>
      </fieldset>

      <KuerzelFrage fehler={fehler.kuerzel} />

      <button class="knopf primaer gross" type="submit" disabled={speichert}>Als Pflegeigel anlegen</button>
      <button class="knopf leise breit spaeter" type="button" onclick={() => { offen = false; fall = null; }}>Später</button>
    </form>
  {/if}
</BottomSheet>

<style>
  .foto { width: 100%; max-height: 200px; object-fit: cover; border-radius: var(--radius); margin-bottom: 1rem; }
  .spaeter { margin-top: 0.6rem; }
</style>
