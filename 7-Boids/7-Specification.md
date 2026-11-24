# 7-Boids — Spécification

Souris : glisser = ajouter des boids. Touches : **o** obstacle à la souris, **r** tailles aléatoires, **d** debug.

| Exercice | Statut |
|---|---|
| Changer la forme des boids : poisson (image), triangle, point (menu) | ✅ |
| Traînée derrière les boids (curseur 0 à 60) | ✅ |
| Cible (cercle) qui suit la souris par seek et **repousse** les boids : si distance < rayon + décalage, vitesse désirée opposée | ✅ |
| Touche **o** : obstacle (`Obstacle extends Boid`) que les boids évitent | ✅ |
| Curseurs dans le panneau accordéon (les sliders du départ se superposaient) | ✅ |
| Nombre de boids, vitesse max, rayon de la cible ; requin et sons activables | ✅ |
| Correction : nom d'image `niceFishtransparent.png` → `niceFishTransparent.png` (casse, sinon 404 sur GitHub Pages) | ✅ |
| Correction : `boundaries()` renvoyait la vitesse désirée au lieu de la force | ✅ |
| Correction : `avoid()` plantait sans obstacle | ✅ |

## Question du cours

**Les 3 règles de Reynolds :** séparation (ne pas se coller), alignement (même direction que les voisins), cohésion (aller vers le centre des voisins). Chacune ne regarde que les voisins dans le rayon de perception : le banc émerge sans chef.
