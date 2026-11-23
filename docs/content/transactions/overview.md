---
title: "Transactions & Wallet"
description: "Comprendre le fonctionnement du portefeuille interne (GTC), des paiements et des retraits."
category: "Transactions"
order: 1
---

# Transactions & Wallet

## Vue d'ensemble
L'économie Games-Trafics repose sur le **Wallet GTC**. Les opérations financières sont exécutées côté serveur via le moteur canonique `lib/finance` (ledger double-entrée, idempotence déterministe, cooldown serveur, vérification PIN/passkey à l'exécution).

<Callout type="warning" title="Autorité serveur">
Les montants finaux, frais, bénéficiaires, statuts, comptes ledger et approbations sont recalculés/validés côté serveur. Le client ne peut pas forcer un prix, des frais, un statut `COMPLETED` ou un crédit/débit direct.
</Callout>

## Flux réels

1. **Dépôt** : création d'une **demande** (`DEPOSIT`, `PENDING`) via `createRequest`. Aucun crédit wallet immédiat à la création. Le crédit net est appliqué uniquement à l'approbation admin via le flux canonique.
2. **Retrait** : création d'une **demande** (`WITHDRAWAL`, `PENDING`) via `createRequest`. Réservation/settlement/release sont gérés par le workflow canonique ; pas de débit utilisateur immédiat hors réservation prévue.
3. **Transfert** : transfert wallet-à-wallet atomique, frais serveur, idempotence déterministe, cooldown 120s, preuve PIN/passkey consommée côté serveur.
4. **Achats / paiements** : produits, items de jeu, thèmes, VIP et inscriptions tournoi utilisent des flux serveur canoniques. Prix fixes relus en base ; dérive tarifaire => `PRICE_CHANGED`.
5. **Commandes produit** : capture en escrow (`PENDING`) à l'achat, payout vendeur + commission à la finalisation admin, remboursement canonique à l'annulation/rejet.

## Règles d'exécution

- **Idempotence** : clé déterministe par intention (`idempotencyKey`) + scope + hash payload. Retry strict identique = pas de rejouement d'effet ; nouvelle intention = nouvelle clé.
- **Cooldown** : 120s serveur/DB, concurrence-safe, sur opérations utilisateur. Retries idempotents stricts exemptés.
- **PIN/Passkey** : preuve à usage unique, liée à l'intention, consommée atomiquement à l'exécution.
- **Ledger** : source de vérité des soldes. `balanceAfter` est un cache d'affichage, pas une autorité.
- **Statuts** : `COMPLETED` uniquement après effet financier/métier réel.

## États usuels

`PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`, `CANCELLED`, `REFUNDED`. `HELD` peut exister selon schéma/flux historiques ; interpréter via le workflow canonique.

## Relations

- **Orders** : achat → escrow ; validation admin → payout vendeur + commission ; rejet/annulation → refund.
- **Tournois** : inscription payante → débit payeur + frais, crédit brut au pool tournoi.
- **VIP / Thèmes / Items** : achats server-priced, garde d'éligibilité, preuve d'exécution.
