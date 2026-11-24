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

- `1-Seek/` : Tâches 1 et 2 ✅ (curseurs, debug D + case, dégradé arc-en-ciel qui suit la souris).
- `Wiam-AvionAttaquant/` ✅ : avion attaquant (pursue + missiles), cibles qui se défendent (evade, dodge, riposte), version 3D avec chars, soldats, radio, sons.
- `Wiam-Snake/` ✅ : jeu de serpent (intro WIAM en perles, musique Web Audio, ennemis, score, game over).
- `steering-p5/` ✅ : premier projet (Vehicle partagé, tâches 1 à 4, docs, README auto). Sa version de l'avion est plus ancienne que `Wiam-AvionAttaquant`.
- Fichiers IA à la racine : `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `.github/copilot-instructions.md`, `.cursorrules`.

## Prochaines étapes

- Attendre les prochaines consignes du prof (2-PursueEvade, 3-Arrival, 4-Wander…).
- Chaque nouvelle tâche : dans le dossier de l'exercice, avec sa `N-Specification.md`.

## Pièges connus

- Un dossier qui charge `../../...` ne marche pas une fois copié ailleurs : chaque dossier doit être autonome.
- Après un push, GitHub Pages peut montrer l'ancienne version quelques minutes (cache) : tester en fenêtre privée.
- Erreur 404 sur `fr.json` / `en-US.json` dans la console : normal, p5.js 2 cherche ses traductions.
- Ne pas copier le point final d'une phrase avec une commande (`8082.` → erreur de port).
- Si `localhost` répond 404 : un ancien serveur tourne depuis un autre dossier → utiliser un autre port ou `--directory`.

## Journal des opérations

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

