# Lycée · vie sociale — guide pour Claude Code

Jeu de simulation de vie sociale en terminale, dans un lycée de Guadeloupe. Créatrice : Prescillia (francophone, Guadeloupe). Tout le texte du jeu et les échanges avec elle sont **en français**, réponses courtes et directes.

**Objectif actuel : transformer ce prototype (une page web) en vraie application** (voir `docs/FEUILLE-DE-ROUTE.md`).

## Lancer et tester

- `npm install` (une fois), puis `npm run dev` : serveur local, accessible aussi depuis le téléphone sur le même Wi-Fi (`--host`).
- Sans installation : ouvrir `index.html` directement dans un navigateur, tout fonctionne.
- `npm test` : simulation sans navigateur (faux DOM) de 3 jours de jeu + ouverture des écrans principaux. Doit finir par « OK ».
- `npm run captures` (après `npx playwright install chromium`) : détecte les erreurs JS dans un vrai Chromium et enregistre dans `tools/captures/` l'atelier au format téléphone, tous les personnages en pied et tous les décors. **Toujours regarder les captures après une modification visuelle** : la créatrice juge au rendu.

## Structure

```
index.html          structure HTML (atelier, écran famille, jeu, feuille modale, toast)
css/style.css       tous les styles (atelier clair, jeu sombre)
js/app.js           tout le code (~2 500 lignes, script classique, variables globales)
claude-page.html    version publiée sur claude.ai (même corps que index.html, sans en-tête ; à refaire si index.html change) : https://claude.ai/artifact/4XTD2xkAiVHspaZsdKfwvc
manifest.webmanifest, sw.js   application installable (PWA) : manifeste et service worker (cache hors ligne)
js/cloud.js         comptes et sauvegarde en ligne Supabase (inactif si js/config.js est vide) ; js/vendor/supabase.js = supabase-js 2.117.2 (UMD)
supabase/schema.sql table « sauvegardes » + règles RLS
.github/workflows/pages.yml  mise en ligne GitHub Pages à chaque push sur main (copie index.html, manifest, sw.js, css, js, fonts, icons, assets)
icons/              icônes de l'app, générées par tools/icones.js (portrait d'Inès sur fond jaune)
fonts/, css/fonts.css  polices Baloo 2 et Nunito hébergées localement
assets/chambres/    chambres des camarades (images créées par Prescillia, 900×600)
docs/references/    modèles visuels de Prescillia : personnages, corps/épaules, agencement de l'atelier
tools/              simulate.js (test Node), captures.js (test Playwright), icones.js (icônes)
```

`js/app.js` est découpé par commentaires de section (`/* ---------- … ---------- */`). Dans l'ordre :

1. **Couleurs / formes** : `rgb`, `mix`, `shade`, `lum` ; palettes `SKIN`, `HAIR`, `IRIS`, `CLOTH`, `BOTC`, `SHOEC`, `BGC` ; formes de visage `FACES`, d'yeux `EYES`.
2. **Rendu** : `render(s, viewBox, prefixe, fond)` renvoie un SVG complet de l'avatar `s`. ViewBox : `PVB` portrait, `FVB` en pied, `AVB` petite pastille, `PHB` photos.
3. **Corps** : `GEO` (gabarits f/m/nb), `TAILLE`, `CORP` (corpulence), `sideX` (silhouette), `shProf` (profil d'épaule commun au corps, aux bras et à tous les vêtements), `armPts/armD` (bras, allongés par `AY`), `torsoD`, `legD`, `yokeSVG` (épaules nues), `capPatch` (raccord d'épaule des manches), `bustSVG`/`bustLine` (poitrine).
4. **Vêtements** : `TOP2`/`topSVG` (hauts), `pantsLegD`/`bottomsSVG` (bas), `DR`/`dressSVG` (robes), `JK`/`jacketParts` (vestes), `shoeSVG`, `hatSVG`, `accSVG`.
5. **Cheveux** : `hairBack` / `hairMid` / `hairFront` (3 couches), `HAIR_ALL` (styles proposés), `HAIRDB` (fiches), `softLight`, `ringlets`, `scallop`. Coordonnées de tête locales via `HT=translate(90,19.2) scale(.55)`.
6. **Données de l'interface** : `WEAR` (catalogue de vêtements par rayon), `TABS` (onglets de l'atelier), `DEFAULT`, `BASE_LOOK` (Léa / Enzo), `normalize()`.
7. **Catalogue filles / garçons** : chaque article a `g:'f'`, `g:'m'` ou rien (mixte) ; `wearVis()` filtre selon le sexe ; non-binaire = tout.
8. **Moteur du jeu** : `NPCS` + `NPC_LOOK` (apparence), `NPC_NOM` (noms de famille), `FICHES` (personnalités), `LINKS0` (relations entre camarades), `VOICE`/`CONFESS` (répliques), `SUBJ`/`PROFS`/`TT` (emploi du temps), année scolaire, famille, photos (`sceneSVG`, `SCENES`, `ROOMS`), fil, objectifs, état `G` (`newGame`, `saveG`), IA, messages, autonomie des camarades, horloge, musique (Web Audio), HUD, vues, fiches, discussion, création de post, événements, écouteurs.

## Règles du code

- **Hors ligne (service worker)** : tout nouveau fichier chargé par le jeu (image, script, police) doit être ajouté à `FICHIERS` dans `sw.js`, et `VERSION` augmentée à chaque mise en ligne qui change la liste. Le service worker ne marche qu'en https ou sur `localhost`, pas en ouvrant `index.html` directement.
- **Accords de genre** : écrire les textes en inclusif (`content·e`, `amoureux·se`, `lycéen·ne`) ; `gtxt`, `P(t)` (joueur·se), `S(id,t)` (personne qui parle) et `genderize()` accordent automatiquement. `{p:…}` force l'accord avec le joueur.
- **Année scolaire** : 180 jours, trimestres `TRI_END=[60,120,175]`, révisions jour 176, bac 177-178, résultats 179-180. Évaluation chaque vendredi 14-17 h. Oubli de 1 %/jour des matières non révisées.
- **Relations** : amitié du joueur à 0 en début de partie (peut descendre à −30) ; les camarades entre eux gardent `LINKS0`. Pas de message spontané d'un camarade sous 60 d'amitié.
- **Sauvegarde en ligne** : `saveG()` appelle `cloudPush()` ; `js/cloud.js` envoie l'avatar et la partie (au plus toutes les 30 s, et quand l'appli passe en arrière-plan) et propose de choisir quand la version en ligne diffère. Ne pas mettre ce module dans `claude-page.html` (claude.ai bloque les appels réseau).
- **Sauvegardes** : `localStorage` (`atelier-avatar-v1` pour l'avatar, `atelier-partie-v3` pour la partie). Toute nouvelle donnée doit avoir une **migration** dans le bloc `if(G){…}` après le chargement, pour ne pas casser les parties en cours.
- **Nouvel article de catalogue** : l'ajouter dans `WEAR` (avec `g`), le dessiner dans la fonction de rendu correspondante, vérifier les 4 corpulences et les 3 tailles, filles et garçons.
- **Couleurs de peau** : tester au moins une peau claire et une peau foncée.

## IA des camarades

Dans claude.ai, les réponses des camarades venaient de `window.claude.use('sample')` (voir section `IA`, fonctions `buildPrompt` et `sendChat`). **Hors de claude.ai cette API n'existe pas** : le jeu bascule automatiquement sur `fallbackReply` (réponses écrites selon la personnalité). Pour retrouver de vraies réponses, il faut un petit serveur qui appelle l'API Anthropic (clé gardée côté serveur, jamais dans le navigateur) et renvoie le même JSON `{reponse, amitie, amour, proposition}`.

## Ce que la créatrice attend (à respecter)

- Fidélité à **ses** images de référence (`docs/references/`), traits et ombres compris. Elle signale vite ce qui n'est pas fidèle ; corriger précisément ce qu'elle montre.
- Ses images sont générées par elle : pas de problème de droits. En revanche **ne jamais recopier ni intégrer d'images de banques d'images** (Shutterstock, etc.) ; proposer une création originale ou lui demander sa propre image.
- Les images qu'elle fournit (ex. chambres) s'intègrent **telles quelles** (juste recadrées, étiquettes retirées).
- Épaules arrondies et reliées au corps, sur toutes les tenues. Poitrine : trait qui descend de l'aisselle puis tourne sous la poitrine + ombre douce dessous.
- Cheveux crépus : contours et ombres seulement, pas de boucles ni de vagues dessinées. Pas de trou entre la tête et les cheveux.
- Catalogues de vêtements séparés filles / garçons.
- Elle préfère voir un aperçu avant qu'une grosse nouveauté soit intégrée.
- **À chaque demande où elle doit faire quelque chose elle-même** (réglage GitHub, Supabase, téléphone…) : donner le **lien direct** vers la page exacte (pas juste le site), la **marche à suivre exacte** étape par étape (où cliquer, quoi choisir, quoi écrire), et une **capture ou un schéma** de l'écran à atteindre (image PNG envoyée avec le message).
