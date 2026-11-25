# Wiam-9-VoituresBuffa — des voitures qui apprennent à conduire

Version améliorée de `9-VoitureSuitCircuit genetic algo` de Michel Buffa.
Lancer : `python -m http.server 8090` à la racine, puis `http://localhost:8090/Wiam-9-VoituresBuffa/`.
Marche sans Internet (p5.js 1.7 local, pas de TensorFlow).

## L'idée : la neuroévolution

- Chaque voiture a un **réseau de neurones** : entrées = ce que voient ses capteurs (rayons) + sa vitesse ; sorties = direction et vitesse souhaitées.
- Les sorties deviennent une **vitesse désirée**, puis une force de **steering** : `force = désirée − vitesse`, limitée à `maxForce`. C'est le lien avec Craig Reynolds : l'IA ne pilote pas la voiture directement, elle choisit une vitesse désirée.
- Personne n'entraîne le réseau (pas de rétropropagation) : c'est un **algorithme génétique** qui fait évoluer ses poids. Les voitures qui vont le plus loin ont plus d'enfants, les enfants sont des copies mutées.

## Bugs et limites trouvés dans la version de départ

| Problème | Conséquence | Ma correction |
|---|---|---|
| `console.log(outputs)` dans `predict()` | 100 voitures × 60 images = 6000 messages/s, tout rame | Supprimé (réseau réécrit) |
| TensorFlow.js pour un tout petit réseau | Créer des tenseurs à chaque image coûte plus que le calcul | Réseau en JavaScript pur (`neuralNetwork.js`) |
| Fitness `2^checkpoints` | Au-delà de ~1000 checkpoints : `Infinity`, normalisation → `NaN`, sélection cassée | `progression² × bonus de rapidité` |
| `finished` n'est jamais mis à `true` | Une voiture parfaite tourne sans fin, la génération ne se termine pas | Course de 2 tours, puis arrivée |
| Checkpoint validé par la distance à la **droite** infinie | Une voiture alignée avec le checkpoint, de l'autre côté du circuit, le valide | Distance au **segment** |
| Mutation `w + randomGaussian()` (écart-type 1) | Sauts énormes : un bon cerveau est souvent détruit | Amplitude réglable (0,3 par défaut) |
| Pas d'élitisme | Le meilleur est muté aussi : le record peut redescendre | Les meilleurs sont gardés intacts (curseur Élites) |
| Pas de vitesse en entrée | Le réseau ne peut pas savoir s'il doit freiner | Vitesse ajoutée aux entrées |
| Voitures dessinées `cycles + 1` fois par image | Calcul inutile | Dessin une fois par image |
| Chaque rayon testé contre les 120 murs | Lent | Seulement les murs proches du checkpoint courant |

## Ce que j'ai ajouté

| Ajout | Pourquoi |
|---|---|
| 🧠 Cerveau de la voiture en tête dessiné en direct | Voir les rayons s'allumer et la décision « ← gauche / droite → » changer |
| 📈 Courbe de progrès (meilleure et moyenne) par génération | La preuve que l'algorithme apprend |
| Croisement des parents (case) | Mélanger deux bons cerveaux ; on peut comparer avec / sans |
| Couleurs héritées (petite dérive) | On voit les familles gagnantes envahir la population : c'est la sélection naturelle |
| 🏁 Mode « Je conduis » (flèches) | Faire la course contre l'IA avec la même physique de steering ; meilleur tour et crashs |
| Records fêtés (confettis = `Confetti extends Vehicle`) | Record de distance, puis record de tour une fois la course réussie |
| Télécharger / charger / reprendre le champion | Garder un cerveau entraîné (fichier JSON et sauvegarde du navigateur) |
| Curseurs : population, mutation, élites, portée, durée de vie, sinuosité, largeur, capteurs, neurones cachés, vitesse de simulation | Expérimenter |
| Nouveau circuit à chaque génération (case) | Avec : la voiture apprend à **conduire** (généralise). Sans : elle **apprend par cœur** un circuit |

## Expériences à montrer

1. **Élites 0 vs 2** : sans élitisme, la courbe rose monte puis redescend.
2. **Croisement oui / non** : comparer la vitesse d'apprentissage.
3. **Amplitude de mutation 1,5** (comme Buffa) **vs 0,3** : les grosses mutations cassent les bons cerveaux.
4. **Nouveau circuit décoché** : apprentissage plus rapide, mais le champion échoue sur un autre circuit (touche N).
5. **2 neurones cachés vs 10** : un cerveau trop petit n'arrive pas à tout gérer.

## Fichiers (une classe par fichier)

`vehicle.js` (Vehicle), `car.js` (Car extends Vehicle), `playerCar.js` (PlayerCar extends Vehicle), `confetti.js` (Confetti extends Vehicle), `neuralNetwork.js`, `population.js` (algorithme génétique), `track.js`, `boundary.js`, `ray.js`, `brainView.js`, `fitnessChart.js`, `controlPanel.js`, `sketch.js`.

Touches : **D** debug (rayons de toutes les voitures + vitesses en rouge, synchronisé avec la case), **N** nouveau circuit, **R** recommencer, **flèches** ta voiture.
