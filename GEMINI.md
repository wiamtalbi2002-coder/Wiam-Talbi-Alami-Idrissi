# GEMINI.md

Consignes pour Gemini (Gemini CLI, Gemini Code Assist). Règles complètes : `AGENTS.md` et `ARCHITECTURE.md`.

- Lire d'abord `HANDOFF.md`, puis `ARCHITECTURE.md`, puis la spécification du dossier concerné.
- p5.js en mode global, scripts classiques chargés par `index.html` (classe mère avant les sous-classes, `sketch.js` en dernier).
- Une classe maximum par fichier ; tout élément animé est un `Vehicle` (ou une sous-classe) mû par des steering behaviors.
- Objets spécialisés = sous-classes de `Vehicle` ; les comportements renvoient une force limitée à `maxForce`.
- Debug : touche D + case à cocher synchronisées, vecteurs vitesse en rouge.
- Après chaque opération : mettre à jour `HANDOFF.md`.
