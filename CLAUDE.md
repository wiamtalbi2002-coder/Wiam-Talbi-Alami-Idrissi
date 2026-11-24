# CLAUDE.md

Consignes pour Claude (Claude Code, claude.ai). Règles complètes : @AGENTS.md et @ARCHITECTURE.md.

## Démarrage de session
1. Lire `HANDOFF.md`, puis `ARCHITECTURE.md`, puis la spécification du dossier concerné.

## Règles essentielles
- Une classe max par fichier ; tout élément animé (et tout élément fixe qui pourrait bouger) est un `Vehicle` ou une sous-classe, mû par steering behaviors.
- Objets spécialisés = sous-classes de `Vehicle`.
- Touche D + case Debug synchronisées ; vecteurs vitesse en rouge en debug.
- Chaque dossier numéroté est autonome.

## Après chaque opération
Mettre à jour `HANDOFF.md` et la spécification du dossier.

## Préférences de l'utilisatrice (Wiam)
- Windows + VS Code + PowerShell, pas de Node.js.
- Une commande à la fois ; le code est écrit dans les fichiers par des commandes PowerShell à coller.
