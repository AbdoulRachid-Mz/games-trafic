---
title: "Commandes & Livraisons"
description: "Comprendre le cycle de vie d'une commande via la marketplace."
category: "Orders"
order: 4
---

# Commandes (Orders)

## Vue d'ensemble
Les commandes produit utilisent un flux escrow canonique. Le prix est lu en base (jamais depuis le client), la capture est atomique et idempotente, et les transitions sensibles sont protégées par auth/éligibilité/PIN/passkey/cooldown selon le flux.

## Cycle de vie

1. **Création / Capture** : `createProductOrder` vérifie l'éligibilité, verrouille le produit, lit le prix DB, consomme la preuve PIN/passkey si requise, capture le montant en escrow via `executeFinancialOperation` (`PENDING`).
2. **Validation boutique** : la boutique accepte et fournit les identifiants/livraison selon le flux commande.
3. **Finalisation admin** : `completeOrderAdmin` libère l'escrow vers le vendeur (net) et la commission vers `PLATFORM_FEES` via postings canoniques.
4. **Rejet / Annulation** : `rejectOrder` applique un remboursement canonique (`executeRefund`) si la capture escrow a eu lieu, puis met à jour le statut commande/produit.

## Règles

- **Quantité** : un produit = exemplaire unique ; pas de quantité client arbitraire.
- **Prix** : source DB, pas de montant client autoritaire.
- **Escrow** : fonds capturés avant livraison/finalisation ; pas de payout vendeur avant finalisation admin.
- **Idempotence** : clé déterministe par intention de capture ; retries stricts ne rejouent pas l'effet.
- **Statuts** : `COMPLETED` commande seulement après règlement/libération effectif.

## Relations

- **Wallet/Transactions** : capture et payout génèrent des écritures ledger équilibrées.
- **Boutiques** : le vendeur reçoit le net après commission.
- **Admin** : finalisation/rejet soumis aux permissions serveur.
