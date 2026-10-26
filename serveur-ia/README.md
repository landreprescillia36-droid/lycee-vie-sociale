# Serveur IA (Cloudflare Worker)

Donne de vraies réponses aux camarades et à la famille dans l'application installée.
Le jeu envoie le texte préparé par `buildPrompt` / `buildTalkPrompt` (`{prompt}`), le serveur demande la
réponse à Claude et renvoie `{reponse, amitie, amour, proposition}`. Sans serveur (ou en cas d'erreur),
le jeu utilise les réponses toutes faites (`fallbackReply`, `talkFallback`).

- Clé Anthropic : secret Cloudflare `ANTHROPIC_API_KEY` (jamais dans le dépôt ni dans le navigateur).
- `wrangler.toml` : `MODELE` (`claude-opus-5-5` ou `claude-haiku-5-5`), `ORIGINES` (sites autorisés),
  limite de 20 messages par minute et par adresse IP.
- Adresse du serveur à mettre dans `js/config.js` → `aiUrl`.

## Mise en ligne

Depuis le tableau de bord Cloudflare : Workers & Pages → Create → Import a repository →
`lycee-vie-sociale`, chemin `serveur-ia`, commande de déploiement `npx wrangler deploy`.
Puis Settings → Variables and Secrets → Add → Secret `ANTHROPIC_API_KEY`.

Ou depuis un ordinateur : `cd serveur-ia && npm install && npx wrangler login && npx wrangler secret put ANTHROPIC_API_KEY && npx wrangler deploy`.

## Tester en local

`.dev.vars` : `ANTHROPIC_API_KEY=…` (et `ANTHROPIC_BASE_URL=http://127.0.0.1:8799` pour un faux serveur), puis `npx wrangler dev`.
