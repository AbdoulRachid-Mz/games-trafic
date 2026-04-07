---
title: "Centre de Notifications"
description: "Alertes système, emails, et notifications web push."
category: "Notifications"
order: 10
---

# Notifications

## 🧩 Vue d’ensemble
Afin de ne jamais louper les débuts de matchs, ou les envois de livraisons liées aux commandes, le `<beautifulMention>centre de notifications</beautifulMention>` propage des évènements persistants aux utilisateurs.

## ⚙️ Fonctionnement
Le déclenchement s'opère côté serveur lors des changements d'états :
- Passage d'un tournoi en `LIVE`.
- Un achat sur la boutique génère un événement OrderCompleted.
- Ping dans un groupe de messagerie arbitré.

## 👤 Côté utilisateur
La vue popover de la barre d'onglets (l'icône cloche) filtre en temps réel, affiche des notifications visuellement identifiables et colorées, puis permet de les marquer comme lu avec la méthode "optimistic UI" pour plus de répondant.
