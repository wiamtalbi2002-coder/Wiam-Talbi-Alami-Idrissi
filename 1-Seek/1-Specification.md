# 1-Seek — Spécification

Exemple de départ du prof : un véhicule qui fait **seek** vers la souris, avec un TODO « créer un tableau de véhicules ». Les règles à respecter sont dans [ARCHITECTURE.md](../ARCHITECTURE.md).

## Tâche 1 — Plusieurs véhicules et panneau de réglages

**Statut :** ✅ Terminée

- Curseur **nombre de véhicules** : min 1, max 200, pas 1 (résout le TODO du prof : tableau `vehicles`).
- Curseur **vitesse max** : 0 à 20, pas 0,01.
- Curseur **accélération max** (force max) : 0 à 10, pas 0,01.
- Les curseurs sont dans une zone **en haut de l'écran**, **semi-transparente**, **repliable comme un accordéon** (clic sur le titre) : classe `ControlPanel` dans `controlPanel.js`.
- **Touche D** : bascule du mode debug. **Case à cocher** Debug : toujours synchronisée avec la touche D.
- Debug activé : **vecteurs vitesse en rouge** (`Vehicle.debug`). Debug désactivé : non affichés.

## Tâche 2 — Dégradé radial arc-en-ciel

**Statut :** ✅ Terminée

- Un **dégradé radial** aux couleurs de l'**arc-en-ciel**, animé, qui **suit la souris**.
- C'est un `Vehicle` (`RainbowGradient`, fichier `rainbowGradient.js`) : son centre suit la souris avec **arrive** (il ralentit en approchant). Les véhicules de la Tâche 1 font **seek** vers ce centre.
- Curseurs : rayon, bandes, répétitions de l'arc-en-ciel, défilement des teintes, saturation, luminosité, opacité, pulsation, vitesse du dégradé, distance de freinage.
- En debug : vecteur vitesse du dégradé, cercle de freinage et croix sur la cible (la souris).

## Fichiers

- `vehicle.js` : classe du prof + `static debug` et le comportement `arrive`.
- `rainbowGradient.js` : `RainbowGradient extends Vehicle`.
- `controlPanel.js` : panneau accordéon (élément DOM, pas un Vehicle).
- `sketch.js` : setup / draw, sans classe.
