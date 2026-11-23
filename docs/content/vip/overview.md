---
title: "Programme Membre VIP"
description: "Avantages exclusifs, réductions de commissions, badge distinctif et souscription au statut VIP."
category: "VIP"
order: 7
---

# Programme Membre VIP

Le statut **VIP** est géré par un flux financier canonique serveur. Les tarifs sont lus côté serveur (MONTHLY/YEARLY depuis settings, LIFETIME fixe à 25000 GTC) et toute dérive client renvoie `PRICE_CHANGED`.

## Souscription

- Le parcours canonique est le wizard `/wallet/transactions/create?type=VIP_SUBSCRIPTION&plan=...`.
- `actions/transactions.ts` applique: auth, wallet actif/non verrouillé, pricing serveur, idempotence déterministe, cooldown 120s, preuve PIN/passkey à l'exécution, et garde d'abonnement actif.
- **Garde active** : si un abonnement VIP actif non expiré existe, une nouvelle souscription `VIP_SUBSCRIPTION` est refusée. Le dashboard affiche l'état actif/LIFETIME et n'ouvre pas de renouvellement anticipé.

## Renouvellement

- `renewVipSubscription` (`actions/vip.ts`) est **admin/non-canonique** pour gestion administrative ; il ne remplace pas le flux de paiement utilisateur.
- Le renouvellement utilisateur avant expiration n'est pas exécuté tant qu'un abonnement actif existe. Une évolution produit devra définir un chemin serveur canonique explicite (extension/planification) sans bypass des guards.

## Avantages

1. Réduction de frais selon politique serveur (fee engine).
2. Badge/reconnaissance VIP.
3. Avantages d'accès/priorité selon règles produit.

<Callout type="warning" title="Règle importante">
L'UI ne doit pas permettre de modifier un prix VIP fixe, ni simuler un succès. L'activation VIP doit correspondre à une transaction canonique réussie.
</Callout>
