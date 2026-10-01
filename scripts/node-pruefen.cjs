// Prüft die Node-Version, bevor irgendetwas installiert wird.
// Absichtlich in altem JavaScript geschrieben, damit es auch auf sehr alten Node-Versionen läuft.
var teile = process.versions.node.split('.').map(Number);
var ok = teile[0] > 22 || (teile[0] === 22 && teile[1] >= 12) || (teile[0] === 20 && teile[1] >= 19);
if (!ok) {
  console.error('');
  console.error('  Node.js ' + process.versions.node + ' ist zu alt. Benötigt wird Node.js 20.19 oder neuer (empfohlen: 22 LTS).');
  console.error('');
  console.error('  Windows: Installer "LTS" von https://nodejs.org herunterladen und installieren');
  console.error('           oder in PowerShell:  winget install OpenJS.NodeJS.LTS');
  console.error('  Danach das Terminal schließen, neu öffnen, den Ordner node_modules löschen und "npm start" erneut ausführen.');
  console.error('');
  console.error('  Ohne Node.js: prototyp/igel-leitstelle.html einfach per Doppelklick öffnen.');
  console.error('');
  process.exit(1);
}
