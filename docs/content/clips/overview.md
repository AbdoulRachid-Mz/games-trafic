---
title: "Clips & Médias"
description: "Création et interaction autour du divertissement vidéo (Clips, Reels)."
category: "Clips"
order: 5
---

# Divertissement: Clips

## 🧩 Vue d’ensemble
Afin de créer de la rétention, la plateforme intègre un module très inspiré des réseaux modernes à scrolling vertical (type Reels/TikTok) : Les `<beautifulMention>Clips</beautifulMention>`.

## ⚙️ Fonctionnement
Les joueurs peuvent synchroniser leurs highlights ou importer des vidéos de petite taille afin de les publier. Chaque média possède un compteur d'engagement (Likes, Comments).

## 👤 Côté utilisateur
- **Découverte (`/clips`)** : Interface en plein écran au scrolling fluide, masquant les distractions.
- **Réactions** : Possibilité de commenter, de liker, ou de transférer le clip dans ses messages directs.

## 🧠 Logique métier
Des index spécifiques optimisent la récupération par date et par tendance (`likesCount`). L'intégration du module Lazy Load d'Image et de compression vidéo est primordiale pour éviter d'engorger la bande passante frontend.
