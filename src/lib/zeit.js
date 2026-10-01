const fmtDatum = new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'numeric', year: 'numeric' });
const fmtKurz = new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'numeric' });
const fmtZeit = new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit' });

export function seit(iso, jetzt = Date.now()) {
  const min = Math.max(0, Math.round((jetzt - new Date(iso).getTime()) / 60000));
  if (min < 1) return 'gerade eben';
  if (min < 60) return `seit ${min} Min.`;
  const std = Math.round(min / 60);
  if (std < 24) return `seit ${std} Std.`;
  const tage = Math.round(std / 24);
  return tage === 1 ? 'seit 1 Tag' : `seit ${tage} Tagen`;
}

export const datum = (iso) => (iso ? fmtDatum.format(new Date(iso)) : '');
export const datumKurz = (iso) => (iso ? fmtKurz.format(new Date(iso)) : '');
export const uhrzeit = (iso) => (iso ? fmtZeit.format(new Date(iso)) : '');
export const datumZeit = (iso) => (iso ? `${datum(iso)}, ${uhrzeit(iso)} Uhr` : '');
/** Datum als 'JJJJ-MM-TT' in lokaler Zeit */
export const lokalesDatum = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const heute = () => lokalesDatum();

/** Tage bis zu einem Datum (negativ = vorbei) */
export function tageBis(isoDatum) {
  const a = new Date(heute());
  const b = new Date(isoDatum);
  return Math.round((b - a) / 86400000);
}
