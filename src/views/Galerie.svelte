<script>
  import { liveTabelle } from '../lib/live.svelte.js';
  import { gewichteVon, trend } from '../lib/gewicht.js';
  import Trend from '../components/Trend.svelte';
  import GewichtSheet from '../components/GewichtSheet.svelte';

  const igel = liveTabelle('pflegeigel');
  const gewichte = liveTabelle('gewichte');
  let alleZeigen = $state(false);
  let wiegeIgel = $state(null);

  let liste = $derived(
    igel.zeilen
      .filter((i) => alleZeigen || i.status === 'in_pflege')
      .map((i) => ({ ...i, trend: trend(gewichteVon(i.id, gewichte.zeilen)) }))
      .sort((a, b) => (b.status === 'in_pflege') - (a.status === 'in_pflege') || a.name.localeCompare(b.name, 'de')),
  );
  let abgegeben = $derived(igel.zeilen.filter((i) => i.status !== 'in_pflege').length);
  let wiegeLetztes = $derived(wiegeIgel ? trend(gewichteVon(wiegeIgel.id, gewichte.zeilen))?.gewicht : null);
</script>

<main class="seite weit">
  <div class="kopf">
    <h1>Pflegeigel <span class="zahl">{igel.zeilen.filter((i) => i.status === 'in_pflege').length} in Pflege</span></h1>
    {#if abgegeben}
      <label class="schalter">
        <input type="checkbox" bind:checked={alleZeigen} />
        Auch ausgewilderte und weitervermittelte zeigen ({abgegeben})
      </label>
    {/if}
  </div>

  {#if igel.geladen && liste.length === 0}
    <div class="leer">
      <strong>Gerade ist kein Igel in Pflege.</strong>
      Neue Pflegeigel legst du im Board an: Fall auf „In Pflege“ schieben, dann „Als Pflegeigel anlegen“.
      <p style="margin: 0.8rem 0 0"><a class="knopf" href="#/board">Zu den Fällen</a></p>
    </div>
  {/if}

  <ul class="raster">
    {#each liste as i (i.id)}
      <li class="kachel" class:abgegeben={i.status !== 'in_pflege'}>
        <a class="oeffnen" href="#/igel/{i.id}">
          {#if i.foto}
            <img src={i.foto} alt="" loading="lazy" />
          {:else}
            <span class="ohne-foto" aria-hidden="true">🦔</span>
          {/if}
          <span class="name">{i.name}</span>
          <span class="werte"><Trend t={i.trend} /></span>
          {#if i.status !== 'in_pflege'}<span class="tag">{i.status === 'ausgewildert' ? 'Ausgewildert' : 'Weitervermittelt'}</span>{/if}
        </a>
        {#if i.status === 'in_pflege'}
          <button class="knopf primaer wiegen" onclick={() => (wiegeIgel = i)} aria-label="Gewicht für {i.name} eintragen">⚖️ Gewicht</button>
        {/if}
      </li>
    {/each}
  </ul>
</main>

<GewichtSheet bind:igel={wiegeIgel} letztes={wiegeLetztes} />

<style>
  .seite.weit { max-width: 1200px; }
  .kopf { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 0.5rem 1rem; margin-bottom: 1rem; }
  h1 { margin: 0; }
  .zahl { font-size: 1rem; font-weight: 600; color: var(--text-2); margin-left: 0.3rem; }
  .schalter { display: flex; align-items: center; gap: 0.6rem; min-height: var(--ziel); cursor: pointer; }
  .schalter input { width: 24px; height: 24px; accent-color: var(--gruen); flex: none; }
  .raster { list-style: none; padding: 0; margin: 0; display: grid; gap: 12px; grid-template-columns: repeat(auto-fill, minmax(155px, 1fr)); }
  .kachel { background: #fff; border-radius: var(--radius); box-shadow: var(--schatten); overflow: hidden; display: flex; flex-direction: column; }
  .kachel.abgegeben { opacity: 0.8; }
  .oeffnen { display: flex; flex-direction: column; gap: 0.2rem; color: inherit; text-decoration: none; padding-bottom: 0.4rem; flex: 1; }
  .oeffnen img, .ohne-foto { width: 100%; aspect-ratio: 1; object-fit: cover; background: #eee; }
  .ohne-foto { display: grid; place-items: center; font-size: 3rem; }
  .name { font-weight: 800; font-size: 1.15rem; padding: 0.3rem 0.7rem 0; }
  .werte { padding: 0 0.7rem; }
  .tag { margin: 0.2rem 0.7rem 0; align-self: flex-start; }
  .wiegen { margin: 0 0.6rem 0.6rem; }
</style>
