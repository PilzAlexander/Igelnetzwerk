<script>
  // Einfaches Liniendiagramm für den Gewichtsverlauf (eine Linie, kein Zubehör).
  // Antippen/Überfahren zeigt den Wert des nächsten Tages.
  import { datumKurz, datum } from '../lib/zeit.js';
  let { werte = [] } = $props(); // [{ datum, gewicht_g, kuerzel }]

  let breite = $state(320);
  const hoehe = 220;
  const rand = { oben: 26, rechts: 16, unten: 30, links: 48 };
  let auswahl = $state(null);

  // Mehrere Wiegungen am selben Tag: gleichmäßig nebeneinander statt übereinander
  let tage = $derived.by(() => {
    const t = werte.map((w) => new Date(w.datum).getTime());
    return Math.min(...t) === Math.max(...t) ? t.map((_, i) => i) : t;
  });
  let minT = $derived(Math.min(...tage));
  let maxT = $derived(Math.max(...tage));
  let gramm = $derived(werte.map((w) => w.gewicht_g));
  // Achse auf runde 50-g-Schritte, mit etwas Luft
  let minG = $derived(Math.floor((Math.min(...gramm) - 20) / 50) * 50);
  let maxG = $derived(Math.ceil((Math.max(...gramm) + 20) / 50) * 50);
  let schritt = $derived((maxG - minG) / 50 > 6 ? 100 : 50);

  const x = (t) => rand.links + ((t - minT) / Math.max(1, maxT - minT)) * (breite - rand.links - rand.rechts);
  const y = (g) => rand.oben + (1 - (g - minG) / Math.max(1, maxG - minG)) * (hoehe - rand.oben - rand.unten);

  let punkte = $derived(werte.map((w, i) => ({ ...w, px: x(tage[i]), py: y(w.gewicht_g) })));
  let linie = $derived(punkte.map((p, i) => `${i ? 'L' : 'M'}${p.px.toFixed(1)},${p.py.toFixed(1)}`).join(' '));
  let gitter = $derived.by(() => {
    const l = [];
    for (let g = Math.ceil(minG / schritt) * schritt; g <= maxG; g += schritt) l.push(g);
    return l;
  });
  let letzter = $derived(punkte.at(-1));
  let gezeigt = $derived(auswahl ?? letzter);

  function zeiger(e) {
    const r = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - r.left;
    auswahl = punkte.reduce((a, b) => (Math.abs(b.px - mx) < Math.abs(a.px - mx) ? b : a));
  }
</script>

{#if werte.length < 2}
  <p class="leer">Für ein Diagramm braucht es mindestens zwei Wiegungen.</p>
{:else}
  <div class="diagramm" bind:clientWidth={breite}>
    <svg width={breite} height={hoehe} role="img" aria-label="Gewichtsverlauf von {werte[0].gewicht_g} g am {datum(werte[0].datum)} bis {letzter.gewicht_g} g am {datum(letzter.datum)}"
      onpointermove={zeiger} onpointerdown={zeiger} onpointerleave={() => (auswahl = null)}>
      {#each gitter as g}
        <line x1={rand.links} x2={breite - rand.rechts} y1={y(g)} y2={y(g)} class="gitter" />
        <text x={rand.links - 6} y={y(g) + 4} text-anchor="end" class="achse">{g}</text>
      {/each}
      <text x={rand.links - 6} y={rand.oben - 12} text-anchor="end" class="achse">Gramm</text>
      <text x={rand.links} y={hoehe - 8} class="achse">{datumKurz(werte[0].datum)}</text>
      <text x={breite - rand.rechts} y={hoehe - 8} text-anchor="end" class="achse">{datumKurz(letzter.datum)}</text>

      <path d={linie} class="linie" />
      {#each punkte as p}
        <circle cx={p.px} cy={p.py} r="4" class="punkt" />
      {/each}

      {#if gezeigt}
        <line x1={gezeigt.px} x2={gezeigt.px} y1={rand.oben} y2={hoehe - rand.unten} class="fadenkreuz" />
        <circle cx={gezeigt.px} cy={gezeigt.py} r="7" class="punkt aktiv" />
        {@const links = gezeigt.px > breite - 110}
        <g transform="translate({links ? gezeigt.px - 10 : gezeigt.px + 10}, {Math.max(rand.oben + 4, gezeigt.py - 34)})">
          <rect x={links ? -96 : 0} y="0" width="96" height="40" rx="6" class="tipp" />
          <text x={links ? -88 : 8} y="17" class="tipp-wert">{gezeigt.gewicht_g} g</text>
          <text x={links ? -88 : 8} y="33" class="tipp-datum">{datumKurz(gezeigt.datum)}{gezeigt.kuerzel ? ` · ${gezeigt.kuerzel}` : ''}</text>
        </g>
      {/if}
    </svg>
  </div>
{/if}

<style>
  .diagramm { width: 100%; touch-action: pan-y; }
  svg { display: block; overflow: visible; }
  .gitter { stroke: #dedbd3; stroke-width: 1; }
  .achse { font-size: 12px; fill: var(--text-2); }
  .linie { fill: none; stroke: var(--gruen); stroke-width: 2.5; stroke-linejoin: round; stroke-linecap: round; }
  .punkt { fill: var(--gruen); stroke: #fff; stroke-width: 2; }
  .punkt.aktiv { fill: var(--gruen); stroke: #fff; stroke-width: 3; }
  .fadenkreuz { stroke: var(--rand); stroke-width: 1; stroke-dasharray: 3 3; }
  .tipp { fill: #1d1d1b; }
  .tipp-wert { fill: #fff; font-weight: 700; font-size: 14px; }
  .tipp-datum { fill: #ddd; font-size: 12px; }
  .leer { color: var(--text-2); }
</style>
