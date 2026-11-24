# Instructions GitHub Copilot

Fork du cours de Michel Buffa : applications p5.js fondées sur les steering behaviors de Craig Reynolds. Règles : `AGENTS.md`, `ARCHITECTURE.md`. État : `HANDOFF.md`.

- Une classe maximum par fichier (sauf classe interne) ; `sketch.js` sans classe.
- Tout élément graphique animé, et tout élément fixe qui pourrait bouger, est un `Vehicle` ou une sous-classe : `applyBehaviors()` → `applyForce()` → `update()` → `show()`.
- Objets spécialisés (joueur, ennemi, vaisseau, missile, score animé) : sous-classes de `Vehicle`.
- Un comportement renvoie un `p5.Vector` : `steering = desired - velocity`, limité à `maxForce`.
- Debug : touche D + case à cocher synchronisées, vecteurs vitesse rouges si `Vehicle.debug === true`.
- Chaque dossier numéroté est autonome. Après chaque opération : mettre à jour `HANDOFF.md`.
