# Mon travail – Steering Behaviors ✿ (Wiam Talbi Alami Idrissi)

Salut ! ici j'explique ce que j'ai fait pour le cours de Michel Buffa sur les steering behaviors, comment je l'ai fait, et surtout les problemes que j'ai eu (il y en a eu beaucoup lol).

## Jouer directement

- 🐍 Mon jeu de serpent : https://wiamtalbi2002-coder.github.io/Wiam-Talbi-Alami-Idrissi/6-WiamSnake/
- ✈️ L'avion attaquant : https://wiamtalbi2002-coder.github.io/Wiam-Talbi-Alami-Idrissi/5-AvionAttaquant/

## Comment j'ai trouvé le cours

Le cours c'est celui de Michel Buffa, le repo c'est `micbuffa/SteeringBehavioursM2IA2_Marrakech_2026_2027`. Je l'ai forké sur mon compte (mon fork s'appelle `Wiam-Talbi-Alami-Idrissi`). Dedans il y a les exemples du prof : 1-Seek, 2-PursueEvade, 3-Arrival, 4-Wander.

Avant de coder j'ai lu l'article de Craig Reynolds "Steering Behaviors For Autonomous Characters" (1999), c'est la base de tout : un vehicule a une position, une vitesse, une vitesse max et une force max, et chaque comportement calcule une force = vitesse désirée - vitesse actuelle.

## Ce que j'ai fait

1. **steering-p5/** : un projet propre avec une classe `Vehicle` et des regles (une classe par fichier, tout ce qui bouge est un Vehicle, les objets spéciaux sont des sous-classes). Il y a aussi des fichiers pour les assistants IA (CLAUDE.md, AGENTS.md, GEMINI.md...) et un HANDOFF.md pour passer d'une IA à l'autre.
   - Tâche 1 : des vaisseaux avec des curseurs (nombre, vitesse, accélération) et le mode debug avec la touche D.
   - Tâche 2 : un dégradé arc en ciel qui suit la souris avec arrive.
   - Tâches 3 et 4 : un avion qui détecte la cible a 600 px, la poursuit (pursue) et tire des missiles, et la cible qui se défend (evade).
2. **5-AvionAttaquant/** : la version finale de l'avion, en "3D" avec des chars, des soldats, une radio, des sons et des vagues d'ennemis. C'est une version autonome qui marche toute seule.
3. **6-WiamSnake/** : mon jeu a moi 💖 un snake girly qui brille, avec mon prénom WIAM en perles au début et le serpent qui passe dedans, une musique mignonne, des ennemis qu'on peut tuer, le score et le game over.

## Comment j'ai travaillé

J'ai utilisé Claude (l'IA) pour m'aider : dans le chat pour réfléchir et écrire le code, et dans VS Code pour ajouter des trucs. Je créais les fichiers avec des commandes PowerShell, je lançais le jeu avec `python -m http.server` et je mettais tout sur GitHub avec `git add / commit / push`. Aprés j'ai activé GitHub Pages pour pouvoir jouer avec un lien.

## Les steering behaviors dans mon snake

- les anneaux du corps : **arrive** vers l'anneau de devant (c'est pour ça que le corps est souple)
- ma tête : **seek** vers le petit coeur (la souris)
- les perles a manger : **wander** tout doucement, puis **seek** vers la tête quand on passe a coté (effet aimant)
- les ennemis : **wander**, **seek** vers la nourriture, **flee** quand il y a un corps devant eux, et ils restent dans l'arène (**containment**). Certains me chassent quand ils sont plus grands que moi 😬
- les perles de mon prénom : **arrive** vers leur place + **flee** quand le serpent passe, aprés elles reviennent
- les "+10" : **arrive** vers un point au dessus

## Les problemes que j'ai eu et comment je les ai réglé

1. **`npm` n'est pas reconnu** → j'ai pas Node sur mon pc. Solution : `python -m http.server 8080` a la place.
2. **Je voyais pas le curseur sur ma capture** → en fait Windows capture pas la souris 😅 Avec la touche D (debug) on voit une petite croix là ou est la souris.
3. **git clone : "repository not found"** → mon fork avait pas le même nom que le repo du prof, il s'appelait `Wiam-Talbi-Alami-Idrissi`. J'ai failli créer un deuxieme fork dans une organisation, heureusement GitHub affichait "fork already exists".
4. **L'app de l'avion marchait pas toute seule** → elle chargeait des fichiers avec `../../lib` et `../../shared`. J'ai copié tout ce qu'il faut dans 5-AvionAttaquant et corrigé les chemins dans index.html.
5. **Le lien "← Accueil" donnait une erreur 404 sur GitHub Pages** → je l'ai enlevé du sketch.js. Aprés le push il était toujours la : c'était le cache, en fenêtre privée c'était bon.
6. **La cible se défendait mal** : en fuyant tout droit elle se faisait toucher PLUS souvent, parce que le missile va plus vite qu'elle. Solution : elle fuit la menace la plus urgente (distance / vitesse) et elle fait un écart sur le coté (dodge) quand un missile arrive → 2 fois moins touchée.
7. **Écran noir avec "Cannot redefine property: screenToWorld"** → p5.js 2 a déja une fonction qui s'appelle comme ça ! J'ai renommé la mienne `mouseToWorld`.
8. **Crash dans le dessin du coeur** → `bezierVertex` a changé dans p5.js 2. J'ai dessiné le coeur directement avec le canvas (`bezierCurveTo`).
9. **Le serpent suivait mal le coeur, il tournait en rond et tremblait** → il visait le coeur lui même, donc quand il arrivait dessus il savait plus ou aller. Maintenant il vise un point loin devant dans la direction du coeur, et il tourne plus vite (maxForce 0.9).
10. **Au début je mourais trop vite** → j'ai ajouté une bulle de protection de 3 secondes, et seulement la moitié des ennemis chassent.
11. **`invalid int value: '8082.'`** → j'avais copié le point de la phrase avec la commande 🙃
12. **Erreur 404 sur localhost** → un vieux serveur tournait encore depuis un autre dossier. J'ai lancé un nouveau sur un autre port : `python -m http.server 8090 --directory ...`
13. **Une 404 sur fr.json dans la console** → c'est normal, c'est p5.js qui cherche sa traduction.
14. **Mon README apparaissait pas sur GitHub** → la commande avait été coupée quand je l'ai copiée, donc le fichier avait pas changé. Je l'ai relancée et c'était bon.

## Lancer en local

Dans le terminal, dans le dossier `Wiam-Talbi-Alami-Idrissi` : `python -m http.server 8090`

puis ouvrir http://localhost:8090/6-WiamSnake/

## Commandes du snake

- souris = diriger (le serpent suit le coeur)
- clic maintenu ou Espace = turbo
- M = couper le son
- D = debug

Merci d'avoir lu ✿ — Wiam

---

# README original du cours
# SteeringBehavioursM2IA2_2025_2026

