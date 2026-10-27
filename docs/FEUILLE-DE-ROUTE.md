# Feuille de route : du prototype à une vraie application

Chaque étape laisse le jeu jouable. Après chacune : `npm test` et `npm run captures`.

## 1. Projet moderne (base solide)
- Passer `js/app.js` en modules ES (`<script type="module">`) et le découper par section : `couleurs.js`, `rendu/corps.js`, `rendu/vetements.js`, `rendu/cheveux.js`, `catalogue.js`, `jeu/etat.js`, `jeu/camarades.js`, `jeu/annee.js`, `jeu/messages.js`, `ui/atelier.js`, `ui/jeu.js`, etc.
- Déplacer `assets/` dans `public/` pour que `vite build` produise un dossier `dist/` complet.
- Optionnel ensuite : TypeScript, et un framework d'interface (Svelte ou React) pour les écrans.
- Mettre le projet sur GitHub (workflow de mise en ligne prêt : `.github/workflows/pages.yml`).

## 2. Application installable (PWA) ✅ fait
- Manifeste (`manifest.webmanifest`), icônes (`icons/`, refaites avec `npm run icones`), service worker (`sw.js`) : le jeu s'installe sur l'écran d'accueil et marche hors ligne.
- Polices (Baloo 2, Nunito) hébergées dans `fonts/` au lieu de Google Fonts.
- Reste à faire : mettre le jeu en ligne en https (Netlify, GitHub Pages…) pour l'installer depuis le téléphone.

## 3. IA des camarades hors de claude.ai
- Petit serveur (ex. fonction serverless) qui reçoit le contexte de `buildPrompt`, appelle l'API Anthropic et renvoie `{reponse, amitie, amour, proposition}`.
- Clé API uniquement côté serveur ; limiter le nombre d'appels par joueur.
- Garder `fallbackReply` en secours (hors ligne, erreur réseau).

## 4. Comptes et sauvegarde en ligne ✅ code prêt (reste à créer le projet Supabase, voir README)
- Remplacer `localStorage` par une sauvegarde liée à un compte (ex. Supabase ou Firebase), avec synchronisation entre appareils.
- Conserver les migrations de sauvegarde (versions de `G`).

## 5. Application mobile (Android d'abord)
- Envelopper le jeu avec Capacitor pour obtenir une app Android (puis iOS).
- Notifications locales pour les messages des camarades, sons, vibration.
- Publication : compte développeur Google Play, fiche, captures, politique de confidentialité (le jeu vise des lycéen·nes : attention aux règles sur les mineurs et aux contenus).

## 6. Contenu à venir (déjà évoqué)
- Chambre du personnage joueur, nouveaux décors (glacier, centre-ville, cinéma, restaurant créole).
- Nouvelles pièces de vêtements, ensembles, catalogue garçons à enrichir.
- Personnages de la famille et compte « Potins du lycée » à refaire d'après les modèles de Prescillia.

## 7. Vie du lycée ✅ fait (voir CLAUDE.md)
- Mini-jeux de révision (quiz, mémoire), événements locaux (cyclone, Toussaint, gwoka, tournoi, plage), clubs, projet de classe, dilemmes avec rancunes et groupes d'amis, bilan de la semaine, plusieurs fins, réglages (texte, contraste, volume, notifications).
- Reste à faire : notifications jeu fermé (Web Push, demande un serveur), plus de mini-jeux, plus de dilemmes.
