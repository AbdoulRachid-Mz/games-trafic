---
title: "Transactions & Wallet"
description: "Comprendre le fonctionnement du portefeuille interne (GTC), des paiements et des retraits."
category: "Transactions"
order: 1
---

# Transactions & Wallet

## 🧩 Vue d’ensemble
L'économie globale de Games-Trafics repose sur un système interne et ultra sécurisé appelé le <beautifulMention>Wallet GTC</beautifulMention>.
Plutôt que d'utiliser directement des cartes bancaires à chaque interaction, toutes vos actions payantes ou vos gains transitent par ce porte-monnaie virtuel exclusif.

<Callout type="tip" title="Philosophie">
**Règle d'or:** Games-Trafics fonctionne avec un système interne sécurisé (GTC) où *toutes les transactions* (achats de produits, inscriptions aux tournois, récompenses, services) passent par ce wallet étroitement contrôlé.
</Callout>

## ⚙️ Fonctionnement

1. **Dépôt (Deposit)** : L'utilisateur ajoute des fonds via son moyen de paiement traditionnel (Carte Bancaire, PayPal, ou Providers partenaires), lesquels sont instantanément convertis en GTC.
2. **Transfert (Transfer)** : Envoi de GTC d'un utilisateur à un autre (pourboires, achats entre pairs).
3. **Paiement (Payment)** : Les GTC sont déduits lors d'un achat sur la Boutique ou une inscription à un Tournoi.
4. **Retrait (Withdrawal)** : Les GTC accumulés via des gains (tournois, ventes de services, etc.) peuvent être convertis et virés vers un compte bancaire réel.

<Steps>
  <Step title="1. Initialisation">
    Le système réserve le montant estimé dans une transaction `PENDING`.
  </Step>
  <Step title="2. Validation">
    Les APIs partenaires confirment le succès du flux. Le statut passe à `COMPLETED`.
  </Step>
  <Step title="3. Sécurité (Escrow/Rétention)">
    Les fonds liés aux transactions de type "Litige potentiel" sont gelés (`HELD`) jusqu'à la résolution.
  </Step>
</Steps>

## 👤 Côté utilisateur

Les utilisateurs interagissent avec leurs finances depuis la page `/wallet`.
- **Aperçu Instantané** : Vérifier son solde de `<beautifulMention>GTC</beautifulMention>` en temps réel.
- **Cartes Virtuelles** : Les utilisateurs de niveau supérieur peuvent employer des *Cartes virtuelles* pour des transactions complexes.
- **Relevé de compte** : Historique granulaire avec des filtres (Dépôts, Retraits, Achats...).

## 🧠 Logique métier

La base de données repose sur plusieurs tables critiques :
- `userWallets` : Stocke le solde actuel vérifié.
- `walletTransactions` : Agit comme un livre de comptes immuable (event-sourcing) pour recalculer n'importe quel solde afin d'éviter la falsification monétaire.
- Les états possibles d'une transaction sont : `PENDING`, `COMPLETED`, `FAILED`, `CANCELLED`, `REFUNDED`, et `HELD`.

## 🔗 Relations

- **Orders & Boutiques** : Un achat direct générera automatiquement un `<beautifulMention>Payment</beautifulMention>` qui va débiter le `userWallet`, et créditer le compte lié de la boutique ou de la plateforme.
- **Tournois** : Le Prize-Pool d'un tournoi est modélisé par un Wallet neutre transitoire qui est redistribué à la fin (Withdrawal).

## 📊 Cas d’usage
- Sophie participe à un tournoi payant (Paiement : `-5 GTC`).
- Elle remporte la première place. Le tournoi dispatche son lot (Transfert automatique : `+50 GTC`).
- Sophie décide de virer 30 GTC sur sa carte bancaire, et d'utiliser 20 GTC dans la boutique pour un service de coaching.

## 🖼️ Illustration
![Flux du Wallet](/docs/images/wallet-flow.png)
