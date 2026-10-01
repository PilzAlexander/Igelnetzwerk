<script>
  // Was die Automatik getan hätte: Push-Nachrichten und abgewiesene Meldungen
  import { dataStore } from '../data/dataStore.js';
  import { liveTabelle } from '../lib/live.svelte.js';
  import { zeigeToast } from '../lib/toast.svelte.js';
  import { datumZeit, seit } from '../lib/zeit.js';
  import pushConfig from '../../config/push.json';

  const push = liveTabelle('push_protokoll');
  const abweisungen = liveTabelle('abweisungen');
  let pushListe = $derived([...push.zeilen].sort((a, b) => b.zeitpunkt.localeCompare(a.zeitpunkt)));
  let abListe = $derived([...abweisungen.zeilen].sort((a, b) => b.zeitpunkt.localeCompare(a.zeitpunkt)));

  async function zuruecksetzen() {
    if (!confirm('Alle Testdaten zurücksetzen? Eigene Eingaben gehen verloren.')) return;
    await dataStore.reset();
    zeigeToast('Testdaten wurden neu geladen.');
  }
</script>

<main class="seite">
  <h1>Protokoll</h1>
  <p class="hinweis">
    Im Prototyp wird nichts wirklich verschickt. Hier steht, was die Automatik gemacht <em>hätte</em>.
  </p>

  <section class="box">
    <h2>📲 Diese Push-Nachrichten wären ans {pushConfig.empfaenger} rausgegangen</h2>
    {#if pushListe.length === 0}
      <p class="leer">Noch keine Push-Nachrichten. Sobald jemand das Formular abschickt, erscheint hier ein Eintrag.</p>
    {/if}
    <ul class="liste">
      {#each pushListe as p}
        <li class:dringend={p.nachricht.includes('DRINGEND')}>
          <span class="zeit">{datumZeit(p.zeitpunkt)} · {seit(p.zeitpunkt)}</span>
          <span>{p.nachricht}</span>
        </li>
      {/each}
    </ul>
  </section>

  <section class="box">
    <h2>🚫 Abgewiesene Meldungen (PLZ außerhalb)</h2>
    <p class="hinweis">Nur Postleitzahl und Zeit – keine Telefonnummer gespeichert.</p>
    {#if abListe.length === 0}<p class="leer">Keine abgewiesenen Meldungen.</p>{/if}
    <ul class="liste">
      {#each abListe as a}
        <li><span class="zeit">{datumZeit(a.zeitpunkt)}</span><span>PLZ {a.plz}</span></li>
      {/each}
    </ul>
  </section>

  <button class="knopf leise breit" onclick={zuruecksetzen}>Testdaten zurücksetzen</button>
</main>

<style>
  section.box { margin-bottom: 1rem; }
  h2 { font-size: 1.1rem; }
  .hinweis { color: var(--text-2); }
  .liste { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.5rem; }
  .liste li { display: grid; gap: 0.15rem; padding: 0.6rem 0.8rem; border-radius: 8px; background: #f4f3ef; border-left: 5px solid var(--gruen); }
  .liste li.dringend { background: var(--rot-hell); border-left-color: var(--rot); }
  .zeit { font-size: 0.88rem; color: var(--text-2); }
  .leer { text-align: left; padding: 0.8rem; }
</style>
