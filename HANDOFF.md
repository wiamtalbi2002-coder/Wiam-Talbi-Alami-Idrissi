# HANDOFF.md

Passage de relais entre assistants IA (Claude, Codex, Gemini, Copilot, Cursor…) et humains. **À mettre à jour après chaque opération.**

## Comment reprendre

1. Lire ce fichier, puis [ARCHITECTURE.md](ARCHITECTURE.md), puis la spécification du dossier concerné (ex. `1-Seek/1-Specification.md`).
2. Lancer : `python -m http.server 8090` à la racine, puis `http://localhost:8090/<dossier>/`.
3. Avant de rendre la main : ajouter une entrée en tête du journal ci-dessous et mettre à jour « État actuel » et « Prochaines étapes ».
4. Publier : `git add .`, `git commit -m "..."`, `git push origin main` (GitHub Pages se met à jour en 1 à 2 minutes).

## Contexte

- Dépôt : fork de `micbuffa/SteeringBehavioursM2IA2_Marrakech_2026_2027` → `wiamtalbi2002-coder/Wiam-Talbi-Alami-Idrissi`.
- Site : https://wiamtalbi2002-coder.github.io/Wiam-Talbi-Alami-Idrissi/
- PC de Wiam : Windows, VS Code, PowerShell, Git, Python. **Pas de Node.js** (`npm` introuvable).
- Wiam préfère : une commande à la fois, du code écrit dans les fichiers par des commandes PowerShell à coller.

## État actuel

- Exercices du cours (dossiers du prof, chacun avec sa `N-Specification.md`, panneau accordéon `controlPanel.js`, debug D + case) :
  - `1-Seek/` ✅ tâches 1, 2 et 3 (seek, flee corrigé, réapparition, Targets).
  - `2-PursueEvade/` ✅ pursue / evade, prédiction, chat et souris, balles rebondissantes.
  - `3-Arrival/` ✅ arrive, serpent, formation en V, texte, grille.
  - `4-Wander/` ✅ curseurs, couleurs, traînée, Perlin.
  - `5-1`, `5-2` : exemples à étudier (inchangés). `5-3-PathFollowingComplex/` ✅ circuit complexe, véhicules s / w.
  - `6-ObstacleAvoidance/` ✅ avoid ahead/ahead2, longueur dynamique, wander, évitement entre véhicules.
  - `7-Boids/` ✅ formes, traînée, cible qui repousse, obstacles (o).
  - `8-EvolutionarySteeringBehavior/` ✅ prédateurs, fuite selon la santé, curseurs.
- Les projets perso sont préfixés `Wiam-` (renommés depuis 5-AvionAttaquant, 6-WiamSnake, 7-Boids).
- `Wiam-BoidsWebGPU/` ✅ murmuration WebGPU (Chrome / Edge).
- `Wiam-9-VoituresBuffa/` ✅ neuroévolution (dossier 9 de Buffa) refaite et améliorée : réseau JS pur, élitisme, croisement, cerveau en direct, courbe, course contre l'IA.
- `Wiam-9-VoituresBruno/` ✅ « Steering Lab » de Bruno Vasselle réparé (assets manquants, bug TF.js) + mes ajouts branchés sans modifier son code.
- `Wiam-AvionAttaquant/` ✅ : avion attaquant (pursue + missiles), cibles qui se défendent (evade, dodge, riposte), version 3D avec chars, soldats, radio, sons.
- `Wiam-Snake/` ✅ : jeu de serpent (intro WIAM en perles, musique Web Audio, ennemis, score, game over).
- `steering-p5/` ✅ : premier projet (Vehicle partagé, tâches 1 à 4, docs, README auto). Sa version de l'avion est plus ancienne que `Wiam-AvionAttaquant`.
- Fichiers IA à la racine : `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `.github/copilot-instructions.md`, `.cursorrules`.

## Prochaines étapes

- Attendre les prochaines consignes du prof (projets : circuit, etc. — pas encore faits).
- Chaque nouvelle tâche : dans le dossier de l'exercice, avec sa `N-Specification.md`.
- Ne PAS fusionner `upstream/main` d'un bloc : les commits du prof contiennent ses solutions de 1 à 4 et modifient 5-3 (conflits). Récupérer un dossier précis avec `git checkout upstream/main -- <dossier>` si besoin.

## Pièges connus

- Un dossier qui charge `../../...` ne marche pas une fois copié ailleurs : chaque dossier doit être autonome.
- Après un push, GitHub Pages peut montrer l'ancienne version quelques minutes (cache) : tester en fenêtre privée.
- Erreur 404 sur `fr.json` / `en-US.json` dans la console : normal, p5.js 2 cherche ses traductions.
- Ne pas copier le point final d'une phrase avec une commande (`8082.` → erreur de port).
- Si `localhost` répond 404 : un ancien serveur tourne depuis un autre dossier → utiliser un autre port ou `--directory`.

## Journal des opérations

### 2026-11-25 — Claude — Voitures neuroévolution (Buffa et Bruno)
- `Wiam-9-VoituresBuffa/` : réécriture du dossier 9 de Buffa (une classe par fichier) ; 10 bugs ou limites corrigés (console.log dans predict, fitness 2^n → Infinity, finished jamais vrai, checkpoint par droite infinie…) ; ajouts : cerveau dessiné en direct, courbe de progrès, élitisme, croisement, couleurs héritées, course contre l'IA, sauvegarde du champion. Voir `9-Specification.md`.
- `Wiam-9-VoituresBruno/` : copie de `REPO_BRUNO_VASSELLE/.../9-VoitureSuitCircuit genetic algo`, réparée (assets.js et assets/ jamais publiés à cause de son .gitignore, bug dispose de TF.js 1.1, fonctions save* absentes, bibliothèques en local) ; ajouts dans `wiam*.js` via registerMethod('post') et en enveloppant finishRace.
- Tests : navigateur sans écran, les voitures apprennent (100 % de la course en quelques générations), aucune erreur.

### 2026-11-24 — Claude — Exercices du cours (1 à 8) + renommage Wiam-*
- Renommage : 5-AvionAttaquant → Wiam-AvionAttaquant, 6-WiamSnake → Wiam-Snake, 7-Boids (WebGPU) → Wiam-BoidsWebGPU ; références mises à jour.
- Import des dossiers de départ du prof 5-1, 5-2, 5-3, 6, 7, 8 (commit fb97fa5 du dépôt du prof, sans ses solutions).
- Exercices des transparents faits dans 1-Seek, 2-PursueEvade, 3-Arrival, 4-Wander, 5-3, 6, 7, 8 ; une `N-Specification.md` par dossier avec les réponses aux questions du cours.
- Bugs du départ corrigés : separate() (6), boundaries() (6, 7), wander non appliqué (4), image de poisson (casse, 7), deux classes dans vehicle.js (3).
- Tests : navigateur sans écran, aucune erreur, 35 à 60 fps.

### 2026-11-24 — Claude — Wiam-BoidsWebGPU
- Murmuration de boids en WebGPU (inspirée de la démo jtsorlinis.github.io/BoidsWebGPU montrée en cours) : grille spatiale + tri sur la carte graphique, séparation / alignement / cohésion, oiseaux qui battent des ailes, ciel et champ, vues 2D / 3D, caméra libre.
- Fichiers : Wiam-BoidsWebGPU/{index.html, main.js, BoidSimulation.js, BoidRenderer.js, FlyCamera.js, Mat4.js, simShader.js, renderShader.js}.
- Exception aux règles : les oiseaux ne sont pas des Vehicle (calcul sur la carte graphique pour des centaines de milliers d'oiseaux). Nécessite Chrome ou Edge récent.

### 2026-11-24 — Claude — Tâches 1 et 2 dans 1-Seek + fichiers IA à la racine
- Fichiers : `1-Seek/{1-Specification.md, vehicle.js, rainbowGradient.js, controlPanel.js, sketch.js, index.html, style.css}`, `ARCHITECTURE.md`, `HANDOFF.md`, `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `.github/copilot-instructions.md`, `.cursorrules`.
- Fait : tableau de véhicules (TODO du prof), curseurs, debug synchronisé, dégradé arc-en-ciel (Vehicle + arrive).
- Vérifié dans Chrome : 1 à 200 véhicules à 60 FPS, D ↔ case synchronisées, accordéon.

### 2026-11-24 — Claude — README de Wiam
- En haut du README : le travail, les problèmes rencontrés et leurs solutions ; le README du cours en dessous.

### 2026-11-24 — Claude — Wiam-Snake
- Jeu de serpent autonome (p5.js 2.4) : Snake/Segment/PlayerSnake/EnemySnake/IntroSnake/NameDot/Food/Particle/ScorePopup (tous des Vehicle), SpriteFactory, MusicBox.
- Corrections : `screenToWorld` → `mouseToWorld` (conflit p5 2), cœur dessiné avec `bezierCurveTo`, le serpent vise un point loin dans la direction du cœur (plus de tremblement).

### 2026-11-24 — Claude — Wiam-AvionAttaquant
- Version autonome de l'app avion (copie des fichiers partagés, chemins corrigés), lien « Accueil » supprimé (404), GitHub Pages activé.

### 2026-11-23 — Claude — steering-p5
- Projet de départ : Vehicle (17 comportements de Reynolds), docs, fichiers IA, tâches 1 à 4.

