<script>
  // Schnellaktion: Gewicht eintragen. Zahl tippen -> „Speichern“.
  import { dataStore } from '../data/dataStore.js';
  import { zeigeToast } from '../lib/toast.svelte.js';
  import { heute } from '../lib/zeit.js';
  import BottomSheet from './BottomSheet.svelte';
  import KuerzelFrage, { aktuellesKuerzel } from './KuerzelFrage.svelte';

  let { igel = $bindable(null), letztes = null } = $props();
  let offen = $state(false);
  let wert = $state('');
  let fehler = $state({});
  let warnung = $state('');

  $effect(() => {
    if (igel) {
      wert = '';
      fehler = {};
      warnung = '';
      offen = true;
    }
  });

  async function speichern(e) {
    e.preventDefault();
    const g = Number(wert);
    const kuerzel = aktuellesKuerzel();
    fehler = { wert: !(g >= 30 && g <= 2500), kuerzel: !kuerzel };
    if (fehler.wert || fehler.kuerzel) return;
    // Tippfehler abfangen: große Sprünge einmal nachfragen
    if (letztes && Math.abs(g - letztes) / letztes > 0.2 && !warnung) {
      warnung = `Das sind ${Math.abs(g - letztes)} g ${g > letztes ? 'mehr' : 'weniger'} als beim letzten Mal (${letztes} g). Stimmt das?`;
      return;
    }
    const name = igel.name;
    const id = igel.id;
    const eintrag = await dataStore.create('gewichte', { igel: id, datum: heute(), gewicht_g: g, kuerzel });
    offen = false;
    igel = null;
    zeigeToast(`${g} g für ${name} gespeichert.`, {
      aktion: { label: 'Rückgängig', fn: () => dataStore.remove('gewichte', eintrag.id) },
    });
  }
</script>

<BottomSheet bind:offen titel={igel ? `Gewicht: ${igel.name}` : ''} onclose={() => (igel = null)}>
  {#if igel}
    <form onsubmit={speichern} novalidate>
      <label class="nur-screenreader" for="gewicht-eingabe">Gewicht in Gramm</label>
      <div class="zahl">
        <input id="gewicht-eingabe" type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="off" data-autofokus
          bind:value={wert} aria-invalid={fehler.wert} placeholder={letztes ? String(letztes) : '0'}
          oninput={() => { wert = wert.replace(/\D/g, '').slice(0, 4); warnung = ''; fehler.wert = false; }} />
        <span>g</span>
      </div>
      {#if letztes}<p class="letztes">Letztes Mal: {letztes} g</p>{/if}
      {#if fehler.wert}<p class="fehler">Bitte ein Gewicht zwischen 30 und 2500 g eingeben.</p>{/if}
      {#if warnung}<p class="warnung" role="alert">{warnung}</p>{/if}
      <KuerzelFrage fehler={fehler.kuerzel} />
      <button class="knopf primaer gross" type="submit">{warnung ? 'Ja, stimmt – speichern' : 'Speichern'}</button>
    </form>
  {/if}
</BottomSheet>

<style>
  .zahl { display: flex; align-items: center; gap: 0.6rem; justify-content: center; margin: 0.5rem 0; }
  .zahl input { font-size: 2.6rem; font-weight: 800; text-align: center; max-width: 11rem; min-height: 80px; letter-spacing: 0.03em; }
  .zahl span { font-size: 2rem; font-weight: 700; }
  .letztes { text-align: center; color: var(--text-2); }
  .warnung { background: var(--gelb-hell); border-left: 5px solid #c9a400; padding: 0.6rem 0.8rem; border-radius: 8px; font-weight: 600; }
  form :global(.kuerzel) { margin-top: 0.5rem; }
</style>
