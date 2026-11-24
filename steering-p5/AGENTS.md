# AGENTS.md

Instructions pour tout agent de code (OpenAI Codex, Jules, Cursor, Aider,
Claude Code, Gemini CLI, Copilot…). Fichier de référence : les fichiers
`CLAUDE.md`, `GEMINI.md`, `.github/copilot-instructions.md` et `.cursorrules`
en reprennent l'essentiel.

## Projet
Ensemble d'applications **p5.js 2.x** fondées sur les **steering behaviors de
Craig Reynolds** (GDC 1999). Chaque application est dans `apps/NN-nom/`,
le code commun dans `shared/`.

## À lire avant toute modification (dans cet ordre)
1. `HANDOFF.md` — état actuel, dernière opération, prochaines étapes.
2. `ARCHITECTURE.md` — règles obligatoires.
3. `1-Specification.md` — les tâches demandées.
4. `docs/steering-behaviors.md` et `docs/p5-coding-standards.md` si besoin.

## Règles non négociables
1. **Une classe maximum par fichier** (sauf classe interne), fichier nommé
   comme la classe. `sketch.js` ne contient aucune classe.
2. **Tout élément graphique animé est un `Vehicle`** (`shared/Vehicle.js`) ou
   une sous-classe, et bouge **uniquement par steering behaviors**
   (`applyForce` → `update`).
3. **Les éléments fixes qui pourraient bouger** (obstacles, cibles…) sont
   aussi des `Vehicle` (`maxSpeed = 0`).
4. **Objets spécialisés** (joueur, ennemi, vaisseau, missile, score animé…)
   = **sous-classes de `Vehicle`** qui redéfinissent `applyBehaviors()` et
   `show()`.
5. Les comportements **renvoient** une force (`p5.Vector`), ils ne
   l'appliquent pas. Nouveau comportement générique → `Vehicle.js` avec un
   commentaire `@behavior Nom — description`.
6. Debug : touche **D** + case à cocher synchronisées (`ControlPanel`),
   vecteur vitesse **rouge** quand `Vehicle.debug === true`.
7. Curseurs dans le `ControlPanel` (haut de l'écran, semi-transparent,
   accordéon).
8. Style p5 : 2 espaces, `let`, `===`, guillemets simples, point-virgules,
   `push()`/`pop()` autour du rendu.

## Après CHAQUE opération (obligatoire)
- Mettre à jour **`HANDOFF.md`** : ajouter une entrée en tête du
  « Journal des opérations » (date, agent, fichiers touchés, résultat), mettre
  à jour « État actuel » et « Prochaines étapes ».
- Mettre à jour le **statut** de la tâche dans `1-Specification.md`.
- Lancer **`npm run readme`** pour régénérer `README.md` et `index.html`
  (ne jamais éditer les sections `AUTO` à la main).

## Commandes
- `npm run dev` — serveur local http://localhost:8080 + README auto (watch).
- `npm run readme` — régénère README.md et index.html.
- `npm run readme:check` — vérifie qu'ils sont à jour.
- Aucune dépendance npm à installer ; Node ≥ 20.

## Vérification avant de rendre la main
- Ouvrir l'application concernée dans un navigateur : aucune erreur console.
- Tester la touche D et la case Debug (synchronisation dans les deux sens).
- Tester les valeurs extrêmes des curseurs (0, max).
