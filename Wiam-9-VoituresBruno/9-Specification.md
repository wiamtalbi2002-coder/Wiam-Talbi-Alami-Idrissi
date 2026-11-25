# Wiam-9-VoituresBruno — le « Steering Lab » de Bruno Vasselle, réparé et enrichi

Source : `REPO_BRUNO_VASSELLE/SteeringBehavioursM2IA2_2025_2026/9-VoitureSuitCircuit genetic algo` du dépôt de Michel Buffa.
Lancer : `python -m http.server 8090` à la racine, puis `http://localhost:8090/Wiam-9-VoituresBruno/`.
Ensuite : **Changer d'expérience → Entraîner par évolution → Préparer → Démarrer**. Ouvrir « ✿ Ajouts de Wiam » en haut.

## Ce que fait Bruno (et la différence avec Buffa)

Même principe que Buffa (réseau de neurones + algorithme génétique, sorties transformées en force de steering), mais en version « recherche » :
- **circuits tueurs** : un circuit qui fait échouer la population est gardé en mémoire et rejoué en qualification ; les voitures doivent réussir les anciens circuits difficiles, pas seulement le dernier (elles ne peuvent pas « oublier ») ;
- **garage** de survivants, purge, voiture-balai (élimine les voitures plus lentes qu'une référence) ;
- réseaux configurables (ReLU / sigmoïde / tanh, plusieurs couches), capteurs de direction des murs, symétrie ;
- mode **imitation** : un élève apprend d'un maître avec `model.fit()` (apprentissage supervisé, le seul endroit avec rétropropagation).

## Réparations (le projet ne démarrait pas)

| Problème | Cause | Réparation |
|---|---|---|
| Erreur `Asset is not defined`, page vide | Le `.gitignore` de Bruno exclut `assets*` : `assets.js` et `assets/` n'ont jamais été publiés | `assets.js` reconstruit (classe `Asset`) ; `.gitignore` corrigé |
| Erreur `Ressource indisponible : car-simple-1` | Les 4 JSON de départ manquent | `assets/*.json` : graines **non entraînées** (les 2 cerveaux entraînés de Bruno sont perdus) |
| « Préparer une nouvelle session » ne fait rien (`reading 'optimizer'`) | Bug de TensorFlow.js 1.1.0 : `dispose()` sur un modèle jamais construit | Correctif dans `assets.js` |
| Plantage au premier circuit tueur (`saveGeneration is not defined`) | Fonctions de sauvegarde absentes | `saveGeneration`, `saveTrack`, `saveKillers` → archives exportables |
| Ne marche qu'avec Internet | p5.js et TensorFlow.js chargés depuis des CDN | Copiés dans `libraries/` (marche hors ligne et sur GitHub Pages) |

## Mes ajouts (le code de Bruno n'est pas modifié)

Branchés par `wiamAddons.js` :
- `p5.prototype.registerMethod('post', …)` : p5 appelle ma fonction après chaque `draw()` de Bruno, je dessine par-dessus ;
- j'enveloppe `SessionController.prototype.finishRace` pour noter chaque course avant que Bruno ne passe à la suivante.

| Ajout | Pourquoi |
|---|---|
| ✿ Panneau accordéon en haut, semi-transparent | Mes options, séparées de l'interface de Bruno |
| 🏁 **Je conduis** (flèches) sur son circuit | Course contre ses voitures : même formule de steering, sortie de piste = retour au checkpoint + 1 s de pénalité (distance signée de Bruno : négative = hors piste) |
| ⏱️ Meilleur tour IA vs le tien | Mesuré en pas de simulation (`measureSteps` de Bruno), donc comparable même en accéléré |
| 📈 Courbe de progrès par course | % de voitures arrivées et meilleure distance : on voit l'apprentissage, et le nombre de circuits tueurs en mémoire |
| ✨ Traînée + 👑 sur la voiture en tête | Suivre la meilleure trajectoire |
| 🎉 Confettis au record de réussite | Rendre visible chaque progrès |

Exception assumée : `WiamPlayerCar` et `WiamConfetti` n'héritent pas du `Vehicle` de Bruno, car son constructeur crée un réseau TensorFlow ; ils utilisent la même physique (force = désirée − vitesse).

## Fichiers ajoutés

`assets.js`, `assets/*.json`, `libraries/`, `controlPanel.js`, `wiamPlayerCar.js`, `wiamConfetti.js`, `wiamProgressChart.js`, `wiamAddons.js`, ce fichier ; `index.html` (scripts locaux + mes scripts), `style.css` (panneau), `.gitignore`.
