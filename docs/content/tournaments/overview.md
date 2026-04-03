# Tournois & Éditions

La gestion des compétitions est l'un des piliers de **Games-Trafics**. Nous distinguons les **Tournois** (entités globales) des **Éditions** (instances spécifiques d'un tournoi).

## 🧩 Vue d'ensemble

- **Tournoi** : Définit le jeu, les règles générales et l'organisateur.
- **Édition** : Définit les dates, le cashprize, le format de jeu et les participants. Une édition appartient à un tournoi.

## ⚙️ Fonctionnement

Une édition progresse à travers plusieurs étapes :
1. **Inscription** : Les joueurs ou équipes rejoignent la compétition.
2. **Phase de Groupes** (Optionnel) : Round Robin pour qualifier les meilleurs.
3. **Arbre de Tournoi (Brackets)** : Élimination directe ou double élimination.
4. **Matches** : Rencontres individuelles avec saisie et validation des scores.

### Formats supportés :
- **Round Robin** : Tout le monde affronte tout le monde dans un groupe.
- **Single Elimination** : Défaite interdite.
- **Double Elimination** : Une seconde chance via le bracket "Losers".

## 👤 Côté utilisateur

Les joueurs peuvent s'inscrire, consulter leurs prochains matches, et uploader des preuves de victoire (screenshots). Les organisateurs disposent d'un **Dashboard Organisateur** pour gérer les participants et générer les rounds.

## 🧠 Logique métier

Le système utilise une @beautifulMention(Progression Automatique). Dès qu'un match est validé, le gagnant est automatiquement propulsé au round suivant dans le bracket. Les statistiques de victoires/défaites sont mises à jour instantanément sur le profil du joueur.

## 🔗 Relations
- **Games** : Le jeu associé au tournoi.
- **Participants** : Équipes ou joueurs inscrits.
- **Matches** : Les instances de jeu créées par les phases.

## 🖼️ Illustration

![Tournament Structure](/docs/images/tournament-structure.png)
