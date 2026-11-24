# 6-ObstacleAvoidance — Spécification

Touches : **v** véhicule suiveur, **w** véhicule wander, **f** 10 véhicules depuis la gauche, **c** effacer les obstacles, **d** debug. Clic sur le canvas = obstacle.

| Exercice | Statut |
|---|---|
| Correction de `separate()` : `maxspeed`, `velocity`, `maxforce` n'existent pas → NaN | ✅ |
| Correction de `boundaries()` : renvoyait la vitesse désirée au lieu de la force | ✅ |
| Avoid amélioré : vecteurs `ahead`, `ahead2` (moitié) et position du véhicule | ✅ |
| Longueur dynamique : `ahead = normalize(vel) × |vel| / maxSpeed × distance` | ✅ |
| Debug : ahead (jaune), ahead2 (violet), points, zone d'évitement, force (orange), vitesse (rouge) | ✅ |
| L'obstacle menacé devient rouge | ✅ |
| Véhicules wander (verts) qui évitent les obstacles et réapparaissent de l'autre côté | ✅ |
| Cercle englobant dessiné autour de chaque véhicule | ✅ |
| Les véhicules s'évitent entre eux : chacun est un obstacle placé à sa position **future** (prédiction en frames, curseur) | ✅ |
| Séparation (poids réglable) | ✅ |
| Curseurs : vitesse, force, regard devant, poids avoid / arrive / wander / séparation | ✅ |

## Questions du cours

- **Pourquoi deux vecteurs ahead ?** Avec un seul point loin devant, un obstacle proche sur le côté passe « entre » le véhicule et le point. ahead2 et la position couvrent ce cas.
- **Pourquoi une longueur dynamique ?** Un véhicule lent n'a pas besoin de regarder loin ; un rapide doit anticiper plus tôt.
- **Poids :** avoid (0,3) doit être plus fort que arrive (0,1), sinon le véhicule traverse l'obstacle pour rejoindre la souris.

## Fichiers

`vehicle.js` (Vehicle), `obstacle.js` (Obstacle), `controlPanel.js`, `sketch.js`. La classe Target inutilisée du départ a été retirée.
