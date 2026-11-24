# CLAUDE.md

Consignes pour Claude (Claude Code, claude.ai). Les règles complètes sont
dans @AGENTS.md et @ARCHITECTURE.md — les lire avant de coder.

## Démarrage de session
1. Lire `HANDOFF.md` (état, dernière opération, prochaines étapes).
2. Lire `ARCHITECTURE.md` et `1-Specification.md`.

## Règles essentielles
- Une classe max par fichier (sauf classe interne) ; fichier = nom de classe.
- Tout élément graphique animé (et tout élément fixe qui pourrait bouger,
  comme un obstacle) est un `Vehicle` ou une sous-classe, déplacé
  uniquement par steering behaviors.
- Objets spécialisés (joueur, ennemi, missile, score animé…) =
  `class X extends Vehicle` dans `X.js`.
- Comportements = méthodes de `Vehicle` qui renvoient une force ;
  tag `@behavior` pour les nouveaux.
- Touche D + case Debug synchronisées ; vecteurs vitesse en rouge en debug.
- Style p5.js : voir `docs/p5-coding-standards.md`.

## Après chaque opération
1. Mettre à jour `HANDOFF.md` (journal, état, prochaines étapes).
2. Mettre à jour le statut dans `1-Specification.md`.
3. `npm run readme`.

## Commandes
`npm run dev` · `npm run readme` · `npm run readme:check`
