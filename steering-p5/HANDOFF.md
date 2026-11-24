# HANDOFF.md

Document de passage de relais entre assistants IA (Claude, Codex, Gemini,
Copilot, Cursor…) et humains. **À mettre à jour après chaque opération.**

## Comment reprendre le projet
1. Lire ce fichier en entier, puis `ARCHITECTURE.md`, puis
   `1-Specification.md`.
2. `npm run dev` → <http://localhost:8080>.
3. Avant de rendre la main : ajouter une entrée en tête du journal ci-dessous,
   mettre à jour « État actuel » et « Prochaines étapes », puis
   `npm run readme`.

Modèle d'entrée de journal :

```
### AAAA-MM-JJ — <agent> — <titre court>
- Fichiers : …
- Fait : …
- Vérifié : …
- Reste / risques : …
```

## État actuel
- Socle en place : `Vehicle` (17 comportements de Reynolds + combinaison par
  priorité), `Obstacle`, `Path`, `FlowField`, `ControlPanel` (accordéon).
- Tâche 1 ✅ `apps/01-vaisseaux/` — testée dans Chrome headless.
- Tâche 2 ✅ `apps/02-degrade-arc-en-ciel/` — testée dans Chrome headless.
- Tâches 3 et 4 ✅ `apps/03-avion-attaquant/` — jeu de guerre **en 3D
  (WEBGL)** : 1 avion invincible piloté « comme un humain » (patrouille /
  attaque en piqué / dégagement, temps de verrouillage, inclinaison) contre
  des vagues de chars 3D (4 PV, evade + dodge, riposte) escortés de
  fantassins (`Soldier`) ; explosions 3D, caméra qui suit l'action,
  radio + voix (`RadioChatter`). Testée dans Chrome headless (SwiftShader) :
  5000 frames simulées sans erreur ni NaN, captures d'écran vérifiées. Sons
  et voix non écoutés (headless).
- `shared/Alarm.js` : alarme Web Audio réutilisable (non `Vehicle`).
- `shared/WarSounds.js` : sons de guerre Web Audio (explosion, mitrailleuse,
  fusil, missile, impact, radio, moteur) ; réutilise l'AudioContext et le
  réglage `enabled` d'une `Alarm`.
- README auto opérationnel (watch, hook pre-commit, tâche VS Code, action
  GitHub).
- **Ce PC n'a pas Node** : `npm run dev` / `npm run readme` impossibles.
  Lancer le serveur avec `python -m http.server 8080` à la racine, puis
  <http://localhost:8080>.

## Prochaines étapes
- Écouter sons et voix radio dans un vrai navigateur (volumes, débit de la
  voix) et ajuster `WarSounds` / `RadioChatter` si besoin.
- Vérifier la fluidité (FPS) sur ce PC avec beaucoup de fantassins et de
  particules ; baisser `maxParticles` ou `soldiersPerTank` si ça rame.
- Vérifier à la main : D ↔ case Debug, cases Tâche 4 / Mitrailleuse /
  Secousses / Son / Voix radio.
- Régénérer le README (`npm run readme`) sur une machine avec Node : les
  sections AUTO ne listent pas encore les Tâches 3 et 4.
- Recevoir la spécification de la tâche suivante.
- Wall following non implémenté dans `Vehicle` (à ajouter si une tâche le
  demande).

## Décisions
- **p5.js 2.4.0** copié dans `lib/` (hors-ligne, version figée). En 2.x,
  `preload()` n'existe plus : utiliser `async setup()` + `await`.
- **Scripts classiques** (pas de modules ES) : mode global p5, ordre de
  chargement explicite dans chaque `index.html`.
- `Vehicle.debug` est **statique** (un seul mode debug global) ;
  `ControlPanel.addDebugToggle()` / `toggleDebug()` garantissent la
  synchronisation touche D ↔ case à cocher.
- Les comportements **renvoient** des forces déjà limitées à `maxForce` ;
  la sous-classe pondère dans `applyBehaviors()`.
- `Path`, `FlowField`, `ControlPanel` ne sont pas des `Vehicle` (structures
  de données / DOM), conformément à ARCHITECTURE.md. `Alarm`, `WarSounds`
  et `RadioChatter` non plus (son / DOM).
- App 03 en **WEBGL** : le pilotage reste en 2D (steering behaviors sur
  x, y) ; l'altitude `z` est un attribut ajouté par les sous-classes, avec
  sa propre force verticale bornée (avion) ou un rapprochement progressif
  (missiles, balles). Arbres et ruines = décor statique (pas des `Vehicle` :
  ils ne bougent jamais et n'interagissent pas).
- Le README n'inclut **pas d'horodatage** (sinon il changerait à chaque
  exécution) : l'état provient de ce fichier.

## Pièges connus
- Ne pas créer de `p5.Vector` ou de `color()` hors de `setup()`/`draw()`.
- Accélération max = 0 → plus aucun pilotage possible ; la Tâche 1 garde un
  `wrapEdges()` de sécurité.
- `index.html` à la racine est **généré** : le modifier via
  `scripts/update-readme.mjs`.
- Au premier chargement, p5.js 2.4 cherche ses traductions (FES) :
  `./en-US.json` (404 normal) puis le CDN jsdelivr, puis les met en cache
  dans localStorage. Ces erreurs réseau dans la console ne viennent pas du
  projet et sont sans effet (hors-ligne, les messages restent en anglais).
- Les curseurs modifiés par code (`slider.elt.value = …`) ne mettent pas à
  jour le libellé de valeur : déclencher `dispatchEvent(new Event('input'))`.
- Mode global p5 : ne jamais nommer une variable globale comme une
  fonction p5 (ex. `plane` masque `plane()` en WEBGL → l'avion s'appelle
  `aircraft` dans `sketch.js`).
- En WEBGL : pas de `text()` sans police chargée (texte en DOM ou dans un
  `createGraphics` utilisé comme texture) ; pas de `setLineDash`
  (`drawingContext` est un contexte WebGL) ; une texture `plane()` vue
  depuis la caméra inclinée doit être retournée (`scale(1, -1, 1)`).

## Journal des opérations

### 2026-11-24 — Claude — Panneau de réglages compact (app 03)
- Fichiers : `apps/03-avion-attaquant/game.css`, `HANDOFF.md`.
- Fait : demande « make this shorter ». Surcharge des styles
  `.control-panel*` dans `game.css` (police 12 px, marges réduites,
  curseurs de 80 px, libellés sans largeur fixe) : le panneau passe
  d'environ 220 px à 65 px de haut (3 lignes à 1400 et 1920 px de large).
  `shared/ui/control-panel.css` inchangé : les autres apps ne bougent pas.
- Vérifié : captures Chrome headless à 1400 et 1920 px de large.

### 2026-11-24 — Claude — 3D, fantassins, pilote humain, radio
- Fichiers : `apps/03-avion-attaquant/{Soldier.js,RadioChatter.js,
  game.css}` (créés), `{Plane.js,Target.js,Missile.js,Bullet.js,
  Particle.js,ScorePopup.js,sketch.js,index.html}`,
  `shared/WarSounds.js` (fusil, radio), `1-Specification.md`, `HANDOFF.md`.
- Fait : demande « plus humain, 3D, plus réel comme une vraie guerre » ;
  choix validés : vraie 3D WEBGL + soldats + pilote humain + radio/voix.
  Rendu WEBGL (caméra cinéma, lumières, sol texturé, arbres, ruines),
  altitude `z`, avion à états (patrouille / attaque / dégagement),
  `Soldier` (escorte, panique, tir), `RadioChatter` (DOM + speechSynthesis),
  interface en HTML (`game.css`).
- Vérifié : Chrome headless + SwiftShader — aucune erreur console ; 5000
  frames simulées (45 chars, 36 fantassins, 6 vagues, pas de NaN) ; captures
  d'écran (orientation caméra, chars, explosion, « +100 » lisible).
  Corrigés pendant le test : variable `plane` qui masquait `plane()`,
  texte « +100 » à l'envers, bord visible du terrain, accumulation des
  fantassins (113 → 26 sur 5000 frames).
- Reste / risques : sons, voix et fluidité non vérifiés en vrai.

### 2026-11-24 — Claude — Jeu de guerre : précision, vagues, sons
- Fichiers : `shared/WarSounds.js` (créé), `shared/CrashSound.js`
  (supprimé), `apps/03-avion-attaquant/{Particle.js,ScorePopup.js,
  Bullet.js}` (créés), `{Plane.js,Target.js,sketch.js,index.html}`,
  `1-Specification.md`, `HANDOFF.md`.
- Fait : demande « plus réaliste, fun, comme un vrai jeu de guerre ;
  l'avion doit tous les abattre avec précision ; vrais sons de guerre ».
  Missiles tirés à portée et dans l'axe, `maxForce` 0,9, reverrouillage ;
  mitrailleuse à tir anticipé ; chars 4 PV avec tourelle ; vagues + score +
  précision ; explosions en `Particle` (Vehicle), `ScorePopup` (Vehicle) ;
  secousses ; terrain Perlin + cratères dans un `createGraphics` (fond) ;
  `WarSounds` (explosion, mitrailleuse, missile, impact, moteur).
- Vérifié : Chrome headless — aucune erreur console au chargement ; page de
  test temporaire (supprimée) exécutant 4000 frames : 236 tirs, 123 au but,
  45 chars détruits, 6 vagues, 265 particules max, pas de NaN. Capture
  d'écran : explosion, « +100 », traçantes, barre de vie OK. Une classe par
  fichier.
- Reste / risques : sons non écoutés ; le terrain (et ses cratères) est
  régénéré au redimensionnement de la fenêtre.

### 2026-11-24 — Claude — Détection de l'avion améliorée
- Fichiers : `apps/03-avion-attaquant/{Plane.js,sketch.js}`,
  `1-Specification.md`, `HANDOFF.md`.
- Fait : retour « l'avion détecte mal / ça ne se voit pas / l'alarme sonne
  rarement ». `Plane.canSee()` compte le bord de la cible (rayon + r) ;
  verrou conservé tant que la cible reste visible (`switchRatio` 0,7) ;
  `Plane.drawDetection()` (hors debug) : cercle rouge pulsant, ligne
  pointillée, viseur tournant ; alarme sur chaque nouvelle cible détectée
  (`plane.newDetection`) au lieu du seul front « aucune → une ».
- Vérifié : une classe par fichier. Pas de test navigateur.
- Risque : avec beaucoup de cibles, l'alarme peut sonner toutes les 3 s.

### 2026-11-24 — Claude — Bruit de crash
- Fichiers : `shared/CrashSound.js` (créé),
  `apps/03-avion-attaquant/{index.html,sketch.js}`, `1-Specification.md`,
  `HANDOFF.md`.
- Fait : `CrashSound` (Web Audio : bruit blanc + filtre passe-bas qui se
  referme + sinus grave descendant, ~0,9 s) joué quand un missile de
  l'avion touche une cible. Partage l'AudioContext de `Alarm` (pas de
  second déblocage) et la case « Son ».
- Vérifié : une classe par fichier. Pas de test navigateur.

### 2026-11-24 — Claude — L'avion ne meurt plus
- Fichiers : `apps/03-avion-attaquant/{Plane.js,sketch.js}`,
  `1-Specification.md`, `HANDOFF.md`.
- Fait : demande « l'avion ne doit pas mourir ».
  Suppression des points de vie, de la barre de vie et de la réapparition ;
  touché, l'avion clignote seulement. Compteur « Avion abattu » remplacé
  par « Avion touché ».
- Vérifié : plus aucune référence à `health` / `respawn` dans `Plane.js`.
  Pas de test navigateur.

### 2026-11-24 — Claude — Tâches 3 et 4 : multi-cibles, alarme, riposte
- Fichiers : `shared/Alarm.js` (créé), `apps/03-avion-attaquant/`
  `{Missile.js,Plane.js,Target.js,sketch.js,index.html}`,
  `1-Specification.md`, `HANDOFF.md`.
- Fait : 5 cibles par défaut, l'avion attaque la plus proche ; alarme Web
  Audio (front montant, 3 s mini, déblocage au 1er clic/touche, case Son) ;
  `Missile.owner` ('plane' blanc / 'target' vert) ; riposte des cibles
  (`Target.tryFire`, curseur « Cadence riposte » 30–300, défaut 120) ;
  cibles qui ne fuient que l'avion et ses missiles ; 5 PV + barre de vie +
  clignotement + réapparition sur un bord pour l'avion ; HUD « Cibles
  touchées » / « Avion abattu » ; cercle de détection des cibles toujours
  visible en debug. Filtre des missiles corrigé : les missiles visant
  l'avion ne sont plus supprimés par `targets.includes(m.target)`.
- Vérifié : une seule classe par fichier. Pas de test navigateur.
- Reste / risques : Node absent → README non régénéré. Application non
  testée dans un navigateur.

### 2026-11-24 — Claude — Tâches 3 et 4 : avion attaquant
- Fichiers : `apps/03-avion-attaquant/index.html` (créé),
  `1-Specification.md`, `HANDOFF.md`. `Missile.js`, `Plane.js`,
  `Target.js` et `sketch.js` existaient déjà et n'ont pas été modifiés.
- Fait : page de l'application (scripts : p5 → Vehicle → ControlPanel →
  Missile → Plane → Target → sketch) ; Tâches 3 et 4 ajoutées à la
  spécification.
- Vérifié : une seule classe par fichier dans tout le projet.
- Reste / risques : Node absent de ce PC → README et `index.html` racine
  non régénérés ; serveur via `python -m http.server 8080`. Application non
  testée dans un navigateur.

### 2026-11-23 — Claude — Vérification navigateur + livraison
- Fichiers : `RainbowGradient.js` (fondu quadratique, couleurs plus vives),
  `lib/p5-license.txt`, `scripts/update-readme.mjs` (le mode `--watch`
  scrute chaque seconde au lieu de `fs.watch`, qui ratait les fichiers
  remplacés sous Linux), `.gitignore`.
- Vérifié aussi : README régénéré automatiquement par `npm run dev` et par
  le hook pre-commit (testé dans un dépôt git temporaire).
- Fait : test des deux applications dans Chrome headless (Playwright) et
  test de fumée de tous les comportements de `Vehicle` (pas de NaN).
- Vérifié : aucune erreur JavaScript du projet ; curseurs aux bornes
  (1/200, 0/20, 0/10) ; touche D ↔ case Debug synchronisées dans les deux
  sens ; accordéon repliable ; dégradé qui suit la souris en Arrival ;
  README idempotent (`npm run readme:check`).

### 2026-11-23 — Claude — Tâche 2 : dégradé arc-en-ciel
- Fichiers : `apps/02-degrade-arc-en-ciel/{index.html,sketch.js,RainbowGradient.js}`.
- Fait : `RainbowGradient extends Vehicle` (Arrival vers la souris),
  dégradé radial Canvas 2D, 12 curseurs + 3 cases.

### 2026-11-23 — Claude — Tâche 1 : vaisseaux
- Fichiers : `apps/01-vaisseaux/{index.html,sketch.js,Ship.js}`.
- Fait : `Ship extends Vehicle` (wander + boundaries + separation),
  curseurs nombre / vitesse / accélération, debug D + case.

### 2026-11-23 — Claude — README automatique
- Fichiers : `scripts/update-readme.mjs`, `scripts/dev.mjs`, `package.json`,
  `.githooks/pre-commit`, `.github/workflows/readme.yml`,
  `.vscode/tasks.json`.

### 2026-11-23 — Claude — Socle partagé
- Fichiers : `shared/Vehicle.js`, `shared/Obstacle.js`, `shared/Path.js`,
  `shared/FlowField.js`, `shared/ui/ControlPanel.js`,
  `shared/ui/control-panel.css`, `lib/p5.min.js`.

### 2026-11-23 — Claude — Documentation et consignes IA
- Fichiers : `ARCHITECTURE.md`, `docs/steering-behaviors.md`,
  `docs/p5-coding-standards.md`, `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`,
  `.github/copilot-instructions.md`, `.cursorrules`, `1-Specification.md`,
  `README.md`, `HANDOFF.md`.
- Sources : article de Craig Reynolds (GDC 1999) et guide de style p5.js.
