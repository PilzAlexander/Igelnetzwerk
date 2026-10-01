<script>
  // Markiert Texte, die fachlich geprüft werden müssen (abschaltbar auf der Startseite)
  import { einstellungen } from '../lib/einstellungen.svelte.js';
  let { children, block = false } = $props();
</script>

{#if einstellungen.platzhalterZeigen}
  <svelte:element this={block ? 'div' : 'span'} class="ph" class:block title="Platzhalter-Text – fachlich prüfen">
    {@render children()}<span class="marke" aria-hidden="true">Platzhalter</span>
  </svelte:element>
{:else}
  {@render children()}
{/if}

<style>
  .ph { background: rgb(255 229 138 / 0.45); text-decoration: underline dashed #b08f00; text-underline-offset: 3px; }
  .block { display: block; text-decoration: none; outline: 2px dashed #c9a400; outline-offset: 4px; border-radius: 4px; }
  .marke {
    display: inline-block; margin-left: 0.4em; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.02em;
    text-transform: uppercase; color: #5c4a00; background: #ffe58a; border-radius: 4px; padding: 0 4px; vertical-align: 2px;
  }
</style>
