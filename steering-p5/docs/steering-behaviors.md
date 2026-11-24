# Steering behaviors — référence

Synthèse de **Craig W. Reynolds, « Steering Behaviors For Autonomous
Characters », Game Developers Conference 1999**
(<https://www.red3d.com/cwr/steer/gdc99/>), adaptée à ce projet. Les noms de
méthodes renvoient à `shared/Vehicle.js`.

## 1. Les trois niveaux du mouvement

1. **Sélection d'action** — stratégie, buts, plans (« va là-bas »).
2. **Pilotage (steering)** — calcul d'une trajectoire : produit une *force de
   pilotage* (le sujet de l'article).
3. **Locomotion** — mécanique du déplacement (pattes, roues, réacteur) qui
   transforme la force en mouvement.

Les comportements de pilotage sont **indépendants de la locomotion** : on peut
les réutiliser pour un vaisseau, un poisson ou un piéton.

## 2. Modèle de véhicule simple (point massique)

| Attribut | Rôle |
|---|---|
| `mass` | masse |
| `position` | vecteur |
| `velocity` | vecteur |
| `max_force` | norme maximale de la force de pilotage |
| `max_speed` | vitesse maximale |
| `orientation` | repère local, aligné sur la vitesse |

Intégration d'Euler, à chaque pas :

```
steering_force = truncate(steering_direction, max_force)
acceleration   = steering_force / mass
velocity       = truncate(velocity + acceleration, max_speed)
position       = position + velocity
```

Dans le code : `applyForce()` (division par la masse, cumul) puis `update()`.

## 3. Comportements individuels

| Comportement | Principe | Méthode |
|---|---|---|
| **Seek** | `desired = normalize(target − pos) × max_speed` ; `steering = desired − velocity` | `seek(target)` |
| **Flee** | Inverse de Seek : vitesse désirée opposée à la cible | `flee(target, panicDistance)` |
| **Pursuit** | Seek vers la position **future** de la cible : `pos_cible + vel_cible × T`, avec T proportionnel à la distance | `pursue(vehicle)` |
| **Evasion** | Flee depuis la position future de la cible | `evade(vehicle)` |
| **Offset pursuit** | Viser un point décalé dans le repère local de la cible (passer à côté, escorter) | `offsetPursuit(leader, offset)` |
| **Arrival** | Seek qui ralentit dans un rayon `slowing_distance` : `ramped = max_speed × (distance / slowing_distance)`, `clipped = min(ramped, max_speed)`, `desired = (clipped / distance) × offset` | `arrive(target)` |
| **Obstacle avoidance** | Un cylindre devant le véhicule (longueur ∝ vitesse, largeur = rayon) ; l'obstacle qui l'intersecte le plus tôt provoque une force latérale opposée | `avoidObstacles(obstacles)` |
| **Wander** | Petit déplacement aléatoire d'une cible contrainte sur un cercle projeté devant le véhicule → errance douce | `wander()` |
| **Path following** | Prédire la position future, la projeter sur le chemin ; si on sort du « tube » (rayon), seek vers le point projeté avancé le long du chemin | `followPath(path)` + `Path` |
| **Wall following** | Path following avec un décalage par rapport au mur | *à implémenter* (variante de `followPath`) |
| **Containment** | Sondes devant le véhicule ; si l'une sort de la zone autorisée, force de retour vers l'intérieur | `boundaries(margin)` |
| **Flow field following** | `desired = champ(pos_future) × max_speed` ; `steering = desired − velocity` | `followFlowField(field)` + `FlowField` |
| **Unaligned collision avoidance** | Calcul du **moment d'approche maximale** avec chaque voisin ; si les positions prédites sont trop proches, s'écarter de la future position du voisin | `avoidCollisions(vehicles)` |

## 4. Comportements de groupe

Chaque véhicule ne regarde que ses **voisins** dans un rayon (et parfois un
angle) de perception.

| Comportement | Principe | Méthode |
|---|---|---|
| **Separation** | Somme des vecteurs `(pos − pos_voisin) / distance` → répulsion en 1/d | `separation(vehicles)` |
| **Cohesion** | Seek vers la position moyenne des voisins | `cohesion(vehicles)` |
| **Alignment** | Viser la vitesse (direction) moyenne des voisins | `alignment(vehicles)` |
| **Flocking** | Separation + Cohesion + Alignment pondérés (boids, Reynolds 1987) | `flock(vehicles, poids)` |
| **Leader following** | Arrival vers un point **derrière** le leader ; si on est devant lui, evasion latérale ; plus Separation entre suiveurs | `followLeader(leader, vehicles)` |

## 5. Combiner les comportements

- **Somme pondérée** : simple, mais des forces opposées peuvent s'annuler.
- **Priorité** : on évalue les forces dans l'ordre d'urgence (évitement
  d'abord) et on ajoute jusqu'à épuiser `max_force` → `prioritized(forces)`.
- **Tirage pondéré (dithering)** : un seul comportement par frame, choisi au
  hasard selon des probabilités — moins coûteux.

## 6. Conseils pratiques

- Toujours **limiter** les forces (`limit(maxForce)`) : c'est ce qui donne
  l'inertie et le réalisme.
- `maxSpeed` et `maxForce` sont les deux « boutons » principaux de la
  personnalité d'un véhicule (lourd = petite force, nerveux = grande force).
- La **prédiction** (pursuit, path following, collision avoidance) rend les
  comportements nettement plus crédibles qu'une réaction à l'état présent.
- Visualiser en debug les vecteurs, cibles et zones de perception.
