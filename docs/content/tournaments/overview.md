---
title: "Tournois & Éditions"
description: "Organisation de compétitions esportives, arborescences, et gestion des brackets."
category: "Tournois"
order: 2
---

# Tournois & Éditions

## 🧩 Vue d’ensemble
L'écosystème compétitif de la plateforme sépare clairement l'identité abstraite d'un événement (le <beautifulMention>Tournament</beautifulMention>) des saisons et itérations réelles où se déroulent les faits (les <beautifulMention>Editions</beautifulMention>).

<Callout type="info" title="L'Architecture">
Un tournoi est défini par ses règles, ses organisateurs, et son jeu (par ex: "GT League"). Ses éditions (ex: "Saison Printemps 2024", "Saison Hiver 2025") contiennent la liste des joueurs enregistrés et des phases compétitives.
</Callout>

## ⚙️ Fonctionnement

L'évolution au sein d'une compétition se déroule ainsi :
1. **Édition** : Les joueurs/équipes paient/obtiennent leur droit d'entrée à l'édition d'un tournoi (Registration).
2. **Phase** : L'édition est découpée en "étapes" (Groupes de Pool, Play-In, Playoffs).
3. **Group** : Chaque Phase possède un ou plusieurs Groupes dans lesquels des participants sont répartis selon des *Seedings*.
4. **BracketNode** : La représentation des cellules croisées d'un arbre `UPPER` ou `LOWER`.
5. **Match** : La rencontre effective. Dès qu'un vainqueur émerge, le système pousse l'entité gagnante vers le BracketNode suivant.

<Steps>
  <Step title="Round Robin">
    Toutes les équipes dans un Groupe s'affrontent mutuellement (matches en ligue). On gagne des points selon un système de classement victoires / défaites.
  </Step>
  <Step title="Elimination (Single / Double)">
    Génération d'un arbre où la défaite exclut du bracket Supérieur. Arbre de type classique *Esport*.
  </Step>
  <Step title="Hybrid">
    Groupes de départ en Round Robin (Group Stage), puis phase d'élimination pour le carré final (Knockout Stage).
  </Step>
</Steps>

## 👤 Côté utilisateur
Les participants bénéficient d'un **hub personnalisé** (`/tournaments/...`), permettant de naviguer visuellement avec réactivité. Le bracket généré gère le scroll infini, les zoom et permet d'observer facilement ses prochains adversaires. La plateforme remonte les résultats de matchs validés et les scores automatiquement.

## 🧠 Logique métier
- La table mère `tournaments` est partagée, mais `tournamentEditions` fige la timeline (Dates, Cagnotte, Registrations liées).
- Le backend garantit qu'aucun noeud de bracket n'est surécrasé ou mal référencé. Un match lié à un noeud attend de recevoir le résultat des nœuds enfants pour définir les "À déterminer".

## 🔗 Relations
- **Résultats Financiers (Wallet)** : Le rattachement au wallet se fait sur les récompenses. Tout comme les frais de "Entry Fees" dépendent du modèle `/transactions`.
- **Matchs & GroupParticipants** : Chaque match est hydraté grâce aux participations enregistrées (GroupParticipants -> Registration -> User/Team).

## 📊 Cas d’usage
- Les organisateurs entrent dans le "Dashboard de l'Édition" -> Créent une *Phase de Qualification* (Group Stage) -> Génèrent 4 groupes Round-Robin.
- Une fois les matchs résolus par les joueurs, les 2 de tête accèdent automatiquement à une autre Phase (Playoffs) sous format d'élimination Directe.

## 🖼️ Illustration
![Tournament Flow](/docs/images/tournament-flow.png)
