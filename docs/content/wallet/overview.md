---
title: "Wallet GTC & Finances"
description: "Architecture financière, gestion du solde GTC, dépôts, retraits, transferts sécurisés et historique des transactions."
category: "Finances"
order: 3
---

# Wallet GTC & Finances

Le **Wallet GTC** est le cœur financier de Games-Trafics. Les soldes affichés proviennent des comptes financiers/ledger ; `balanceAfter` stocké sur une transaction est informatif et ne fait pas autorité.

<Callout type="info" title="Monnaie GTC">
Le GTC est l'unité monétaire interne de la plateforme. Les conversions externes, si présentes, sont traitées par les workflows de dépôt/retrait approuvés.
</Callout>

## Architecture

- **Comptes financiers** : source de vérité pour les mouvements.
- **Ledger double-entrée** : chaque opération canonique poste des écritures équilibrées.
- **Wallet utilisateur** : projection/liaison vers le compte financier utilisateur ; doit être actif, non verrouillé et éligible pour les opérations utilisateur.
- **Fonds bloqués / escrow** : utilisés pour commandes, retraits en attente de règlement et certains flux de réservation.

## Opérations

<Steps>
  <Step title="Dépôt">
    L'utilisateur crée une demande de dépôt. Aucun crédit immédiat. Un admin approuve via workflow canonique ; le net est crédité selon frais/politique.
  </Step>
  <Step title="Retrait">
    L'utilisateur crée une demande de retrait avec preuve PIN/passkey. Les fonds sont réservés selon le workflow ; l'approbation règle vers clearing externe, le rejet/annulation libère la réservation.
  </Step>
  <Step title="Transfert P2P / identités">
    Transfert atomique serveur avec idempotence déterministe, cooldown 120s, frais serveur et preuve d'exécution.
  </Step>
  <Step title="Paiements">
    Achats boutique/items/thèmes/VIP/tournois : prix/frais recalculés serveur, `PRICE_CHANGED` en cas de dérive.
  </Step>
</Steps>

## Statuts

| Statut | Signification |
| :--- | :--- |
| `PENDING` | Demande créée ou fonds réservés/en attente de règlement métier. |
| `PROCESSING` | Traitement en cours par un workflow autorisé. |
| `COMPLETED` | Effet financier/métier terminé. |
| `FAILED` | Échec explicite, aucun effet partiel silencieux attendu. |
| `CANCELLED` | Annulé avant achèvement. |
| `REFUNDED` | Remboursement/reversal canonique appliqué. |

## Sécurité

1. **PIN/Passkey obligatoire** sur les opérations utilisateur sensibles, preuve consommée à l'exécution.
2. **Cooldown 120s** serveur/DB entre opérations utilisateur, sauf retry idempotent strict identique.
3. **Pas de mutation directe de solde** comme autorité métier ; utiliser les services `lib/finance`.
4. **Historique auditable** : transactions, entrées ledger et audit financier.
