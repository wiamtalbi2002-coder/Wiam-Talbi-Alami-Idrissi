# 4-Wander — Spécification

| Exercice | Statut |
|---|---|
| Correction : la force wander n'était pas appliquée dans le code de départ | ✅ |
| Curseurs : vitesse max, force max, rayon du cercle, distance du cercle, déplacement de theta | ✅ |
| Curseur nombre de véhicules (1 à 200) et longueur de la traînée (0 à 100) | ✅ |
| Couleurs et tailles variées (images teintées mises en cache → ~60 fps au lieu de 3) | ✅ |
| Variante wander avec bruit de Perlin (case à cocher) | ✅ |
| Clic : ajoute un véhicule | ✅ |

## Question du cours

**Pourquoi pas juste une direction aléatoire à chaque frame ?** Le véhicule tremblerait. Avec le cercle devant lui et un point qui bouge un peu à chaque frame, la direction change doucement : mouvement naturel. Le bruit de Perlin donne le même effet de façon encore plus continue.

`tint()` à chaque frame est très lent : on prépare 12 images colorées une seule fois (`createGraphics`).
