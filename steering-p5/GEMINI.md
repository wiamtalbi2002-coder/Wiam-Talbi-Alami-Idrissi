# GEMINI.md

Consignes pour Gemini (Gemini CLI, Gemini Code Assist). Les règles complètes
sont dans `AGENTS.md` et `ARCHITECTURE.md` : les lire avant de coder.

## Démarrage
1. Lire `HANDOFF.md`, puis `ARCHITECTURE.md`, puis `1-Specification.md`.

## Règles essentielles
- Projet p5.js 2.x en mode global, scripts classiques (pas de modules ES)
  chargés par `index.html` : p5 → `shared/Vehicle.js` → classes → `sketch.js`.
- Une classe maximum par fichier (sauf classe interne), nommée comme le
  fichier.
- Tout élément graphique animé et tout élément fixe qui pourrait bouger est
  un `Vehicle` (ou une sous-classe) mû par des steering behaviors
  (Craig Reynolds) : `applyBehaviors()` → `update()` → `show()`.
- Objets spécialisés = sous-classes de `Vehicle`.
- Les comportements renvoient une force `p5.Vector` limitée à `maxForce`.
- Debug : touche D et case à cocher synchronisées, vitesse en rouge.
- Style : `docs/p5-coding-standards.md`.

## Après chaque opération
Mettre à jour `HANDOFF.md`, le statut dans `1-Specification.md`, puis
lancer `npm run readme`.
