<script>
  import { liveTabelle } from '../lib/live.svelte.js';
  import { einstellungen } from '../lib/einstellungen.svelte.js';
  let { aktiv } = $props();
  const faelle = liveTabelle('fundmeldungen');
  let neu = $derived(faelle.zeilen.filter((f) => f.status === 'neu').length);

  const PUNKTE = [
    { id: 'board', label: 'Fälle', icon: '🗂️' },
    { id: 'igel', label: 'Pflegeigel', icon: '🦔' },
    { id: 'protokoll', label: 'Protokoll', icon: '📲' },
  ];
</script>

<header class="leiste">
  <a class="titel" href="#/">Igel-Leitstelle</a>
  <span class="ich">{einstellungen.kuerzel ? `Du: ${einstellungen.kuerzel}` : ''}</span>
</header>

<nav class="nav" aria-label="Hauptbereiche">
  {#each PUNKTE as p}
    <a href="#/{p.id}" class:aktiv={aktiv === p.id} aria-current={aktiv === p.id ? 'page' : undefined}>
      <span class="icon" aria-hidden="true">{p.icon}</span>
      <span>{p.label}</span>
      {#if p.id === 'board' && neu > 0}<span class="zahl" aria-label="{neu} neue">{neu}</span>{/if}
    </a>
  {/each}
</nav>

<style>
  .leiste {
    position: sticky; top: 0; z-index: 30; background: var(--gruen); color: #fff;
    display: flex; align-items: center; justify-content: space-between; padding: 0 16px; min-height: 52px;
  }
  .titel { color: #fff; font-weight: 800; font-size: 1.1rem; text-decoration: none; }
  .ich { font-weight: 600; opacity: 0.9; }
  .nav {
    position: fixed; bottom: 0; left: 0; right: 0; z-index: 40; display: grid; grid-template-columns: repeat(3, 1fr);
    background: #fff; border-top: 2px solid var(--rand-hell); padding-bottom: env(safe-area-inset-bottom);
  }
  .nav a {
    position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px;
    min-height: 64px; color: var(--text-2); text-decoration: none; font-weight: 600; font-size: 0.9rem;
  }
  .nav a.aktiv { color: var(--gruen-dunkel); background: var(--gruen-hell); box-shadow: inset 0 4px 0 var(--gruen); }
  .icon { font-size: 1.4rem; line-height: 1; }
  .zahl {
    position: absolute; top: 6px; left: calc(50% + 10px); background: var(--rot); color: #fff;
    font-size: 0.8rem; font-weight: 700; min-width: 22px; height: 22px; border-radius: 11px; display: grid; place-items: center; padding: 0 5px;
  }
  @media (min-width: 900px) {
    .nav { position: sticky; top: 52px; bottom: auto; display: flex; justify-content: center; gap: 0.5rem; border-top: 0; border-bottom: 2px solid var(--rand-hell); z-index: 29; }
    .nav a { flex-direction: row; min-height: 52px; padding: 0 1.2rem; font-size: 1rem; gap: 0.5rem; }
    .nav a.aktiv { box-shadow: inset 0 -4px 0 var(--gruen); }
    .zahl { position: static; }
  }
</style>
