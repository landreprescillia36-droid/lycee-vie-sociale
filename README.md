# Lycée · vie sociale

Jeu de vie sociale en terminale dans un lycée de Guadeloupe, créé par Prescillia.

- **Atelier d'avatar** : visage, yeux, cheveux, tenue (catalogues filles et garçons), corps (taille et corpulence), prénom et nom.
- **Famille** : les proches du personnage, qui portent son nom.
- **Le jeu** : 180 jours de terminale, cours, évaluations du vendredi, bulletins, bac ; sept camarades avec leur personnalité (Inès, Kylian, Maëlle, Noah, Jade, Anaïs, Sacha) ; amitiés et histoires de cœur ; messages, posts, stories et photos dans différents lieux ; musique de fond.

## Démarrer

1. Ouvrir `index.html` dans un navigateur, ou `npm install` puis `npm run dev`.
2. Pour continuer le développement avec Claude Code : ouvrir ce dossier dans Claude Code. Le fichier `CLAUDE.md` lui explique tout le projet.

## Vraie application : GitHub + Supabase

Le jeu s'installe sur l'écran d'accueil (Android, iPhone, PC), marche hors ligne et, avec un compte, retrouve ta partie sur tous tes appareils.

### 1. Mettre le jeu en ligne avec GitHub (gratuit)
1. Crée un dépôt vide sur https://github.com/new (par exemple `lycee-vie-sociale`) et envoie-y ce dossier (Claude Code peut le faire une fois ton GitHub relié à claude.ai).
2. Dans le dépôt : **Settings → Pages → Source : GitHub Actions**.
3. À chaque envoi sur `main`, le jeu est mis en ligne tout seul (`.github/workflows/pages.yml`) à l'adresse `https://<ton-compte>.github.io/lycee-vie-sociale/`.
4. Ouvre cette adresse sur le téléphone : **Android (Chrome)** menu ⋮ → « Installer l'application » ; **iPhone (Safari)** Partager → « Sur l'écran d'accueil ».

### 2. Comptes et sauvegarde en ligne avec Supabase (gratuit)
1. Crée un projet sur https://supabase.com.
2. **SQL Editor → New query** : colle le contenu de `supabase/schema.sql`, puis **Run**.
3. **Authentication → URL Configuration** : mets l'adresse GitHub Pages du jeu dans « Site URL » (pour le lien de confirmation par e-mail).
4. **Project Settings → API** : copie « Project URL » et la clé **anon / publishable** dans `js/config.js`. Jamais la clé « service_role / secret ».
5. Envoie la modification sur GitHub. Le bouton **Mon compte** apparaît dans l'atelier et dans le profil.

Sans ces réglages, le jeu marche comme avant, avec la sauvegarde seulement sur l'appareil.

## Jouer sur claude.ai

Version publiée : https://claude.ai/artifact/4XTD2xkAiVHspaZsdKfwvc (les camarades y répondent avec l'IA ; pas de compte Supabase là-bas).

## Prochaines étapes

Voir `docs/FEUILLE-DE-ROUTE.md` : projet moderne, application installable, IA des camarades, sauvegarde en ligne, application Android.
