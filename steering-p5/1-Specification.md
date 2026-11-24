# 1 — Spécification

Cahier des charges du projet. Chaque tâche porte un **Statut** et une
**Application** (lus automatiquement par le README).
Statuts possibles : ⏳ À faire · 🚧 En cours · ✅ Terminée.

## Règles générales
- Respecter [ARCHITECTURE.md](ARCHITECTURE.md) (une classe par fichier, tout
  élément animé est un `Vehicle`, sous-classes pour les objets spécialisés).
- Mettre à jour [HANDOFF.md](HANDOFF.md) après chaque opération.

## Tâche 1 — Vaisseaux et panneau de réglages

**Statut :** ✅ Terminée
**Application :** `apps/01-vaisseaux/`

Demande :
- Curseur **nombre de vaisseaux** : min 1, max 200, pas 1.
- Curseur **vitesse** (vitesse max) : 0 à 20, pas 0,01.
- Curseur **accélération max** (force max) : 0 à 10.
- Curseurs dans une **zone en haut de l'écran**, **semi-transparente**,
  **cachable comme un accordéon**.
- **Touche D** : bascule (on/off) du mode debug.
- **Case à cocher** Debug ; touche D et case **toujours synchronisées**.
- Debug on : **vecteurs vitesse en rouge** ; debug off : non affichés.

Réalisation :
- `Ship extends Vehicle` : wander + containment (`boundaries`) + separation.
- Pas de l'accélération max fixé à 0,01 (non précisé dans la demande).
- Valeurs par défaut : 20 vaisseaux, vitesse 4, accélération 0,2.
- Si accélération = 0, le containment ne peut plus agir : les vaisseaux
  réapparaissent de l'autre côté (`wrapEdges`).

## Tâche 2 — Dégradé radial arc-en-ciel

**Statut :** ✅ Terminée
**Application :** `apps/02-degrade-arc-en-ciel/`

Demande :
- Animer un **dégradé radial** qui **suit la souris**, aux couleurs de
  l'**arc-en-ciel**.
- Ajouter des **curseurs** pour régler les divers paramètres.

Réalisation :
- `RainbowGradient extends Vehicle` : le centre suit la souris en
  **Arrival** (ralentit en approchant).
- Curseurs : rayon, bandes, répétitions de l'arc-en-ciel, saturation,
  luminosité, opacité, vitesse de défilement des teintes (négatif = sens
  inverse), amplitude et vitesse de pulsation, vitesse max, accélération
  max, distance de freinage.
- Cases : bandes nettes, fondu vers le bord, Debug (synchronisée avec D).
- Debug : vecteur vitesse rouge, cercle de freinage, cible, rayon courant.

## Tâche 3 — L'avion attaquant

**Statut :** ✅ Terminée
**Application :** `apps/03-avion-attaquant/`

Demande :
- **Un seul avion** avec un **rayon de détection de 600 px**, et
  **5 cibles** par défaut (curseur « Cibles par vague » de 1 à 10).
- Toutes les cibles dans ce rayon **deviennent rouges** ; l'avion attaque
  la **plus proche**.
- L'avion la **poursuit (pursue)** et **tire des missiles** qui la
  poursuivent eux aussi (**pursue**).
- L'avion est « **bon mais pas intelligent** » : il poursuit et tire, sans
  stratégie ni esquive.
- **Alarme sonore** « pi-pi-pi-pi-pi » quand l'avion détecte une cible.
- Version « jeu de guerre » : l'avion doit **abattre toutes les cibles avec
  précision**, avec des **sons de guerre réalistes** et une ambiance fun.
- Version **3D réaliste** et **plus humaine** : vraie 3D, soldats au sol,
  pilote qui vole comme un humain, radio et voix.

Réalisation :
- **Rendu 3D** (`createCanvas(..., WEBGL)`) : caméra basse et inclinée qui
  cadre l'action (entre l'avion et sa cible) et la suit en douceur ;
  lumière ambiante + soleil ; sol texturé (bruit de Perlin, pistes,
  quadrillage, cratères) prolongé par une plaine ; décor d'arbres et de
  ruines. Le **pilotage reste en 2D** (x, y, steering behaviors) ; `z` est
  l'altitude de l'avion, des missiles, balles et particules.
- `Plane extends Vehicle` : une cible est détectée dès que son **bord**
  entre dans le rayon ; l'avion verrouille la plus proche et la **garde**
  tant qu'elle reste visible, sauf si une autre est 30 % plus proche.
- **Pilote humain** : états *patrouille* (wander à 160 d'altitude),
  *attaque* (pursue en **piqué** vers la cible) et *dégagement* (à moins
  de 110 px, il remonte à 230 et s'écarte en seek vers un point de
  dégagement, puis revient pour une nouvelle passe). Virages plus larges
  (`maxForce` 0,2), **inclinaison** dans les virages, altitude pilotée par
  une force verticale bornée, **temps de verrouillage** de 25 frames avant
  le missile (viseur rouge → vert), légère dispersion du tir (±0,045 rad).
- **Tir de précision** : missiles tirés seulement en attaque, à portée
  (500 px) et dans l'axe (±0,7 rad) ; **mitrailleuse** (portée 320 px, axe
  ±0,3 rad, une balle toutes les 5 frames) qui vise la **position future**
  de la cible (tir anticipé). Case « Mitrailleuse ».
- Avion 3D : fuselage, ailes, empennage, cockpit, missiles sous les ailes,
  flamme de réacteur, **ombre au sol** décalée selon l'altitude.
- Détection visible hors debug : rayon de détection rouge qui pulse au sol,
  ligne vers la cible et viseur tournant sur la cible verrouillée.
- `Missile extends Vehicle` : pursue vers sa cible jusqu'à l'impact ou la
  fin de vie (traînée de fumée) ; son altitude rejoint celle de la cible.
  Missiles de l'avion **blancs** (`owner: 'plane'`), maniables (`maxForce`
  0,9) ; si leur cible est déjà détruite, ils se **reverrouillent**.
- `Bullet extends Vehicle` : balle traçante balistique en 3D (aucune force
  après le tir), 1 point de dégât ; soulève de la poussière au sol.
- `Target extends Vehicle` : **char 3D** (chenilles, caisse, tourelle et
  canon qui pivotent et s'élèvent vers l'avion), **4 points de vie** (barre
  de vie flottante) ; balle = 1, missile = 4. Devient rouge quand l'avion
  le détecte.
- `Soldier extends Vehicle` : **fantassins** (3 par char) qui escortent
  leur char (arrive vers un point décalé + separation), tirent au fusil
  vers l'avion (traçantes sans dégâts) et **paniquent** quand l'avion
  approche ou qu'une explosion éclate (evade / flee en courant). Neutralisés
  par la mitrailleuse ou le souffle d'un char détruit (ils tombent puis
  disparaissent). Les survivants sans char se replient à la vague suivante.
- `RadioChatter` (DOM + `speechSynthesis`, pas un `Vehicle`) : messages du
  pilote « VIPER 1 » (verrouillage, Fox deux, char détruit, je suis touché,
  missile en approche, infanterie, vague…) affichés en bas à droite et **lus
  à voix haute** (voix française si disponible), précédés d'un grésillement
  radio. Case « Voix radio ».
- **Vagues** : quand tous les chars sont détruits, bannière « VAGUE N
  NETTOYÉE » (+500 × N), puis vague suivante avec un char de plus (max 15).
  Score : 100 × N par char, 10 par fantassin.
- `Particle extends Vehicle` : explosions 3D (onde de choc au sol, boules
  de feu qui montent, fumée, étincelles et débris qui retombent), freinées
  par une force de frottement. Secousses de la caméra (case « Secousses »)
  et **cratères** laissés sur le terrain.
- `ScorePopup extends Vehicle` : « +100 » qui s'élève (arrivée verticale)
  face à la caméra et s'efface.
- Fond et décor statiques (pas des `Vehicle` : ils ne bougent jamais et
  n'interagissent pas) : terrain, arbres, ruines.
- `shared/Alarm.js` (pas un `Vehicle` : non graphique) : Web Audio API sans
  bibliothèque, oscillateur carré 1200 Hz, 6 bips de 60 ms espacés de
  60 ms. Déclenchée **à chaque nouvelle cible** qui entre dans le rayon de
  l'avion, **3 s minimum** entre deux alarmes. Son débloqué au premier clic
  ou à la première touche (« Cliquez pour activer le son » en attendant).
  Case « Son » (cochée par défaut).
- `shared/WarSounds.js` (pas un `Vehicle`) : **sons de guerre** Web Audio
  sans fichier — explosions (grondement filtré + onde de choc grave +
  crépitement), rafales de mitrailleuse, coups de fusil, départ de missile
  (souffle), impact sur blindage, grésillement radio, **moteur** de
  l'avion (suit sa vitesse). Même AudioContext et même case « Son » que
  l'alarme.
- Curseurs : cibles par vague, vitesse et détection de l'avion, cadence de
  tir, vitesse des missiles, vitesse et détection des cibles, cadence de
  riposte.
- Affichage HTML en bas à gauche (`game.css`) : Score, Vague, Chars
  restants, Chars détruits, Fantassins neutralisés, **Précision** (tirs au
  but / tirs), Avion touché ; bannière de vague au centre.
- Debug (touche D + case) : vecteurs vitesse rouges, cercle de détection de
  l'avion et de chaque cible, portées des armes (pas de vecteurs sur les
  particules, trop nombreuses).

## Tâche 4 — La cible se défend

**Statut :** ✅ Terminée
**Application :** `apps/03-avion-attaquant/` (case « Tâche 4 »)

Demande :
- La cible a son propre **rayon de détection** (**200 px**).
- Elle s'échappe avec **evade** de la menace (avion ou missile de l'avion).
- Elle **contre-attaque** : quand l'avion entre dans son rayon, elle tire
  ses propres missiles sur lui.
- L'avion **ne meurt jamais** : touché, il clignote seulement.

Réalisation :
- Choix de la **menace la plus urgente** : plus petit rapport
  distance / vitesse parmi l'avion et les missiles **de l'avion** détectés
  (une cible ne fuit jamais les missiles des cibles).
- **Evade** de cette menace + **écart latéral (dodge)** face aux missiles
  proches (un missile rapide se fuit mal en ligne droite).
- **Riposte** : `Target.tryFire(plane)` crée un `Missile` réutilisé
  (`owner: 'target'`, cible = l'avion, couleur **verte**) ; curseur
  « Cadence riposte » de 30 à 300 frames (défaut 120).
- Missile de cible qui touche l'avion : l'avion **clignote** et
  « Avion touché » augmente ; il est invincible (pas de points de vie, pas
  de réapparition). L'avion n'esquive pas.
- Case « Tâche 4 : la cible se défend » : active / désactive à la fois la
  fuite et la riposte.
