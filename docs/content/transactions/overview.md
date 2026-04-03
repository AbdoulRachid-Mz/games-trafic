# Système de Transactions

Le système de transactions de **Games-Trafics** est le cœur financier de la plateforme. Il permet une gestion sécurisée et transparente de la monnaie interne, le @beautifulMention(Wallet GTC).

## 🧩 Vue d'ensemble

Chaque utilisateur possède un portefeuille numérique (Wallet) capable de stocker des GTC (Games-Trafics Coins). Les transactions sont divisées en plusieurs types :
- **Dépôt (Deposit)** : Ajouter des fonds au wallet via des providers externes.
- **Retrait (Withdrawal)** : Transférer ses GTC vers un compte externe (Mobile Money, Virement).
- **Transfert** : Envoyer des GTC à un autre utilisateur.
- **Paiement** : Acheter un produit ou s'inscrire à un tournoi.
- **Remboursement (Refund)** : Retour de fonds suite à une annulation.

## ⚙️ Fonctionnement

Toutes les transactions sont enregistrées dans la table `transactions` avec un statut (`pending`, `completed`, `failed`). 

### Sécurité :
- **Double Validation** : Les transactions sensibles nécessitent une vérification manuelle ou par OTP.
- **Traçabilité** : Chaque transaction possède un `transactionId` unique et un lien vers le `walletId`.

## 👤 Côté utilisateur

L'utilisateur peut suivre ses transactions en temps réel dans son **Tableau de Bord Portefeuille**. Il reçoit des notifications système à chaque changement de statut.

## 🧠 Logique métier

Games-Trafics utilise un système de @beautifulMention(Escrow) (séquestre) pour les tournois et les commandes. Les fonds sont bloqués jusqu'à ce que la condition de réussite (match terminé, commande livrée) soit remplie.

## 🔗 Relations
- **Wallet** : Source ou destination des fonds.
- **Orders** : Lié aux paiements de produits.
- **Tournaments** : Lié aux frais d'inscription.

## 🖼️ Illustration

![Transaction Flow](/docs/images/transaction-flow.png)
