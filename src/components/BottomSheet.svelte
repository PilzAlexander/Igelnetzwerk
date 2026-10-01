<script>
  // Fenster, das von unten hereinfährt (am Desktop mittig). Schließen: X, Hintergrund, Esc.
  import { tick } from 'svelte';
  let { offen = $bindable(false), titel, children, onclose = () => {} } = $props();
  let dialog = $state();
  let vorherFokus = null;

  $effect(() => {
    if (offen) {
      vorherFokus = document.activeElement;
      document.body.style.overflow = 'hidden';
      // Erstes Eingabefeld fokussieren (öffnet am Handy direkt die Tastatur)
      tick().then(() =>
        requestAnimationFrame(() => {
          const ziel = dialog?.querySelector('[data-autofokus]') ?? dialog;
          ziel?.focus({ preventScroll: true });
        }),
      );
      return () => {
        document.body.style.overflow = '';
        vorherFokus?.focus?.();
      };
    }
  });

  function schliessen() {
    offen = false;
    onclose();
  }
  function taste(e) {
    if (e.key === 'Escape') schliessen();
  }
</script>

{#if offen}
  <!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events -->
  <div class="hintergrund" onclick={schliessen}></div>
  <div class="sheet" role="dialog" aria-modal="true" aria-label={titel} tabindex="-1" bind:this={dialog} onkeydown={taste}>
    <div class="griff" aria-hidden="true"></div>
    <header>
      <h2>{titel}</h2>
      <button class="zu" onclick={schliessen} aria-label="Schließen">✕</button>
    </header>
    <div class="inhalt">{@render children()}</div>
  </div>
{/if}

<style>
  .hintergrund { position: fixed; inset: 0; background: rgb(0 0 0 / 0.45); z-index: 50; animation: ein 0.15s; }
  .sheet {
    position: fixed; left: 0; right: 0; bottom: 0; z-index: 51;
    max-height: 92dvh; overflow-y: auto; overscroll-behavior: contain;
    background: #fff; border-radius: 18px 18px 0 0; box-shadow: 0 -4px 24px rgb(0 0 0 / 0.25);
    padding: 0.4rem 16px calc(1.2rem + env(safe-area-inset-bottom));
    animation: hoch 0.2s ease-out; outline: none;
  }
  .griff { width: 44px; height: 5px; border-radius: 3px; background: var(--rand-hell); margin: 0.2rem auto 0.4rem; }
  header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; position: sticky; top: -0.4rem; background: #fff; padding: 0.4rem 0; z-index: 1; }
  header h2 { margin: 0; font-size: 1.2rem; }
  .zu { min-width: var(--ziel); min-height: var(--ziel); border: 0; background: #f1f0ec; border-radius: 50%; font-size: 1.2rem; cursor: pointer; color: var(--text); }
  @media (min-width: 700px) {
    .sheet { left: 50%; right: auto; bottom: auto; top: 50%; transform: translate(-50%, -50%); width: min(520px, 94vw); border-radius: 18px; animation: ein 0.15s; }
    .griff { display: none; }
  }
  @keyframes hoch { from { transform: translateY(40%); opacity: 0.5; } }
  @keyframes ein { from { opacity: 0; } }
</style>
