---
title: "Wallet GTC & Finances"
description: "Architecture financière, gestion du solde GTC, dépôts, retraits, transferts sécurisés et historique des transactions."
category: "Finances"
order: 3
---

# Wallet GTC & Finances

Le **Wallet GTC** est le cœur financier de Games-Trafics. Chaque utilisateur dispose d'un portefeuille numérique sécurisé permettant de régler ses achats d'items, payer ses droits d'inscription aux tournois, percevoir ses récompenses et encaisser les recettes de ses ventes.

<Callout type="info" title="Monnaie GTC">
Le GTC (Games-Trafics Currency) est l'unité monétaire de référence de la plateforme. 1 GTC équivaut à 1 unité de devise légale configurée selon les taux de conversion en vigueur.
</Callout>

---

## 💰 Architecture du Portefeuille

Chaque portefeuille est caractérisé par :
- **Solde Disponible** : Fonds immédiatement utilisables pour les transferts, achats ou retraits.
- **Fonds Bloqués (Escrow / Séquestre)** : Montants réservés lors d'une commande en attente de livraison ou d'un tournoi actif.
- **Devise de Référence** : Par défaut en FCFA / XOF ou devise internationale selon votre localisation.
- **Code PIN de Sécurité** : Clé secrète protégeant tout mouvement sortant de fonds.

---

## ⚙️ Opérations Disponibles

<Steps>
  <Step title="Dépôt de Fonds">
    Alimentez votre portefeuille via les moyens de paiement intégrés (Mobile Money, Carte bancaire, partenaires agréés). Dès confirmation bancaire, votre solde GTC est crédité.
  </Step>
  <Step title="Transfert Peer-to-Peer (P2P)">
    Envoyez instantanément des GTC à un autre joueur grâce à son pseudo ou en scannant son **QR Code Wallet**. Validation par code PIN obligatoire.
  </Step>
  <Step title="Paiement de Tournoi & Items">
    Réglez vos frais d'entrée de tournois ou l'achat d'un skin/monnaie de jeu en débit direct sur votre solde.
  </Step>
  <Step title="Retrait vers Compte Personnel">
    Demandez le virement de vos gains vers votre compte bancaire ou compte Mobile Money enregistré. Les demandes sont traitées selon les délais opérationnels réglementaires.
  </Step>
</Steps>

---

## 📋 Statuts de Transaction

Toute opération financière passe par un cycle de vie strict et auditable :

| Statut | Signification |
| :--- | :--- |
| `PENDING` | L'ordre a été initié et est en attente de validation ou de paiement externe. |
| `PROCESSING` | L'opération est en cours d'exécution auprès du processeur bancaire ou du réseau. |
| `COMPLETED` | Les fonds ont été crédités ou transférés avec succès. La transaction est irréversible. |
| `FAILED` | La transaction a échoué (solde insuffisant, rejet bancaire, code PIN erroné). |
| `REFUNDED` | L'opération a été annulée et les fonds ont été restitués au portefeuille d'origine. |

---

## 🛡️ Règles de Sécurité du Wallet

1. **Aucun virement sans validation PIN** : Même avec un compte connecté, un transfert ne peut aboutir sans le code PIN.
2. **Historique immuable** : Chaque transaction enregistre la date précise, le montant, les frais éventuels, le type d'opération et la référence de paiement.
3. **Plafonds & Sécurité anti-fraude** : Des plafonds journaliers progressifs s'appliquent en fonction du niveau de vérification KYC de l'utilisateur.
