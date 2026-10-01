<script>
  // Gewicht + Trend-Pfeil, nie nur über Farbe (Pfeil + Zahl + Text für Screenreader)
  let { t, gross = false } = $props();
  const PFEIL = { hoch: '↑', runter: '↓', gleich: '→' };
  const TEXT = { hoch: 'nimmt zu', runter: 'nimmt ab', gleich: 'gleich geblieben' };
</script>

{#if t}
  <span class="trend {t.richtung}" class:gross>
    <strong>{t.gewicht} g</strong>
    <span class="pfeil" aria-hidden="true">{PFEIL[t.richtung]}</span>
    <span class="diff">{t.diff > 0 ? '+' : ''}{t.diff} g</span>
    <span class="nur-screenreader">{TEXT[t.richtung]}</span>
  </span>
{:else}
  <span class="trend leer">noch nicht gewogen</span>
{/if}

<style>
  .trend { display: inline-flex; align-items: baseline; gap: 0.3rem; flex-wrap: wrap; }
  .trend strong { font-size: 1.1rem; }
  .gross strong { font-size: 1.6rem; }
  .pfeil { font-weight: 900; font-size: 1.15rem; }
  .diff { font-size: 0.9rem; font-weight: 600; }
  .hoch .pfeil, .hoch .diff { color: #1a6b35; }
  .runter .pfeil, .runter .diff { color: var(--rot); }
  .gleich .pfeil, .gleich .diff { color: var(--text-2); }
  .leer { color: var(--text-2); font-size: 0.95rem; }
</style>
