<script>
  import { route } from './lib/router.svelte.js';
  import Toasts from './components/Toasts.svelte';
  import Nav from './components/Nav.svelte';
  import PushMelder from './components/PushMelder.svelte';
  import Start from './views/Start.svelte';
  import Fundmeldung from './views/Fundmeldung.svelte';
  import Board from './views/Board.svelte';
  import Galerie from './views/Galerie.svelte';
  import IgelDetail from './views/IgelDetail.svelte';
  import Protokoll from './views/Protokoll.svelte';

  let bereich = $derived(route.pfad[0] ?? '');
  let intern = $derived(['board', 'igel', 'protokoll'].includes(bereich));
</script>

{#if bereich === 'melden'}
  <Fundmeldung />
{:else if intern}
  <Nav aktiv={bereich} />
  <PushMelder />
  {#if bereich === 'board'}
    <Board />
  {:else if bereich === 'igel' && route.pfad[1]}
    {#key route.pfad[1]}<IgelDetail id={Number(route.pfad[1])} />{/key}
  {:else if bereich === 'igel'}
    <Galerie />
  {:else}
    <Protokoll />
  {/if}
{:else}
  <Start />
{/if}

<Toasts />
