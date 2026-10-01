<script>
  import { tick } from 'svelte';
  import { LABELS } from '../data/schema.js';
  import { pruefePlz } from '../rules/index.js';
  import { regelConfig, andereStationen } from '../rules/config.js';
  import { meldungEingang } from '../rules/ablauf.js';
  import { verkleinereFoto } from '../lib/bild.js';
  import { TEXTE } from '../texte.js';
  import Ph from '../components/Ph.svelte';

  const MERKMALE = Object.entries(LABELS.merkmale);

  let plz = $state('');
  let fundort = $state('');
  let standort = $state(null); // { lat, lng, genauigkeit }
  let standortStatus = $state(''); // '', 'suche', 'fehler'
  let gewicht = $state('');
  let foto = $state(null);
  let fotoStatus = $state('');
  let merkmale = $state([]);
  let freitext = $state('');
  let telefon = $state('');
  let einwilligung = $state(false);

  let fehler = $state({});
  let gesendet = $state(false);
  let sendet = $state(false);
  let ergebnis = $state(null); // { aktion: 'anlegen'|'abweisen', ... }

  // Sofortige Rückmeldung zur PLZ, sobald 5 Ziffern da sind
  let plzPruefung = $derived(/^\d{5}$/.test(plz.trim()) ? pruefePlz(plz, regelConfig.plz) : null);

  function merkmalUmschalten(key) {
    merkmale = merkmale.includes(key) ? merkmale.filter((m) => m !== key) : [...merkmale, key];
  }

  function standortHolen() {
    if (!navigator.geolocation) {
      standortStatus = 'fehler';
      return;
    }
    standortStatus = 'suche';
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        standort = { lat: +pos.coords.latitude.toFixed(6), lng: +pos.coords.longitude.toFixed(6), genauigkeit: Math.round(pos.coords.accuracy) };
        standortStatus = '';
      },
      () => (standortStatus = 'fehler'),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  async function fotoGewaehlt(e) {
    const datei = e.currentTarget.files?.[0];
    if (!datei) return;
    fotoStatus = 'laedt';
    try {
      foto = await verkleinereFoto(datei);
      fotoStatus = '';
    } catch {
      fotoStatus = 'fehler';
    }
    e.currentTarget.value = '';
  }

  function pruefen() {
    const f = {};
    if (!/^\d{5}$/.test(plz.trim())) f.plz = 'Bitte die 5-stellige Postleitzahl eingeben.';
    if ((telefon.match(/\d/g) ?? []).length < 6) f.telefon = 'Bitte eine Telefonnummer eingeben, unter der wir Sie erreichen.';
    if (!einwilligung) f.einwilligung = 'Bitte kurz zustimmen – sonst dürfen wir Sie nicht zurückrufen.';
    if (gewicht && !(Number(gewicht) > 0 && Number(gewicht) < 3000)) f.gewicht = 'Bitte das Gewicht in Gramm eingeben, z. B. 450.';
    return f;
  }

  async function absenden(e) {
    e.preventDefault();
    fehler = pruefen();
    if (Object.keys(fehler).length) {
      await tick();
      document.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }
    sendet = true;
    try {
      ergebnis = await meldungEingang({
        plz: plz.trim(),
        fundort: fundort.trim(),
        standort_lat: standort?.lat ?? null,
        standort_lng: standort?.lng ?? null,
        gewicht_g: gewicht ? Math.round(Number(gewicht)) : null,
        foto,
        merkmale: $state.snapshot(merkmale),
        merkmale_freitext: merkmale.includes('sonstiges') ? freitext.trim() : '',
        telefon: telefon.trim(),
        einwilligung_datenschutz: einwilligung,
      });
      gesendet = true;
      window.scrollTo(0, 0);
    } catch (err) {
      fehler = { senden: err.message };
    } finally {
      sendet = false;
    }
  }

  function neueMeldung() {
    plz = fundort = gewicht = freitext = telefon = '';
    standort = foto = null;
    merkmale = [];
    einwilligung = false;
    fehler = {};
    gesendet = false;
    ergebnis = null;
    window.scrollTo(0, 0);
  }

  function plzAendern() {
    gesendet = false;
    ergebnis = null;
    tick().then(() => document.getElementById('plz')?.focus());
  }
</script>

<div class="kopf">
  <div class="kopf-innen">
    <span class="logo" aria-hidden="true">🦔</span>
    <span>Igelstation Region 10</span>
  </div>
</div>

<main class="seite">
  {#if gesendet && ergebnis?.aktion === 'anlegen'}
    <!-- Bestätigung -->
    <section class="danke" aria-labelledby="danke-titel">
      <div class="haken-gross" aria-hidden="true">✓</div>
      <h1 id="danke-titel" tabindex="-1">Danke! Ihre Meldung ist angekommen.</h1>
      {#if ergebnis.datensatz.dringend}
        <p class="dringend-box"><strong>Dringend:</strong> <Ph>{TEXTE.dringendHinweis}</Ph></p>
      {/if}
      <h2>Was passiert jetzt?</h2>
      <Ph block>
        {#each TEXTE.wasPassiertJetzt as satz}<p>{satz}</p>{/each}
      </Ph>
    </section>

    <section class="tipps" aria-labelledby="tipps-titel">
      <h2 id="tipps-titel">Bis wir anrufen: Das können Sie sofort tun</h2>
      <Ph block>
        <ol>
          {#each TEXTE.sofortTipps as tipp}
            <li><strong>{tipp.titel}</strong> {tipp.text}</li>
          {/each}
        </ol>
        {#if ergebnis.datensatz.merkmale.includes('maden_fliegeneier')}
          <p class="hinweis-maden">{TEXTE.maden}</p>
        {/if}
      </Ph>
    </section>

    <button class="knopf gross" onclick={neueMeldung}>Noch einen Igel melden</button>
  {:else if gesendet && ergebnis?.aktion === 'abweisen'}
    <!-- Abweisung: PLZ außerhalb -->
    <section aria-labelledby="ab-titel">
      <h1 id="ab-titel">Hier sind wir leider nicht zuständig</h1>
      <p><Ph>{TEXTE.abweisung}</Ph></p>
      <ul class="stationen">
        {#each andereStationen.stationen as s}
          <li class="box">
            <strong>{s.name}</strong>
            <span class="gebiet">{s.gebiet}</span>
            <a class="knopf breit" href="tel:{s.telefon.replace(/\s/g, '')}">📞 {s.telefon} anrufen</a>
          </li>
        {/each}
      </ul>
      <p class="klein"><Ph>{andereStationen.allgemeiner_hinweis}</Ph></p>
      <section class="tipps">
        <h2>Bis dahin: Das können Sie sofort tun</h2>
        <Ph block>
          <ol>
            {#each TEXTE.sofortTipps as tipp}<li><strong>{tipp.titel}</strong> {tipp.text}</li>{/each}
          </ol>
        </Ph>
      </section>
      <button class="knopf gross" onclick={plzAendern}>Postleitzahl korrigieren</button>
    </section>
  {:else}
    <!-- Formular -->
    <h1>Igel gefunden?</h1>
    <p class="intro"><Ph>{TEXTE.formularIntro}</Ph></p>

    <form onsubmit={absenden} novalidate>
      <!-- PLZ -->
      <div class="feld">
        <label for="plz">Postleitzahl des Fundorts <span class="pflicht">Pflicht</span></label>
        <input
          id="plz" type="text" inputmode="numeric" autocomplete="postal-code" maxlength="5" placeholder="z. B. 85049"
          bind:value={plz} aria-invalid={!!fehler.plz} aria-describedby="plz-info"
          oninput={() => { plz = plz.replace(/\D/g, ''); fehler.plz = undefined; }}
        />
        <div id="plz-info">
          {#if fehler.plz}<p class="fehler">{fehler.plz}</p>{/if}
          {#if plzPruefung?.ok}
            <p class="plz-ok">✓ {plzPruefung.ort}</p>
          {:else if plzPruefung && !plzPruefung.ok}
            <p class="plz-aussen">
              Diese Postleitzahl liegt außerhalb unseres Gebiets. Sie können trotzdem absenden – wir zeigen Ihnen dann Stationen in Ihrer Nähe.
            </p>
          {/if}
        </div>
      </div>

      <!-- Fundort -->
      <div class="feld">
        <label for="fundort">Wo genau? <span class="freiwillig">(freiwillig)</span></label>
        <textarea id="fundort" bind:value={fundort} placeholder="z. B. Garten hinterm Haus, Musterstraße 5" rows="2"></textarea>
        {#if standort}
          <p class="standort-ok">
            📍 Standort gespeichert (auf ca. {standort.genauigkeit} m genau)
            <button type="button" class="link" onclick={() => (standort = null)}>entfernen</button>
          </p>
        {:else}
          <button type="button" class="knopf breit" onclick={standortHolen} disabled={standortStatus === 'suche'}>
            📍 {standortStatus === 'suche' ? 'Standort wird gesucht …' : 'Meinen Standort verwenden'}
          </button>
          {#if standortStatus === 'fehler'}
            <p class="fehler">Standort ging leider nicht. Kein Problem – beschreiben Sie den Ort einfach oben.</p>
          {/if}
        {/if}
      </div>

      <!-- Merkmale -->
      <fieldset>
        <legend>Was ist auffällig? <span class="freiwillig">(freiwillig, mehrere möglich)</span></legend>
        <div class="chips" style="margin-top: 0.5rem">
          {#each MERKMALE as [key, label]}
            <button type="button" class="chip" aria-pressed={merkmale.includes(key)} onclick={() => merkmalUmschalten(key)}>
              <span class="haken" aria-hidden="true">{merkmale.includes(key) ? '✓' : '+'}</span>{label}
            </button>
          {/each}
        </div>
        {#if merkmale.includes('sonstiges')}
          <div class="feld" style="margin-top: 0.8rem; margin-bottom: 0">
            <label for="freitext">Was noch?</label>
            <textarea id="freitext" bind:value={freitext} rows="2" placeholder="Beschreiben Sie kurz, was Ihnen auffällt"></textarea>
          </div>
        {/if}
      </fieldset>

      <!-- Foto -->
      <div class="feld">
        <span class="label" id="foto-label">Foto vom Igel <span class="freiwillig">(freiwillig)</span></span>
        {#if foto}
          <img class="vorschau" src={foto} alt="Ihr Foto vom Igel" />
          <div class="zwei">
            <label class="knopf">
              Anderes Foto
              <input class="nur-screenreader" type="file" accept="image/*" capture="environment" onchange={fotoGewaehlt} />
            </label>
            <button type="button" class="knopf leise" onclick={() => (foto = null)}>Foto entfernen</button>
          </div>
        {:else}
          <label class="knopf breit foto-knopf" aria-describedby="foto-label">
            📷 {fotoStatus === 'laedt' ? 'Foto wird geladen …' : 'Foto machen'}
            <input class="nur-screenreader" type="file" accept="image/*" capture="environment" onchange={fotoGewaehlt} />
          </label>
          {#if fotoStatus === 'fehler'}<p class="fehler">Das Foto ging leider nicht. Versuchen Sie es nochmal oder lassen Sie es weg.</p>{/if}
        {/if}
      </div>

      <!-- Gewicht -->
      <div class="feld">
        <label for="gewicht">Gewicht <span class="freiwillig">(freiwillig)</span></label>
        <div class="einheit">
          <input id="gewicht" type="text" inputmode="numeric" placeholder="z. B. 450" bind:value={gewicht}
            aria-invalid={!!fehler.gewicht} aria-describedby="gewicht-hilfe"
            oninput={() => { gewicht = gewicht.replace(/\D/g, ''); fehler.gewicht = undefined; }} />
          <span aria-hidden="true">Gramm</span>
        </div>
        <p class="hilfe" id="gewicht-hilfe"><Ph>{TEXTE.gewichtHinweis}</Ph></p>
        {#if fehler.gewicht}<p class="fehler">{fehler.gewicht}</p>{/if}
      </div>

      <!-- Telefon -->
      <div class="feld">
        <label for="telefon">Ihre Telefonnummer <span class="pflicht">Pflicht</span></label>
        <input id="telefon" type="tel" autocomplete="tel" inputmode="tel" placeholder="z. B. 0841 123456"
          bind:value={telefon} aria-invalid={!!fehler.telefon} aria-describedby="telefon-hilfe"
          oninput={() => (fehler.telefon = undefined)} />
        <p class="hilfe" id="telefon-hilfe">Damit wir Sie zurückrufen können.</p>
        {#if fehler.telefon}<p class="fehler">{fehler.telefon}</p>{/if}
      </div>

      <!-- Einwilligung -->
      <div class="feld">
        <label class="einwilligung" class:fehlt={fehler.einwilligung}>
          <input type="checkbox" bind:checked={einwilligung} aria-invalid={!!fehler.einwilligung}
            onchange={() => (fehler.einwilligung = undefined)} />
          <span><Ph>{TEXTE.einwilligung}</Ph> <span class="pflicht">Pflicht</span></span>
        </label>
        <a href="#/melden" class="klein" onclick={(e) => e.preventDefault()}>Datenschutzerklärung lesen (Platzhalter-Link)</a>
        {#if fehler.einwilligung}<p class="fehler">{fehler.einwilligung}</p>{/if}
      </div>

      {#if Object.values(fehler).filter(Boolean).length}
        <p class="fehler-zusammen" role="alert">
          {fehler.senden ?? 'Bitte prüfen Sie die rot markierten Angaben.'}
        </p>
      {/if}

      <button type="submit" class="knopf primaer gross" disabled={sendet}>
        {sendet ? 'Wird gesendet …' : 'Meldung absenden'}
      </button>
    </form>
  {/if}
</main>

<style>
  .kopf { background: var(--gruen); color: #fff; }
  .kopf-innen { max-width: 640px; margin: 0 auto; padding: 0.7rem 16px; display: flex; align-items: center; gap: 0.5rem; font-weight: 700; }
  .logo { font-size: 1.4rem; }
  h1 { margin-top: 0.5rem; }
  .intro { font-size: 1.05rem; margin-bottom: 1.5rem; }
  .plz-ok { color: var(--gruen-dunkel); font-weight: 700; margin: 0; }
  .plz-aussen { background: var(--gelb-hell); border-left: 5px solid #c9a400; padding: 0.5rem 0.75rem; border-radius: 6px; margin: 0.25rem 0 0; }
  .standort-ok { background: var(--gruen-hell); padding: 0.6rem 0.75rem; border-radius: 8px; margin: 0; font-weight: 600; }
  .link { background: none; border: 0; color: var(--gruen-dunkel); text-decoration: underline; font: inherit; cursor: pointer; min-height: var(--ziel); padding: 0 0.5rem; }
  .vorschau { width: 100%; max-height: 320px; object-fit: cover; border-radius: var(--radius); border: 2px solid var(--rand-hell); }
  .zwei { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
  .foto-knopf { min-height: 64px; border-style: dashed; }
  .einheit { display: flex; align-items: center; gap: 0.6rem; }
  .einheit input { max-width: 12rem; }
  .einheit span { font-weight: 600; }
  .einwilligung { display: flex; gap: 0.8rem; align-items: flex-start; font-weight: 400; cursor: pointer; padding: 0.8rem; border: 2px solid var(--rand-hell); border-radius: var(--radius); background: #fff; }
  .einwilligung.fehlt { border-color: var(--rot); background: var(--rot-hell); }
  .einwilligung input { width: 28px; height: 28px; flex: none; margin: 0.1rem 0 0; accent-color: var(--gruen); }
  .klein { font-size: 0.95rem; }
  .fehler-zusammen { background: var(--rot-hell); color: var(--rot); font-weight: 700; padding: 0.7rem 0.9rem; border-radius: var(--radius); }

  .danke { text-align: left; }
  .haken-gross { width: 64px; height: 64px; border-radius: 50%; background: var(--gruen); color: #fff; font-size: 2.2rem; display: grid; place-items: center; margin: 1rem 0 0.5rem; }
  .dringend-box { background: var(--rot-hell); border-left: 6px solid var(--rot); padding: 0.7rem 0.9rem; border-radius: 8px; }
  .tipps { background: #fff; border-radius: var(--radius); padding: 1rem; margin: 1.5rem 0; box-shadow: var(--schatten); }
  .tipps ol { padding-left: 1.3rem; margin: 0; }
  .tipps li { margin-bottom: 0.6rem; }
  .hinweis-maden { margin-top: 0.8rem; font-weight: 600; background: var(--rot-hell); padding: 0.6rem 0.75rem; border-radius: 8px; }
  .stationen { list-style: none; padding: 0; display: grid; gap: 0.75rem; }
  .stationen li { display: grid; gap: 0.3rem; }
  .gebiet { color: var(--text-2); }
</style>
