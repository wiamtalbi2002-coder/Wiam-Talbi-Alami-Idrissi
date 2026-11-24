# 5-3-PathFollowingComplex — Spécification

| Exercice | Statut |
|---|---|
| Circuit complexe (90 points) ou simple (celui du prof) — menu « type de circuit » | ✅ |
| Largeur du circuit réglable (défaut 35) | ✅ |
| 20 véhicules qui suivent le chemin + séparation (curseurs poids suivi / séparation) | ✅ |
| Touche **s** : véhicule rouge rapide (maxSpeed 7) | ✅ |
| Touche **w** : véhicule vert qui fait wander (pas de suivi de chemin) avec séparation | ✅ |
| Canvas plein écran, redimensionnement | ✅ |

## Question du cours

**Projection scalaire :** on projette la position future du véhicule sur chaque segment ; si le point projeté est à plus de la moitié de la largeur du chemin, on fait seek vers un point un peu plus loin sur le segment. Sinon, aucune force : le véhicule garde sa trajectoire.

5-1 (projection scalaire) et 5-2 (path following simple) sont des exemples à étudier : laissés tels quels.
