# ARCHITECTURE.md

Règles **obligatoires** de ce dépôt (fork du cours de Michel Buffa sur les steering behaviors). Tout assistant IA (Claude, Codex, Gemini, Copilot, Cursor…) et tout humain doit les respecter.

Références : l'article de Craig Reynolds « Steering Behaviors For Autonomous Characters » (GDC 1999, https://www.red3d.com/cwr/steer/gdc99/), résumé dans [steering-p5/docs/steering-behaviors.md](steering-p5/docs/steering-behaviors.md), et le style de code p5.js dans [steering-p5/docs/p5-coding-standards.md](steering-p5/docs/p5-coding-standards.md).

## 1. Les quatre règles

1. **Une classe maximum par fichier** (sauf classe interne). Le fichier porte le nom de la classe (`vehicle.js` → `Vehicle` dans les exemples du prof, `Snake.js` → `Snake` ailleurs). `sketch.js` ne contient aucune classe.
2. **Tout élément graphique animé est un `Vehicle`** (ou une sous-classe) et bouge **uniquement avec des steering behaviors** : `applyBehaviors()` → `applyForce()` → `update()` → `show()`.
3. **Les éléments fixes qui pourraient bouger** (obstacles, cibles, bonus…) sont aussi des `Vehicle` (avec `maxSpeed = 0` s'ils sont immobiles).
4. **Les objets spécialisés** (joueur, ennemi, vaisseau, missile, score animé…) sont des **sous-classes de `Vehicle`** qui redéfinissent `applyBehaviors()` et `show()`.

Ne sont pas des Vehicle : les structures de données (chemin, champ de vecteurs), l'interface DOM (panneau de curseurs), le fond statique, le son.

## 2. Le modèle de véhicule (Reynolds)

- Attributs : `pos`, `vel`, `acc`, `maxSpeed`, `maxForce`, `r`.
- Formule de base : **force = vitesse désirée − vitesse actuelle**, limitée à `maxForce`.
- Un comportement **renvoie** une force (`p5.Vector`) ; c'est `applyBehaviors()` qui les pondère et les applique.
- Comportements standards : seek, flee, pursue, evade, arrive, wander, obstacle avoidance, containment, path following, flow field, separation, alignment, cohesion (flocking), leader following.

## 3. Structure du dépôt

- `1-Seek/` … `4-Wander/` : exemples du prof (et leurs corrections). Chaque dossier est autonome : `index.html`, `libraries/` (p5.js 1.7), `vehicle.js`, `sketch.js`, et une spécification `N-Specification.md` quand on y ajoute des tâches.
- `5-AvionAttaquant/` : l'avion attaquant, la cible qui se défend (version autonome, p5.js 2.4).
- `6-WiamSnake/` : le jeu de serpent (version autonome, p5.js 2.4).
- `steering-p5/` : le premier projet complet (classe `Vehicle` partagée, tâches 1 à 4, docs, README automatique).

Pour un nouvel exercice : un nouveau dossier `N-Nom/` autonome (il ne charge jamais de fichiers d'un autre dossier, sinon il ne marche pas sur GitHub Pages), avec sa spécification `N-Specification.md`.

## 4. Conventions communes

- Panneau de curseurs **en haut de l'écran**, **semi-transparent**, **repliable en accordéon**.
- **Debug** : touche **D** + case à cocher **synchronisées** ; en debug, les **vecteurs vitesse sont en rouge** (`Vehicle.debug`).
- Canvas plein écran : `createCanvas(windowWidth, windowHeight)` + `windowResized()`.
- Lancer en local : `python -m http.server 8090` à la racine, puis ouvrir `http://localhost:8090/<dossier>/`.

## 5. Attention aux versions de p5.js

- Les dossiers du prof utilisent **p5.js 1.7** ; `steering-p5`, `5-AvionAttaquant` et `6-WiamSnake` utilisent **p5.js 2.4**.
- En p5.js 2 : il y a déjà une fonction globale `screenToWorld` (ne pas en créer une avec ce nom), `bezierVertex` prend un point par appel, et `preload()` n'existe plus (utiliser `async setup()`).

## 6. Documentation et passage de relais

- `HANDOFF.md` : **mis à jour après chaque opération** (journal, état actuel, prochaines étapes).
- `README.md` : en haut, la présentation de Wiam ; en dessous, le README original du cours.
