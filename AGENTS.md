# AGENTS.md

Instructions pour tout agent de code (OpenAI Codex, Claude Code, Gemini CLI, Copilot, Cursor…).

## Projet
Fork du cours de Michel Buffa sur les **steering behaviors de Craig Reynolds** en **p5.js**. Chaque dossier numéroté (`1-Seek`, `Wiam-AvionAttaquant`, `Wiam-Snake`…) est une application autonome.

## À lire avant toute modification
1. `HANDOFF.md` : état actuel, dernière opération, prochaines étapes.
2. `ARCHITECTURE.md` : règles obligatoires.
3. La spécification du dossier concerné (ex. `1-Seek/1-Specification.md`).

## Règles non négociables
1. Une classe maximum par fichier (sauf classe interne) ; `sketch.js` sans classe.
2. Tout élément graphique animé est un `Vehicle` ou une sous-classe, déplacé uniquement par steering behaviors.
3. Les éléments fixes qui pourraient bouger (obstacles, cibles) sont aussi des `Vehicle`.
4. Objets spécialisés (joueur, ennemi, vaisseau, missile, score animé) = sous-classes de `Vehicle`.
5. Un comportement renvoie une force (`steering = desired - velocity`, limitée à `maxForce`).
6. Debug : touche D + case à cocher synchronisées, vecteurs vitesse en rouge.
7. Chaque dossier reste autonome (jamais de `../` vers un autre dossier).

## Après CHAQUE opération
- Mettre à jour `HANDOFF.md` (journal, état actuel, prochaines étapes).
- Mettre à jour le statut dans la spécification du dossier.

## Commandes
- Lancer : `python -m http.server 8090` à la racine, puis `http://localhost:8090/<dossier>/`.
- Publier : `git add .`, `git commit -m "..."`, `git push origin main`.
- Node.js n'est pas installé sur le PC de l'utilisatrice : pas de `npm`.
