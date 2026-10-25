/* Vérification visuelle dans un vrai navigateur (Chromium via Playwright).
   - ouvre index.html, signale toute erreur JavaScript ;
   - enregistre dans tools/captures/ : l'atelier (téléphone), tous les personnages en pied, les décors photo.
   Prérequis une seule fois : npm install  puis  npx playwright install chromium
   Usage : npm run captures */
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const root = path.join(__dirname, '..');
const out = path.join(__dirname, 'captures');
fs.mkdirSync(out, { recursive: true });
const url = 'file://' + path.join(root, 'index.html');

(async () => {
  const browser = await chromium.launch();
  const errors = [];

  // 1. écran de l'atelier au format téléphone
  const phone = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  phone.on('pageerror', e => errors.push('atelier : ' + e.message));
  await phone.goto(url);
  await phone.waitForTimeout(600);
  await phone.screenshot({ path: path.join(out, 'atelier-telephone.png'), fullPage: true });

  // 2. galerie : le personnage du joueur + tous les camarades, en pied
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  page.on('pageerror', e => errors.push('galerie : ' + e.message));
  await page.goto(url);
  await page.waitForTimeout(600);
  await page.evaluate(() => {
    const people = [['Joueur·se', state], ...NPCS.map(n => [fullNameOf(n.id), n.av])];
    document.body.innerHTML = '<div id="g" style="display:flex;flex-wrap:wrap;gap:8px;padding:8px;background:#fff;font:13px sans-serif"></div>';
    document.getElementById('g').innerHTML = people.map(([name, av], i) =>
      `<div style="width:190px"><div style="height:510px">${render(av, FVB, 'c' + i, true).replace('<svg ', '<svg style="width:100%;height:100%" ')}</div><div>${name}</div></div>`).join('');
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(out, 'personnages.png'), fullPage: true });

  // 3. décors des photos Insta (dont les chambres)
  await page.evaluate(() => {
    const ids = [...Object.keys(SCENES), ...Object.values(ROOMS)];
    document.body.innerHTML = '<div id="g" style="display:grid;grid-template-columns:repeat(4,300px);gap:8px;padding:8px;background:#fff;font:13px sans-serif"></div>';
    document.getElementById('g').innerHTML = ids.map(id =>
      `<div><svg viewBox="0 0 600 400" width="300" height="200" xmlns="http://www.w3.org/2000/svg">${sceneSVG(id, 's' + id)}</svg><div>${id}</div></div>`).join('');
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(out, 'decors.png'), fullPage: true });

  await browser.close();
  if (errors.length) { console.error('ERREURS :\n' + errors.join('\n')); process.exit(1); }
  console.log('OK : captures enregistrées dans tools/captures/');
})();
