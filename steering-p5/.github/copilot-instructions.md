# Instructions GitHub Copilot

Projet p5.js 2.x : applications fondées sur les steering behaviors de Craig
Reynolds. Règles complètes : `AGENTS.md`, `ARCHITECTURE.md`. État du
projet : `HANDOFF.md`. Tâches : `1-Specification.md`.

- Une classe maximum par fichier (sauf classe interne) ; le fichier porte le
  nom de la classe ; `sketch.js` sans classe.
- Tout élément graphique animé, et tout élément fixe qui pourrait bouger
  (obstacle, cible), est un `Vehicle` (`shared/Vehicle.js`) ou une
  sous-classe, déplacé uniquement par des forces de pilotage :
  `applyBehaviors()` → `applyForce()` → `update()` → `show()`.
- Objets spécialisés (joueur, ennemi, vaisseau, missile, score animé) :
  `class Nom extends Vehicle` dans `Nom.js`.
- Un comportement renvoie un `p5.Vector` : `steering = desired − velocity`,
  limité à `maxForce`. Nouveau comportement générique dans `Vehicle.js` avec
  `@behavior Nom — description`.
- Debug : touche D + case à cocher synchronisées (`panel.addDebugToggle()`,
  `panel.toggleDebug()`), vecteur vitesse rouge si `Vehicle.debug === true`.
- Curseurs dans `ControlPanel` (haut de l'écran, semi-transparent, accordéon).
- Style p5 : 2 espaces, `let`, `===`, guillemets simples, `;`,
  `push()`/`pop()`.
- Après chaque opération : mettre à jour `HANDOFF.md` et lancer
  `npm run readme`.
