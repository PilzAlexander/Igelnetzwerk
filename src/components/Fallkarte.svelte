<script>
  import { LABELS } from '../data/schema.js';
  import { seit } from '../lib/zeit.js';
  import LandkreisTag from './LandkreisTag.svelte';

  let { fall, jetzt, ziehbar = false, onoeffnen, ondragstart, ondragend } = $props();
  let merkmale = $derived((fall.merkmale ?? []).filter((m) => m !== 'sonstiges'));
</script>

<article
  class="karte"
  class:dringend={fall.dringend}
  style="--lk: var(--lk-{fall.landkreis})"
  draggable={ziehbar}
  {ondragstart}
  {ondragend}
>
  <button class="haupt" onclick={() => onoeffnen(fall)} aria-label="Fall {fall.id} öffnen: {fall.plz} {fall.ort}{fall.dringend ? ', dringend' : ''}">
    {#if fall.foto}
      <img class="foto" src={fall.foto} alt="" loading="lazy" />
    {:else}
      <span class="foto ohne" aria-hidden="true">kein<br />Foto</span>
    {/if}
    <span class="text">
      {#if fall.dringend}<span class="tag dringend">⚠ DRINGEND</span>{/if}
      <span class="ort"><LandkreisTag kreis={fall.landkreis} /> {fall.plz} {fall.ort}</span>
      <span class="zeit">{seit(fall.gemeldet_am, jetzt)} · Fall {fall.id}</span>
      {#if fall.status === 'abgeschlossen' && fall.abschluss_art}
        <span class="abschluss">✓ {LABELS.abschluss_art[fall.abschluss_art]}</span>
      {/if}
    </span>
  </button>
  {#if merkmale.length || fall.merkmale_freitext}
    <div class="tags">
      {#each merkmale as m}<span class="tag">{LABELS.merkmale[m]}</span>{/each}
      {#if fall.merkmale_freitext}<span class="tag frei">„{fall.merkmale_freitext}“</span>{/if}
    </div>
  {/if}
  <div class="aktionen">
    <a class="knopf" href="tel:{fall.telefon.replace(/[^\d+]/g, '')}" aria-label="Finder*in anrufen: {fall.telefon}">📞 Anrufen</a>
    <button class="knopf" onclick={() => onoeffnen(fall)}>Verschieben ➜</button>
  </div>
</article>

<style>
  .karte {
    background: #fff; border-radius: var(--radius); box-shadow: var(--schatten);
    border: 1px solid var(--rand-hell); border-left: 8px solid var(--lk); overflow: hidden; min-width: 0;
  }
  .karte[draggable='true'] { cursor: grab; }
  .karte.dringend { border: 3px solid var(--rot); border-left: 8px solid var(--lk); background: var(--rot-hell); }
  .haupt {
    display: flex; gap: 0.75rem; width: 100%; padding: 0.7rem 0.7rem 0.4rem; background: none; border: 0;
    text-align: left; font: inherit; color: inherit; cursor: pointer;
  }
  .foto { width: 60px; height: 60px; border-radius: 10px; object-fit: cover; flex: none; background: #eee; }
  .foto.ohne { display: grid; place-items: center; text-align: center; font-size: 0.75rem; color: var(--text-2); border: 2px dashed var(--rand-hell); line-height: 1.2; }
  .text { display: flex; flex-direction: column; align-items: flex-start; gap: 0.25rem; min-width: 0; overflow-wrap: break-word; hyphens: auto; }
  .ort { font-weight: 700; font-size: 1.05rem; display: flex; flex-wrap: wrap; align-items: center; gap: 0.35rem; }
  .zeit { color: var(--text-2); font-size: 0.92rem; }
  .abschluss { font-weight: 600; color: var(--gruen-dunkel); font-size: 0.92rem; }
  .tags { display: flex; flex-wrap: wrap; gap: 0.3rem; padding: 0 0.7rem 0.5rem; }
  .tag.frei { font-weight: 400; font-style: italic; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .aktionen { display: flex; flex-wrap: wrap; gap: 0.4rem; padding: 0 0.7rem 0.7rem; }
  .aktionen .knopf { flex: 1 1 auto; padding: 0.4em 0.6em; font-size: 0.95rem; white-space: nowrap; }
  .dringend .aktionen .knopf { background: #fff; }
</style>
