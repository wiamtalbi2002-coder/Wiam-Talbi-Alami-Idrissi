# 3-Arrival — Spécification

Choisir le mode dans le menu du panneau ; bouton **Recommencer**.

| Exercice | Statut |
|---|---|
| Deux véhicules : arrive sur la souris avec rayon de freinage | ✅ |
| Serpent : n véhicules (2 à 120), chacun fait arrive sur le précédent à une distance d (curseurs n et d), anneaux reliés | ✅ |
| Formation en V : 5 positions décalées qui tournent avec la direction du leader | ✅ |
| Texte : `font.textToPoints()` du texte saisi, un véhicule par point | ✅ |
| Grille : 20 véhicules sur une grille 4×5 de Targets ; après 2 s les cibles partent, les véhicules les suivent ; option cibles invisibles | ✅ |

## Question du cours

**Arrive vs seek ?** Seek arrive à pleine vitesse et dépasse la cible (oscillations). Arrive réduit la vitesse désirée proportionnellement à la distance quand on entre dans le rayon de freinage (`map(d, 0, rayon, 0, maxSpeed)`), donc le véhicule s'arrête pile. Le paramètre `d` permet de s'arrêter *à distance* de la cible (serpent, formation).

## Fichiers

`vehicle.js` (Vehicle seulement — la classe Target a été déplacée), `target.js` (Target extends Vehicle), `controlPanel.js`, `sketch.js`.
