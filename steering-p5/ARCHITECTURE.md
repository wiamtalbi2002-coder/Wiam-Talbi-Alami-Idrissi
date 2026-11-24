# ARCHITECTURE.md

Règles d'architecture **obligatoires** du projet. Tout assistant IA (Claude,
Codex, Gemini, Copilot, Cursor…) et tout humain doit les respecter. En cas de
conflit avec une autre consigne, ce fichier fait foi, sauf instruction
explicite de l'utilisateur.

Références associées :
- [docs/steering-behaviors.md](docs/steering-behaviors.md) — les comportements de Craig Reynolds et leurs formules.
- [docs/p5-coding-standards.md](docs/p5-coding-standards.md) — style de code p5.js.

---

## 1. Les quatre règles fondamentales

### Règle 1 — Une classe maximum par fichier
- Un fichier `.js` contient **au plus une classe** de premier niveau.
- Le fichier porte **le nom exact de la classe** : `class Ship` → `Ship.js`.
- Exception : une **classe interne** (utilisée uniquement à l'intérieur de la
  classe principale, non référencée ailleurs) peut rester dans le même fichier.
- `sketch.js` ne contient **aucune classe** : seulement `setup()`, `draw()`,
  les callbacks p5 (`keyPressed`, `windowResized`…) et de petites fonctions.

### Règle 2 — Tout élément graphique animé est un `Vehicle`
- Tout ce qui bouge à l'écran est une instance de `Vehicle`
  (`shared/Vehicle.js`) **ou d'une sous-classe**.
- Son mouvement est produit **uniquement par des steering behaviors** : des
  forces passées à `applyForce()`, puis `update()`. On ne modifie jamais
  `pos` directement pour animer (exceptions tolérées : téléportation
  `wrapEdges()`, réinitialisation, placement initial).
- Même un élément qui **tourne, pulse ou change de couleur** sur place
  est un `Vehicle` dès qu'il a une position à l'écran (ex. le dégradé de la
  Tâche 2 dont le centre suit la souris en Arrival).

### Règle 3 — Les éléments fixes qui *pourraient* bouger sont aussi des `Vehicle`
- Obstacles, cibles, bonus, murs mobiles, points de passage… héritent de
  `Vehicle` (voir `shared/Obstacle.js` : `maxSpeed = 0` par défaut).
- Ainsi, rendre un obstacle mobile = lui donner une vitesse et des
  comportements, sans changer d'architecture.

### Règle 4 — Objets spécialisés = sous-classes de `Vehicle`
- Joueur, ennemi, vaisseau, missile, score animé, particule, prédateur,
  proie… → `class Missile extends Vehicle` dans `Missile.js`.
- La sous-classe redéfinit :
  - `applyBehaviors(...)` : la **sélection d'action** (quels comportements,
    quels poids, quelles priorités) ;
  - `show()` : le rendu (appeler `this.drawDebug()` si `Vehicle.debug`) ;
  - `drawDebug()` si besoin (appeler `super.drawDebug()` d'abord).
- Elle ne réimplémente **jamais** la physique (`update`, `applyForce`) sauf
  pour l'étendre via `super.update()`.

### Ce qui n'est PAS un `Vehicle`
- Les **structures de données de navigation** : `Path`, `FlowField`, grilles,
  graphes. Ce sont des repères, pas des agents.
- Les **éléments d'interface DOM** : `ControlPanel`, boutons, curseurs.
- Le **fond** statique (couleur unie).

---

## 2. Modèle de véhicule (Reynolds 1999)

```
Vehicle
  pos, vel, acc          p5.Vector
  mass                   masse (accélération = force / masse)
  maxSpeed               vitesse maximale (troncature de vel)
  maxForce               force de pilotage maximale (troncature des forces)
  r                      rayon englobant
```

Hiérarchie du mouvement, et où elle vit dans le code :

| Niveau (Reynolds) | Rôle | Dans le code |
|---|---|---|
| Sélection d'action | Choisir le but | `applyBehaviors()` de la sous-classe, ou `sketch.js` |
| Pilotage (steering) | Calculer une force | Méthodes de `Vehicle` : `seek()`, `arrive()`… |
| Locomotion | Intégrer la force | `applyForce()` + `update()` |

Boucle standard dans `draw()` :

```js
vehicles.forEach((v) => {
  v.applyBehaviors(vehicles /*, cibles, obstacles… */);
  v.update();
  v.show();
});
```

### Contrat des comportements
- Chaque comportement est une méthode de `Vehicle` qui **renvoie un
  `p5.Vector`** (la force de pilotage), déjà limitée à `maxForce`.
- Un comportement **n'applique pas** sa force lui-même : c'est
  `applyBehaviors()` qui pondère et applique.
- Formule de base : `steering = desired_velocity − velocity`.
- Un nouveau comportement générique va dans `Vehicle.js`, documenté par un
  commentaire `@behavior Nom — description` (repris automatiquement dans le
  README). Un comportement propre à un seul type d'objet va dans la
  sous-classe.

### Combinaison des comportements
- **Somme pondérée** (par défaut) : `applyForce(seek.mult(1))`,
  `applyForce(separate.mult(1.5))`…
- **Priorité** : `this.prioritized([avoid, separate, seek])` ajoute les
  forces dans l'ordre jusqu'à épuiser `maxForce` (l'évitement d'abord).

### Comportements disponibles dans `Vehicle.js`
Seek, Flee, Arrival, Pursuit, Evasion, Offset pursuit, Wander, Containment
(`boundaries`), Obstacle avoidance, Path following (avec `Path`), Flow field
following (avec `FlowField`), Unaligned collision avoidance, Separation,
Alignment, Cohesion, Flocking, Leader following, plus `prioritized()`.
Détails et formules : [docs/steering-behaviors.md](docs/steering-behaviors.md).

---

## 3. Arborescence

```
.
├── index.html                 Page d'accueil (GÉNÉRÉE, ne pas éditer)
├── README.md                  Sections AUTO générées + parties manuelles
├── ARCHITECTURE.md            Ce fichier
├── HANDOFF.md                 Passage de relais entre assistants IA
├── 1-Specification.md         Cahier des charges (tâches)
├── AGENTS.md / CLAUDE.md / GEMINI.md / .github/copilot-instructions.md / .cursorrules
├── docs/                      Références (Reynolds, style p5)
├── lib/p5.min.js              p5.js 2.4.0 (local, fonctionne hors-ligne)
├── shared/                    Code commun à toutes les applications
│   ├── Vehicle.js             Classe mère de tout élément animé
│   ├── Obstacle.js            Vehicle immobile par défaut
│   ├── Path.js, FlowField.js  Structures de navigation
│   └── ui/ControlPanel.js + control-panel.css   Panneau accordéon
├── apps/NN-nom-court/         Une application = un dossier
│   ├── index.html             <title> et <meta description> lus par le README
│   ├── sketch.js              setup/draw, sans classe
│   └── MaClasse.js            Sous-classes de Vehicle propres à l'app
└── scripts/                   update-readme.mjs, dev.mjs
```

### Créer une nouvelle application
1. Dossier `apps/NN-nom-court/` (NN = numéro de tâche sur 2 chiffres).
2. Copier un `index.html` existant ; mettre à jour `<title>` et
   `<meta name="description">` (ils alimentent le README et l'accueil).
3. Charger les scripts dans l'ordre : `p5.min.js` → `shared/Vehicle.js` →
   autres classes partagées → classes de l'app (mères avant filles) →
   `sketch.js` en dernier.
4. Ajouter la tâche dans `1-Specification.md` avec `**Statut :**` et
   `**Application :**`.
5. Lancer `npm run readme` (ou laisser tourner `npm run dev`).
6. Mettre à jour `HANDOFF.md`.

### Pourquoi des `<script>` classiques et pas des modules ES ?
p5.js en **mode global** expose `createVector`, `width`, `random`… comme
globales. Les classes, chargées par `<script>` dans l'ordre, les utilisent
directement. Les applications s'ouvrent donc avec n'importe quel serveur
statique (ou l'extension Live Server de VS Code), sans bundler.
Ne pas créer d'objets p5 (vecteurs, couleurs) **avant** `setup()`.

---

## 4. Conventions communes à toutes les applications

- **Panneau de réglages** : `ControlPanel` en haut de l'écran,
  semi-transparent, repliable (accordéon). Tous les curseurs y vont.
- **Debug** : touche **D** (bascule) + case « Debug » **synchronisées** via
  `panel.addDebugToggle()` et `panel.toggleDebug()` dans `keyPressed()`.
  État global : `Vehicle.debug`. En debug, le **vecteur vitesse est dessiné
  en rouge** (`Vehicle.drawDebug()`) ; les sous-classes peuvent ajouter
  d'autres éléments (cibles, rayons) en blanc/gris.
- **Plein écran** : `createCanvas(windowWidth, windowHeight)` +
  `windowResized()`.
- **Paramètres** lus depuis les curseurs dans `draw()` ou via le callback
  `onChange` de `addSlider()` — pas de nombres magiques dupliqués.
- **Performance** : comportements de groupe en O(n²) acceptables jusqu'à
  ~300 véhicules ; au-delà, ajouter une grille spatiale (`SpatialGrid.js`).

---

## 5. Documentation et passage de relais

- `README.md` : les sections entre `<!-- AUTO:…:START -->` et
  `<!-- AUTO:…:END -->` sont **générées** par `scripts/update-readme.mjs`
  (applications, classes, comportements, tâches, arborescence, état).
  Ne jamais les éditer à la main.
- `HANDOFF.md` : **mis à jour après chaque opération** (création,
  modification, correction, décision). C'est la mémoire partagée entre
  assistants IA.
