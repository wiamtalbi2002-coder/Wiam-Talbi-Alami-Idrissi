# 8-EvolutionarySteeringBehavior — Spécification

Clic : ajoute un individu ou un prédateur (menu). Glisser : individus. Touches : **p** prédateur, **d** debug.

| Exercice | Statut |
|---|---|
| Prédateurs (`Predator extends Vehicle`) qui **poursuivent** (pursue, position future) l'individu le plus proche et le mangent | ✅ |
| Les prédateurs ont faim : la santé baisse, chaque proie en rend ; ils meurent à zéro ; sans proie ils déambulent | ✅ |
| Les individus fuient la position future du prédateur dans un rayon de peur (cercle jaune) | ✅ |
| Vitesse de fuite selon la santé : de 50 % (malade) à 150 % (en forme) | ✅ |
| Curseurs : probas nourriture / poison, taux de mutation, nombre et vitesse des prédateurs, faim, rayon de peur | ✅ |
| Panneau accordéon au lieu des nombreux labels ; debug touche D + case synchronisées, vitesse en rouge | ✅ |

## Question du cours

**Que se passe-t-il au fil des générations ?** Les individus qui survivent assez longtemps se clonent avec mutation : on voit apparaître des poids positifs pour la nourriture et négatifs pour le poison. Avec les prédateurs, survivre demande aussi d'être en bonne santé (pour fuir vite) : la pression de sélection est plus forte.
