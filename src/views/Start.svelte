<script>
  import { dataStore } from '../data/dataStore.js';
  import { einstellungen, setzePlatzhalterZeigen } from '../lib/einstellungen.svelte.js';
  import { zeigeToast } from '../lib/toast.svelte.js';

  async function zuruecksetzen() {
    if (!confirm('Alle Testdaten zurücksetzen? Eigene Eingaben gehen verloren.')) return;
    await dataStore.reset();
    zeigeToast('Testdaten wurden neu geladen.');
  }
</script>

<main class="seite">
  <div class="logo" aria-hidden="true">🦔</div>
  <h1>Igel-Leitstelle</h1>
  <p class="unter">Prototyp zum Ausprobieren · Region 10 (IN, EI, ND, PAF)</p>

  <div class="wahl">
    <a class="kachel" href="#/melden">
      <strong>Igel gefunden?</strong>
      <span>Öffentliches Formular für Finder*innen</span>
    </a>
    <a class="kachel" href="#/board">
      <strong>Leitstelle</strong>
      <span>Für Helfer*innen: Fälle und Pflegeigel</span>
    </a>
  </div>

  <section class="box test">
    <h2>Für die Testleitung</h2>
    <label class="schalter">
      <input type="checkbox" checked={einstellungen.platzhalterZeigen} onchange={(e) => setzePlatzhalterZeigen(e.currentTarget.checked)} />
      <span>Platzhalter-Texte gelb markieren (für Tests mit Helfer*innen ausschalten)</span>
    </label>
    <button class="knopf leise breit" onclick={zuruecksetzen}>Testdaten zurücksetzen</button>
    <p class="hinweis">Alle Daten liegen nur in diesem Browser. Tipp: Formular und Leitstelle in zwei Tabs öffnen – neue Meldungen erscheinen sofort im Board.</p>
  </section>
</main>

<style>
  .logo { font-size: 3rem; margin-top: 1.5rem; }
  .unter { color: var(--text-2); }
  .wahl { display: grid; gap: 1rem; margin: 1.5rem 0; }
  .kachel {
    display: flex; flex-direction: column; gap: 0.3rem; padding: 1.3rem 1.2rem; border-radius: var(--radius);
    background: var(--gruen); color: #fff; text-decoration: none; box-shadow: var(--schatten);
  }
  .kachel:nth-child(2) { background: #fff; color: var(--text); border: 2px solid var(--gruen); }
  .kachel strong { font-size: 1.35rem; }
  .test h2 { font-size: 1.05rem; }
  .schalter { display: flex; gap: 0.75rem; align-items: flex-start; margin-bottom: 1rem; cursor: pointer; }
  .schalter input { width: 26px; height: 26px; flex: none; accent-color: var(--gruen); }
  .hinweis { color: var(--text-2); font-size: 0.95rem; margin: 0.8rem 0 0; }
</style>
