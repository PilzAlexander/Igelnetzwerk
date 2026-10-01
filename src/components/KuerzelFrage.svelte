<script module>
  // Fragt einmalig nach dem Kürzel der Helfer*in (wird im Gerät gespeichert)
  import { einstellungen, setzeKuerzel } from '../lib/einstellungen.svelte.js';

  // Liest das Kürzel – auch wenn das Feld gerade noch Fokus hat
  export function aktuellesKuerzel() {
    const feld = document.getElementById('kuerzel');
    if (feld?.value.trim()) setzeKuerzel(feld.value);
    return einstellungen.kuerzel;
  }
</script>

<script>
  let { fehler = false } = $props();
  let eingabe = $state('');
</script>

{#if !einstellungen.kuerzel}
  <div class="feld kuerzel">
    <label for="kuerzel">Dein Kürzel <span class="pflicht">einmalig</span></label>
    <input id="kuerzel" type="text" maxlength="4" autocomplete="off" autocapitalize="characters" placeholder="z. B. AP"
      bind:value={eingabe} aria-invalid={fehler} />
    {#if fehler}<p class="fehler">Bitte dein Kürzel eintragen.</p>{/if}
    <p class="hilfe">Damit alle sehen, wer etwas eingetragen hat. Wird auf diesem Handy gespeichert.</p>
  </div>
{/if}

<style>
  .kuerzel { background: var(--gelb-hell); padding: 0.8rem; border-radius: var(--radius); }
  .kuerzel input { max-width: 8rem; text-transform: uppercase; }
</style>
