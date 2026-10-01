<script>
  import { toasts, schliesseToast } from '../lib/toast.svelte.js';
</script>

<div class="toasts" aria-live="polite" aria-atomic="false">
  {#each toasts as t (t.id)}
    <div class="toast {t.art}">
      <span class="text">{t.text}</span>
      {#if t.link}
        <a class="aktion" href={t.link.href} onclick={() => schliesseToast(t.id)}>{t.link.label}</a>
      {/if}
      {#if t.aktion}
        <button class="aktion" onclick={() => { t.aktion.fn(); schliesseToast(t.id); }}>{t.aktion.label}</button>
      {/if}
      <button class="zu" aria-label="Hinweis schließen" onclick={() => schliesseToast(t.id)}>✕</button>
    </div>
  {/each}
</div>

<style>
  .toasts {
    position: fixed; left: 50%; transform: translateX(-50%); bottom: calc(76px + env(safe-area-inset-bottom));
    width: min(560px, calc(100vw - 24px)); z-index: 60; display: flex; flex-direction: column; gap: 0.5rem; pointer-events: none;
  }
  .toast {
    pointer-events: auto; display: flex; align-items: center; gap: 0.5rem;
    background: #1d1d1b; color: #fff; border-radius: var(--radius); padding: 0.4rem 0.4rem 0.4rem 1rem;
    box-shadow: 0 4px 16px rgb(0 0 0 / 0.3); animation: rein 0.2s ease-out;
  }
  .toast.push { background: #0d3b22; border-left: 6px solid #6fd39a; }
  .text { flex: 1; font-size: 0.98rem; }
  .aktion {
    min-height: var(--ziel); padding: 0 0.9rem; border: 2px solid #fff; border-radius: 10px; background: transparent;
    color: #fff; font: inherit; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; text-decoration: none; white-space: nowrap;
  }
  .zu { min-width: 40px; min-height: var(--ziel); background: transparent; border: 0; color: #fff; font-size: 1.1rem; cursor: pointer; }
  @media (min-width: 900px) { .toasts { bottom: 24px; } }
  @keyframes rein { from { transform: translateY(20px); opacity: 0; } }
</style>
