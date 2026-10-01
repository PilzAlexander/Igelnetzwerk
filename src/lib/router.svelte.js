// Minimaler Hash-Router: #/melden, #/board, #/igel, #/igel/3, #/protokoll
export const route = $state({ pfad: [] });

function lesen() {
  route.pfad = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
}
lesen();
window.addEventListener('hashchange', () => {
  lesen();
  window.scrollTo(0, 0);
});

export function geheZu(pfad) {
  location.hash = `#/${pfad}`;
}
