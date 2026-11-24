# Bonnes pratiques de code p5.js

Synthèse du **guide de style officiel p5.js**
(<https://github.com/processing/p5.js/blob/main/contributor_docs/documentation_style_guide.md>)
et des pratiques courantes d'organisation en fichiers multiples, adaptées à
ce projet. Version de p5.js : **2.4.0** (copie locale dans `lib/`).

## Organisation
- Mode **global** p5 (`setup`, `draw`, `keyPressed`…) dans `sketch.js`.
- Une classe par fichier, fichier nommé comme la classe (voir
  [ARCHITECTURE.md](../ARCHITECTURE.md)).
- Ordre des `<script>` dans `index.html` : p5 → classes mères → classes
  filles → `sketch.js`.
- Ne pas appeler les fonctions p5 (`createVector`, `color`, `random`…) au
  niveau supérieur d'un fichier : seulement dans `setup()`, `draw()` ou des
  méthodes appelées depuis eux.
- Médias dans `assets/` ; en p5 2.x on charge avec `async setup()` +
  `await loadImage(...)` (il n'y a plus de `preload()`).

## Espaces et mise en forme
- Indentation de **2 espaces**.
- Espace avant l'accolade ouvrante : `function setup() {`.
- Espace avant la parenthèse des structures de contrôle : `if (x > 0) {` ;
  pas d'espace entre un nom de fonction et sa parenthèse : `doStuff();`.
- Espaces autour des opérateurs : `let y = x + 5;`.
- `} else {` sur la même ligne.
- Point-virgule à la fin de chaque instruction.
- Lignes de moins de 80 caractères autant que possible.

## Nommage
- `camelCase` pour variables, fonctions, instances : `maxSpeed`.
- `PascalCase` pour les classes : `class Ship`.
- Noms descriptifs (pas de `f(x, y)`), pas de `_` en préfixe/suffixe.

## Variables
- Déclarer avec `let` (le guide p5 évite `var` et `const`). Les scripts Node
  (`scripts/*.mjs`) peuvent utiliser `const`.
- Une variable par `let`, déclarée au plus près de son usage.
- `n += 1;` plutôt que `n++;`.

## Chaînes
- Guillemets simples : `'Bonjour'`.
- Gabarits pour l'interpolation : `` `${name} a ${score} points` ``.

## Conditions
- `===` et `!==` uniquement.
- Comparaisons explicites : `if (Vehicle.debug === true)`,
  `if (items.length > 0)`.
- Parenthèses quand on mélange les opérateurs logiques.
- Accolades pour tout bloc multiligne ; pas de `else` après un `return`.

## Itération
- `for` pour un nombre fixe de répétitions.
- `forEach()`, `map()`, `filter()` pour parcourir des tableaux.

## Fonctions
- Déclarations `function foo() {}`.
- Paramètres par défaut, placés en dernier : `seek(target, arrival = false)`.
- Ne pas réassigner les arguments.
- Fonctions fléchées pour les callbacks anonymes, toujours avec
  parenthèses : `(v) => v * 2`.

## Classes
- Syntaxe `class` et `extends` ; ne pas toucher au `prototype`.
- Pas de constructeur vide ni de constructeur qui n'appelle que `super()`.
- Appeler `super.méthode()` pour étendre plutôt que copier-coller.

## Rendu
- Encadrer toute modification d'état graphique par `push()` / `pop()`.
- Éviter le chaînage de méthodes de dessin ; une instruction par ligne.
- Pour les dégradés et effets avancés, `drawingContext` (API Canvas 2D)
  est autorisé, entouré de `save()` / `restore()`.

## Commentaires
- `//` pour les commentaires, sur leur propre ligne, au-dessus du code.
- Commencer par une majuscule et finir par un point.
- En-tête de chaque fichier : rôle de la classe en 1–3 lignes.
- Tag `@behavior Nom — description` dans `Vehicle.js` pour chaque
  comportement (repris dans le README).

## Vecteurs (p5.Vector)
- Méthodes d'instance (`v.add(w)`) **modifient** `v` ; utiliser les versions
  statiques (`p5.Vector.add(v, w)`) ou `copy()` pour ne pas altérer l'état.
- `setMag()`, `limit()`, `heading()`, `rotate()`, `p5.Vector.fromAngle()`.
