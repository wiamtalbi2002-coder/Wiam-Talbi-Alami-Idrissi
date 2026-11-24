# Steering behaviors — p5.js

Ensemble d'applications p5.js fondées sur les **steering behaviors** de
Craig Reynolds (« Steering Behaviors For Autonomous Characters », GDC 1999).

> Les sections entre marqueurs `AUTO` sont **régénérées automatiquement**
> par `scripts/update-readme.mjs` (via `npm run dev`, `npm run readme:watch`,
> le hook pre-commit, la tâche VS Code ou l'action GitHub). Le reste du
> fichier est éditable à la main.

## Démarrage rapide

```bash
npm run dev          # serveur http://localhost:8080 + README auto
```

Sans Node : ouvrir le dossier avec l'extension **Live Server** de VS Code,
ou `python -m http.server 8080`. p5.js 2.4.0 est inclus dans `lib/` (aucune
connexion requise).

Commandes :

| Commande | Effet |
|---|---|
| `npm run dev` | Serveur local + régénération du README à chaque modification |
| `npm run readme` | Régénère README.md et index.html une fois |
| `npm run readme:watch` | Surveillance seule |
| `npm run readme:check` | Échoue si README/index sont périmés (CI) |
| `npm install` | Active le hook git pre-commit (`.githooks/`) |

Mise à jour automatique du README, quatre déclencheurs :
1. `npm run dev` / `npm run readme:watch` pendant que vous travaillez ;
2. tâche VS Code lancée à l'ouverture du dossier (`.vscode/tasks.json` —
   accepter « Autoriser les tâches automatiques » la première fois) ;
3. hook **pre-commit** (après `npm install`, ou
   `git config core.hooksPath .githooks`) ;
4. **GitHub Action** `.github/workflows/readme.yml` à chaque push.

## Documentation

| Fichier | Contenu |
|---|---|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Règles obligatoires (Vehicle, une classe par fichier…) |
| [HANDOFF.md](HANDOFF.md) | Passage de relais entre assistants IA |
| [1-Specification.md](1-Specification.md) | Tâches demandées |
| [docs/steering-behaviors.md](docs/steering-behaviors.md) | Comportements de Reynolds et formules |
| [docs/p5-coding-standards.md](docs/p5-coding-standards.md) | Style de code p5.js |
| `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `.github/copilot-instructions.md`, `.cursorrules` | Consignes pour assistants IA |

## État du projet
<!-- AUTO:STATUS:START -->
**Dernière opération :** 2026-11-23 — Claude — Vérification navigateur + livraison

**Prochaines étapes :**

- Recevoir et implémenter la Tâche 3 (nouvelle app `apps/03-…/`).
- Wall following non implémenté dans `Vehicle` (à ajouter si une tâche le
  demande).

Détails : [HANDOFF.md](HANDOFF.md).
<!-- AUTO:STATUS:END -->

## Tâches
<!-- AUTO:TASKS:START -->
| Tâche | Statut | Application |
|---|---|---|
| Tâche 1 — Vaisseaux et panneau de réglages | ✅ Terminée | `apps/01-vaisseaux/` |
| Tâche 2 — Dégradé radial arc-en-ciel | ✅ Terminée | `apps/02-degrade-arc-en-ciel/` |
| Tâche 3 — À venir | ⏳ À faire | — |
<!-- AUTO:TASKS:END -->

## Applications
<!-- AUTO:APPS:START -->
| Application | Description | Classes |
|---|---|---|
| [Tâche 1 — Vaisseaux](apps/01-vaisseaux/index.html) | Flotte de 1 à 200 vaisseaux (wander + containment + separation) réglable par curseurs ; debug D / case à cocher. | `Ship` ← Vehicle |
| [Tâche 2 — Dégradé arc-en-ciel](apps/02-degrade-arc-en-ciel/index.html) | Dégradé radial arc-en-ciel animé dont le centre (un Vehicle) suit la souris en Arrival ; 12 curseurs de réglage. | `RainbowGradient` ← Vehicle |
<!-- AUTO:APPS:END -->

## Classes partagées
<!-- AUTO:SHARED:START -->
| Classe | Hérite de | Fichier |
|---|---|---|
| `FlowField` | — | `shared/FlowField.js` |
| `Obstacle` | Vehicle | `shared/Obstacle.js` |
| `Path` | — | `shared/Path.js` |
| `Vehicle` | — | `shared/Vehicle.js` |
| `ControlPanel` | — | `shared/ui/ControlPanel.js` |
<!-- AUTO:SHARED:END -->

## Comportements disponibles (`Vehicle`)
<!-- AUTO:BEHAVIORS:START -->
- Seek — se diriger vers une cible à vitesse maximale.
- Flee — s'éloigner d'une cible (option : distance de panique).
- Arrival — comme Seek mais ralentit dans slowingDistance.
- Pursuit — seek vers la position future d'un véhicule mobile.
- Evasion — flee depuis la position future d'un véhicule.
- Offset pursuit — suivre un véhicule à un décalage local.
- Wander — errance via un cercle projeté devant le véhicule.
- Containment — rester dans un rectangle (marge en pixels).
- Obstacle avoidance — cylindre d'anticipation devant le véhicule.
- Path following — rester dans le tube d'un Path.
- Flow field following — aligner la vitesse sur un FlowField.
- Unaligned collision avoidance — éviter les futurs croisements.
- Separation — s'écarter des voisins trop proches (force en 1/d).
- Alignment — adopter la direction moyenne des voisins.
- Cohesion — se diriger vers le centre des voisins.
- Flocking — séparation + alignement + cohésion pondérés.
- Leader following — arrival derrière le leader, s'écarter devant.
<!-- AUTO:BEHAVIORS:END -->

## Arborescence
<!-- AUTO:TREE:START -->
```text
.cursorrules
.githooks/pre-commit
.github/copilot-instructions.md
.github/workflows/readme.yml
.gitignore
.vscode/tasks.json
1-Specification.md
AGENTS.md
ARCHITECTURE.md
CLAUDE.md
GEMINI.md
HANDOFF.md
README.md
apps/01-vaisseaux/Ship.js
apps/01-vaisseaux/index.html
apps/01-vaisseaux/sketch.js
apps/02-degrade-arc-en-ciel/RainbowGradient.js
apps/02-degrade-arc-en-ciel/index.html
apps/02-degrade-arc-en-ciel/sketch.js
docs/p5-coding-standards.md
docs/steering-behaviors.md
index.html
package.json
scripts/dev.mjs
scripts/update-readme.mjs
shared/FlowField.js
shared/Obstacle.js
shared/Path.js
shared/Vehicle.js
shared/ui/ControlPanel.js
shared/ui/control-panel.css
```
<!-- AUTO:TREE:END -->

## Crédits
- Craig W. Reynolds, *Steering Behaviors For Autonomous Characters*, 1999 —
  <https://www.red3d.com/cwr/steer/gdc99/>
- [p5.js](https://p5js.org) (licence LGPL-2.1).
