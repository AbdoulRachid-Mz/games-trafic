---
title: "Commandes & Livraisons"
description: "Comprendre le cycle de vie d'une commande via la marketplace."
category: "Orders"
order: 4
---

# Commandes (Orders)

## 🧩 Vue d’ensemble
Le système de `<beautifulMention>Commandes</beautifulMention>` centralise et lie un utilisateur avec une boutique pour l'achat de comptes ou de services.

## ⚙️ Fonctionnement
1. **Création (Checkout)** : Ajout des éléments au panier depuis une boutique ou un service.
2. **Paiement (Payment)** : Déduction instantanée sur `Wallet GTC`.
3. **Livraison (Delivery)** : 
   - Pour des biens en ligne, une validation ou le code numérique s'affiche dans l'UI.
   - Pour des livraisons de services (Boosting etc.), un canal de chat (Orders Chat) est souvent initialisé avec le vendeur.

## 👤 Côté utilisateur
L'interface de `/orders` permet au client de suivre sa commande qui passe de `PENDING` -> `PROCESSING` -> `COMPLETED`. 

## 🧠 Logique métier
- Si le vendeur annule, le webhook va émettre la création d'un solde dans les `walletTransactions` via une métadonnée d'état *REFUND*.
- Des relations directes existent vers la table transaction pour toujours retracer l'origine d'un flux financier.
