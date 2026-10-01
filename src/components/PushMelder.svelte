<script>
  // Zeigt neue (simulierte) Push-Nachrichten als Hinweis an – nur im internen Bereich.
  import { liveTabelle } from '../lib/live.svelte.js';
  import { zeigeToast } from '../lib/toast.svelte.js';
  import { lesePushGesehen, schreibePushGesehen } from '../lib/einstellungen.svelte.js';

  const push = liveTabelle('push_protokoll');

  $effect(() => {
    if (!push.geladen) return;
    const maxId = Math.max(0, ...push.zeilen.map((p) => p.id));
    const gesehen = lesePushGesehen();
    if (gesehen === null || gesehen > maxId) {
      // Erster Start oder Daten zurückgesetzt: nichts Altes anzeigen
      schreibePushGesehen(maxId);
      return;
    }
    const neu = push.zeilen.filter((p) => p.id > gesehen).slice(-2);
    for (const p of neu) {
      // Kurzfassung: Kopfzeile + Ort (der volle Text steht im Protokoll)
      const [kopf, ort] = p.nachricht.split(' · ');
      const kurz = `${kopf.includes('DRINGEND') ? 'DRINGEND' : 'Neue Meldung'} – ${ort}`;
      zeigeToast(`📲 Push ans ${p.empfaenger}: ${kurz}`, { art: 'push', dauer: 9000, link: { href: '#/protokoll', label: 'Ansehen' } });
    }
    if (maxId > gesehen) schreibePushGesehen(maxId);
  });
</script>
