/* Fabrique les icônes de l'application (écran d'accueil du téléphone) à partir du rendu du jeu.
   Usage : node tools/icones.js   (ou npm run icones). Écrit icons/*.png.
   Pour changer de personnage : modifier QUI ci-dessous ('ines', 'kylian', … ou 'joueur'). */
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const QUI = 'ines';
const FOND = '#ffb627';
const root = path.join(__dirname, '..');
const out = path.join(root, 'icons');
fs.mkdirSync(out, { recursive: true });

// taille en px, part du carré occupée par le portrait (les icônes « maskable » sont recadrées en rond par Android)
const ICONES = [
  ['icon-192.png', 192, 1],
  ['icon-512.png', 512, 1],
  ['icon-maskable-512.png', 512, 0.8],
  ['apple-touch-icon.png', 180, 1],
  ['favicon-32.png', 32, 1],
];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('file://' + path.join(root, 'index.html'));
  await page.waitForTimeout(400);
  for (const [nom, px, part] of ICONES) {
    await page.setViewportSize({ width: px, height: px });
    await page.evaluate(({ qui, fond, px, part }) => {
      const av = qui === 'joueur' ? state : NPCS.find(n => n.id === qui).av;
      const svg = render(av, PVB, 'ic', false).replace('<svg ', `<svg width="${px * part}" height="${px * part}" `);
      document.documentElement.style.padding = '0';
      document.body.innerHTML = `<div style="position:fixed;inset:0;background:${fond};display:flex;align-items:flex-end;justify-content:center;overflow:hidden">${svg}</div>`;
    }, { qui: QUI, fond: FOND, px, part });
    await page.screenshot({ path: path.join(out, nom), clip: { x: 0, y: 0, width: px, height: px } });
  }
  await browser.close();
  console.log('OK : icônes enregistrées dans icons/');
})();
