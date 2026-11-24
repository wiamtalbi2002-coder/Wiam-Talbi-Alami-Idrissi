# 2-PursueEvade — Spécification

Choisir le mode dans le menu du panneau (touche **D** = debug, synchronisée avec la case).

| Exercice | Statut |
|---|---|
| Pursue : viser la position future de la cible (point vert = prédiction) | ✅ |
| Prédiction réglable en frames, ou proportionnelle à la distance (case) | ✅ |
| Evade : la cible fuit la position future du poursuivant dans un rayon de détection (cercle rouge quand elle fuit) | ✅ |
| Jeu du chat et de la souris : plusieurs poursuivants, compteur de captures, la cible réapparaît | ✅ |
| Balles rebondissantes (`BouncingBall extends Vehicle`) poursuivies par les véhicules | ✅ |
| Clic : déplace le premier poursuivant | ✅ |

## Questions du cours

- **Pursue vs seek ?** Seek vise la position actuelle : contre une cible rapide le véhicule arrive toujours « en retard » et tourne autour. Pursue vise là où la cible *sera* → interception.
- **Comment améliorer la prédiction ?** Prédire sur un nombre de frames proportionnel à la distance (loin = on regarde plus loin, près = presque seek). C'est l'option « prédiction proportionnelle ».
- **Evade** = flee appliqué à la position future du poursuivant.

## Fichiers

`vehicle.js` (Vehicle), `target.js` (Target extends Vehicle), `bouncingBall.js` (BouncingBall extends Vehicle), `controlPanel.js`, `sketch.js`.
