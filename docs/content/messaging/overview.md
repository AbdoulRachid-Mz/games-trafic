---
title: "Messagerie Interne"
description: "Discussions, alertes contextuelles et relations d'équipes."
category: "Messaging"
order: 7
---

# Messaging & Conversations

## 🧩 Vue d’ensemble
L'application possède un système de chat avancé pour fluidifier les négociations e-commerce, les requêtes de services et les disputes de scores (tournois).

## ⚙️ Fonctionnement
Le système différencie les dialogues interpersonnels des dialogues liés à la modération ou à un match (Contextual Messaging).
<Steps>
  <Step title="Direct Messages (DM)">
    Conversation classique en temps réel (WebSocket).
  </Step>
  <Step title="Context Request">
    Une conversation générée autour d'un incident spécifique (ex: Dispute sur les résultats d'un arbre d'élimination). Les arbitres peuvent y intervenir.
  </Step>
</Steps>

## 👤 Côté utilisateur
La plateforme inclut une petite bulle persistante, et une vue dashboard `/messaging` complète pour archiver et trier les boîtes aux lettres. Un système antipourriel bloque les inconnus en amont s'ils ne sont pas sur votre liste d'amis ou du même tournoi.
