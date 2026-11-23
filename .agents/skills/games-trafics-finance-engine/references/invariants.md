# Invariants financiers et règles d'exécution

## 1. Autorité serveur et pricing

- **Prix/frais/statuts/comptes/approbations** décidés serveur-side uniquement.
- Recalculer montants à partir des entités DB autoritatives (produit/item/édition/abonnement/règle/politique) au moment de l'exécution.
- **Prix fixe** : non éditable côté client, valeur immuable pour l'opération (sauf changement de politique explicitement géré). **Quantité** : `total = unitPriceServeur × quantitéServeurValidée`.
- **Dérive tarifaire/politique** : refuser l'exécution avec `PRICE_CHANGED` (ou équivalent explicite) et retourner le tarif/frais recalculés ; jamais d'exécution silencieuse sur ancien prix.
- `calculateTransactionFees` (`lib/finance/fees/fee-engine.ts`) est la source unique de calcul des frais. Toute estimation UI/API est indicative et doit être recalculée à l'exécution sans faire confiance aux flags client (`isVip`, taux, total).

## 2. Authentification, éligibilité, permissions

À vérifier **à l'exécution** (dans la transaction/contexte serveur approprié), pas uniquement en amont :

- utilisateur authentifié, actif, non supprimé/banni selon règles applicables ;
- ownership du wallet/compte/ressource, et cohérence bénéficiaire/payeur selon le type d'opération ;
- wallet/compte financier existant, actif, non verrouillé (sauf opérations explicitement autorisées de gestion de lock) ;
- permissions/rôles admin (`lib/auth/permissions.ts`, niveaux A/B/C) pour actions sensibles/approbations/émissions/remboursements ;
- règles métier : pas d'auto-achat, pas d'auto-approbation là où requis, organisateur rejoint sa propre édition gratuitement (sans paiement), pas de nouveau VIP si abonnement actif/non expiré selon règles, disponibilité/stock/réservation, limites/politiques.

## 3. Cooldown utilisateur (obligatoire)

- **120 secondes** minimum entre deux opérations financières initiées par un utilisateur, côté serveur.
- Doit être **concurrence-safe** (vérification atomique/DB, pas un simple check mémoire best-effort) et résistant au double-clic/rejeu parallèle.
- **Retries idempotents exemptés** : si la requête porte la même clé d'idempotence valide pour la même intention déjà acceptée/complétée/en cours selon la sémantique définie, ne pas bloquer indûment mais ne pas dupliquer l'effet.
- Le cooldown s'applique aux opérations utilisateur initiant un mouvement/demande financière (paiements, transferts, dépôts/retraits demandés, achats, inscriptions payantes, etc.) selon la politique unifiée à implémenter.

## 4. Idempotence, atomicité, concurrence

- Utiliser une **clé déterministe** par intention métier (ex. `deposit-request:{requestId}`, `withdrawal-settle:{requestId}`, `tournament-join:{editionId}:{userId}`, `order-capture:{orderId}`) — jamais `Date.now()`/aléatoire côté exécution métier.
- `scope` explicite + `requestHash` stable (`hashRequestPayload`) : même clé/payload différent => conflit (`IDEMPOTENCY_CONFLICT`).
- Exécuter dans une transaction DB (`db.transaction` ou client passé) avec verrous nécessaires (`FOR UPDATE` sur comptes/transactions/réservations/challenges selon le cas) et contraintes uniques/index.
- `beginIdempotency`/`completeIdempotency` doivent encadrer l'effet réel ; une opération `COMPLETED` rejoue la réponse enregistrée sans nouvel effet ledger.
- Les transitions de statut doivent être conditionnelles/atomiques pour éviter double approbation, double payout, double remboursement ou double réservation.

## 5. Ledger et soldes

- Toute écriture monétaire passe par postings équilibrés (`assertPostingsBalanced`/`postLedgerEntries`) : somme débits = somme crédits, montants normalisés en centimes, pas de ligne simultanément débit+crédit.
- Comptes système résolus par `systemKey` (`getOrCreateSystemAccount`) ; comptes wallet/utilisabilité via helpers core.
- Soldes calculés depuis `ledger_entries` ; ne pas faire confiance à `wallet_transactions.balanceAfter` ni aux champs de solde wallet comme autorité.
- Interdire soldes négatifs sauf comptes explicitement autorisés (`allow_negative_balance`, ex. émission/clearing système selon définitions).
- Pas d'écritures partielles : en cas d'erreur, rollback complet.

## 6. Statuts et effets métier

- `PENDING`/réservation ≠ `COMPLETED`. Un retrait demandé peut réserver des fonds mais le règlement externe/paiement effectif suit son propre état ; un dépôt approuvé crédite selon flux d'approbation (pas à la simple création de demande).
- Commandes produits : respecter le flux capture/escrow → validation/approbation shop/admin selon règle → payout vendeur/commission → `COMPLETED` ou `REFUNDED` ; pas de payout avant conditions remplies.
- Remboursements/annulations : inversions cohérentes (totales/partielles selon support), traçabilité `reversal_of/reversed_by`/métadonnées, mise à jour cohérente des objets métier et du ledger.
- `actions/games.ts::processGameItemRequest` et flux similaires : ne pas marquer complété sans exécution/validation financière et métier requise.

## 7. PIN / passkey

- PIN et passkey sont des preuves de confirmation utilisateur, vérifiées **serveur-side** au moment de l'exécution financière.
- Passkey : challenge à TTL, hashé et lié aux paramètres exacts de la transaction, consommé une seule fois atomiquement (`passkeyTransactionChallenges` / helpers dédiés). L'exécution doit exiger une preuve valide consommée pour cette intention (pas un booléen UI).
- Ne jamais exposer ni logguer de secrets/PIN/challenge sensibles.

## 8. Historique et réconciliation

- **Aucune mutation automatique** des transactions/ledger historiques pour “corriger” les soldes.
- Mode diagnostic/reconciliation : requêtes/rapports read-only, classification des anomalies (ledger déséquilibré, soldes négatifs, doublons, statuts incohérents, orphelins, comptes manquants), puis scripts/actions de correction **contrôlés, idempotents, auditables et explicitement validés** si requis ultérieurement.
- Toute migration DB doit être additive/compatible, sans reset, sans `db:push` destructif.
