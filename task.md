# TÂCHES D'EXÉCUTION — CORRECTION DES CONSTATS ET REFONTE TRANSACTIONS

> **Statut :** Vagues 0 à 4 + P1→P6 exécutés (T5, T4-03/04, I4-02 ✅). Vérifié le 2026-11-04.
> **Règles :** ne commencer qu'après validation de `TRANSACTION-IMPLEMENTATION-PLAN.md` et `IMPLEMENTATION-PLAN.md`.
> **Références :** `ANALYSIS.md` (§0.3, §5.10), `TRANSACTION-AUDIT.md`, `IMPLEMENTATION-PLAN.md`.

---

## 0. LÉGENDE

- `[ ]` à faire
- `[~]` en cours
- `[x]` terminé
- `[!]` bloqué
- **DoD** : définition de « terminé »

---

## 1. PRÉPARATION (OBLIGATOIRE AVANT TOUTE CORRECTION)

- [ ] **PREP-01** Créer une branche dédiée (`refactor/transactions`).
- [ ] **PREP-02** Sauvegarder la base (dump) et vérifier la restauration en préprod.
- [x] **PREP-03** Exécuter la baseline : typecheck, lint, build, tests. Noter les échecs préexistants.
- [ ] **PREP-04** Recenser les `ledger_entries` orphelines (`transaction_id` sans `wallet_transactions`).
- [ ] **PREP-05** Recenser les comptes système en double (`SYSTEM_ADJUSTMENT`, `PLATFORM_ESCROW`, `PLATFORM_FEES`, `TOURNAMENT_POOL`).
- [ ] **PREP-06** Recenser les transactions `REFUNDED` sans transaction de remboursement liée.
- [ ] **PREP-07** Recenser les escrows à solde négatif.
- [x] **PREP-08** Figer la liste des appelants de `actions/wallets.ts::createTransaction`, `transferMoney`, `depositToWallet`, `approveRequest`, `refundTransaction`.
- [ ] **PREP-09** Définir les feature flags (`FINANCE_V2`, `ADMIN_ISSUANCE_V2`, `USER_FLOW_V2`).
- [ ] **PREP-10** Valider les décisions du §15 de `TRANSACTION-IMPLEMENTATION-PLAN.md`.

**DoD :** rapport de baseline et d'inventaire disponible ; aucune donnée modifiée.

---

## 2. VAGUE 0 — STOPPER L'HÉMORRAGIE FINANCIÈRE

### 2.1 P0-F1 — Neutraliser `actions/wallets.ts::createTransaction`

- [x] **F1-01** Remplacer le corps par un wrapper déprécié qui délègue au service sûr ou lève `DEPRECATED_USE_FINANCE_SERVICE`.
- [x] **F1-02** Migrer `transferMoney` vers le service de transfert.
- [x] **F1-03** Migrer `depositToWallet` vers le service de dépôt (ou le supprimer).
- [x] **F1-04** Migrer `actions/requests.ts` vers `executeFinancialOperation`.
- [ ] **F1-05** Migrer `app/api/transactions/create/route.ts`.
- [x] **F1-06** Ajouter un test prouvant que `THEME_PURCHASE`, `TOURNAMENT_PARTICIPATION`, `ORDER_PURCHASE` ne créditent jamais.
- [x] **F1-07** Mettre à jour les imports et supprimer les chemins morts.

**Fichiers :** `actions/wallets.ts`, `actions/requests.ts`, `app/api/transactions/create/route.ts`, `lib/finance/**`.
**DoD :** plus aucune écriture hors moteur ; tests verts ; typecheck vert.

### 2.2 P0-F2 — `transferMoney`

- [x] **F2-01** Supprimer les deux transactions et l'usage de `SYSTEM_ADJUSTMENT`.
- [x] **F2-02** Créer un transfert unique `wallet → wallet` + frais `PLATFORM_FEES`.
- [x] **F2-03** Test : une seule transaction, ledger équilibré, escrow inchangé.
- [ ] **F2-04** Vérifier les appelants (`app/shops`, `app/tournaments`, `components/tournaments`).

**DoD :** un transfert = une transaction = deux/trois écritures équilibrées.

### 2.3 P0-F3 — Remboursements

- [x] **F3-01** Créer `lib/finance/transactions/refund.ts`.
- [x] **F3-02** Inverser les écritures d'origine (débit ↔ crédit, mêmes comptes).
- [x] **F3-03** Refuser le double remboursement et le remboursement au-delà du restant.
- [x] **F3-04** Remplacer `handleRefund` dans `app/admin/transactions/page.tsx`.
- [x] **F3-05** Remplacer `refundTransaction` par un wrapper du service.
- [x] **F3-06** Ajouter `reversal_of` / `reversed_by` (voir P1 schéma) ou un lien équivalent.
- [ ] **F3-07** Test : `REFUNDED` impossible sans transaction liée.

**DoD :** tout remboursement produit des écritures inverses équilibrées.

### 2.4 P0-F4 — Transfert admin

- [x] **F4-01** Retirer le bouton « Transfert » admin ou le remplacer par « Émission GTC ».
- [x] **F4-02** Supprimer l'usage de `completeData.wallet.id` comme source implicite.
- [ ] **F4-03** Afficher la source réelle et le fait que le wallet admin n'est pas débité.
- [ ] **F4-04** Test : aucune écriture sur le wallet de l'admin.

**DoD :** aucune action admin ne débite le wallet personnel de l'admin.

### 2.5 P0-F5 — Prix côté serveur

- [x] **F5-01** Item : relire `game_items.priceGtc`, stock et vendeur ; recalculer la quantité et le total.
- [x] **F5-02** Tournoi : relire `tournament_editions.entryFee` ; ignorer le montant client.
- [x] **F5-03** Thème : relire `themes.price` ; vérifier la propriété.
- [x] **F5-04** VIP : relire l'offre et la durée ; ignorer le prix client.
- [ ] **F5-05** Produit : conserver `createProductOrder` mais vérifier la quantité.
- [x] **F5-06** Retourner `PRICE_CHANGED` si le prix a changé entre affichage et confirmation.
- [ ] **F5-07** Tests : modification du montant client sans effet.

**DoD :** aucun prix client n'atteint le ledger.

### 2.6 P0-F6 — Approbateur depuis la session

- [x] **F6-01** Supprimer `adminUserId` des signatures publiques de `approveRequest`/`rejectRequest`.
- [x] **F6-02** Lire `getCurrentUser()` + `users.level` en base.
- [x] **F6-03** Refuser l'auto-approbation.
- [x] **F6-04** Mettre à jour `app/admin/requests/page.tsx`.
- [x] **F6-05** Journaliser l'approbateur et son niveau.

**DoD :** un faux `adminUserId` client est sans effet.

### 2.7 P2-P7 / P2-P8 — No-op et frais

- [x] **F7-01** Supprimer `updateWalletBalance` ou la remplacer par une opération ledger.
- [x] **F7-02** Vérifier tous ses appelants.
- [x] **F8-01** Remplacer le fallback silencieux `fees: 0` par une erreur `FEE_POLICY_UNAVAILABLE` ou un fallback configuré et audité.
- [x] **F8-02** Test : paramètres indisponibles → erreur explicite.

**DoD :** aucun appel ne promet un changement de solde sans écriture ; aucun frais silencieusement nul.

---

## 3. VAGUE 1 — FERMER LES SURFACES NON AUTHENTIFIÉES

- [x] **S1-01** `/api/cookies` : supprimer ou protéger (admin A, jamais de cookie de session).
- [x] **S1-02** Test : `401` anonyme, `403` non admin, aucun cookie dans la réponse.
- [x] **S2-01** `/api/users` GET : admin, projection minimale.
- [x] **S2-02** `/api/users` POST : inscription contrôlée ou admin A.
- [ ] **S2-03** Rate limiting + tests d'énumération.
- [x] **S3-01** `/api/games` : lecture publique justifiée, écriture admin.
- [x] **S3-02** `/api/services` : idem.
- [ ] **S3-03** Validation Zod + tests.
- [x] **S4-01** `actions/claims.ts` : auth + permission `claim:create`.
- [x] **S4-02** `updateClaimStatus`/`deleteClaim` : admin.
- [x] **S4-03** `actions/app-settings.ts` : frais et prix VIP réservés au niveau A.
- [x] **S4-04** Audit des modifications de frais.
- [x] **S5-01** `/api/transactions/calculate-fees` : auth + validation + moteur de frais.
- [x] **S5-02** Retour `{fees, totalDebit, netAmount}`.
- [x] **S5-03** Test : `401` anonyme ; total cohérent.
- [x] **A1-01** `/api/auth/profile?userId=` : contrôle de session et de visibilité.
- [x] **A1-02** Limiter les relations retournées.

**DoD :** aucune surface sensible accessible anonymement.

---

## 4. VAGUE 2 — INTÉGRITÉ COMPTABLE ET MÉTIER

### 4.1 Escrow des commandes (P1-F2)

- [x] **I1-01** Capture : débit acheteur = crédit escrow, sans frais.
- [x] **I1-02** Finalisation : débit escrow = crédit vendeur + commission `PLATFORM_FEES`.
- [x] **I1-03** Rejet : remboursement exact depuis l'escrow.
- [x] **I1-04** Vérifier `completeOrder`, `completeOrderByAdmin`, `rejectOrder`.
- [x] **I1-05** Test : escrow ≥ 0 à chaque étape.

### 4.2 Inscription payante (P1-F1)

- [x] **I2-01** `joinEdition` : vérifier édition ouverte, date limite, places, éligibilité, doublon.
- [x] **I2-02** Débit + inscription + `registration_payments` dans la même transaction.
- [x] **I2-03** Test de la dernière place en concurrence.
- [x] **I2-04** Test : échec de paiement → aucune inscription.

### 4.3 Idempotence (P1-F4)

- [x] **I3-01** Table `idempotency_keys` + index unique.
- [x] **I3-02** `checkIdempotency` / `saveIdempotency` avec hash de requête.
- [x] **I3-03** Intégrer au moteur.
- [~] **I3-04** Test : deux requêtes identiques → un débit ; payload différent → `409`.

### 4.4 Types (P1-F3)

- [x] **I4-01** `TransactionType` dérivé de Drizzle.
- [x] **I4-02** Supprimer `PRODUCT_PURCHASE` du front, utiliser `ORDER_PURCHASE`.
- [x] **I4-03** Compléter `TRANSACTION_CONFIGS` (`BONUS`, `REFUND`, `ORDER_PURCHASE`, `PURCHASE` si conservé).
- [x] **I4-04** Vérifier les filtres admin et les statistiques.
- [x] **I4-05** Test : aucune valeur TS absente de PostgreSQL.

### 4.5 Contraintes ledger (P2-P6)

- [ ] **I5-01** Nettoyer/archiver les écritures orphelines.
- [ ] **I5-02** Ajouter la FK `ledger_entries.transaction_id`.
- [ ] **I5-03** Ajouter `system_key` unique + `allow_negative_balance`.
- [ ] **I5-04** Ajouter les checks débit/crédit.
- [ ] **I5-05** Ajouter les index manquants.
- [ ] **I5-06** Test de migration sur copie de la base.

### 4.6 VIP (P1-A4)

- [x] **I6-01** Remplacer l'unicité `user_id` par un index partiel sur `status = 'ACTIVE'`.
- [x] **I6-02** Vérifier l'offre et la durée côté serveur.
- [x] **I6-03** Test de renouvellement après expiration.

**DoD :** ledger intègre, escrow non négatif, inscriptions atomiques, VIP renouvelable.

---

## 5. VAGUE 3 — PERMISSIONS ET SOCIAL

- [x] **P1-01** Créer `lib/auth/permissions.ts` (rôles, `isAdmin`, `level`, contexte).
- [x] **P1-02** Remplacer les contrôles dispersés dans les actions financières.
- [x] **P1-03** Matrice de tests action × niveau.
- [x] **P1-04** Vérifier `app/admin/layout.tsx` et `RouteProtection.tsx` (défense en profondeur, pas seule).
- [x] **A2-01** Chat : vérifier l'appartenance aux conversations/groupes.
- [x] **A2-02** Ne jamais faire confiance à `senderId`, `groupId`, `recipientId` client.
- [x] **A2-03** Tests d'accès croisés.
- [x] **A3-01** Upload : stockage réel ou retrait.
- [x] **A3-02** Vérifier MIME, taille, propriétaire.
- [x] **A3-03** Test : fichier réellement retrievable.
- [x] **P4-01** `conversations.unreadCount` : incrémenter/décrémenter ou calculer à la lecture.
- [x] **P4-02** Test badge après envoi/lecture.

**DoD :** une seule politique de permissions, appliquée côté serveur ; social non IDOR.

---

## 6. VAGUE 4 — DETTE ET UX

- [x] **D1-01** `hasWallet` : une seule source de vérité.
- [x] **D1-02** Vérifier le FAB et les actions wallet sur tous les chemins.
- [x] **D2-01** PWA : gérer `waiting` et `controllerchange`.
- [x] **D2-02** Nettoyer le code mort du service worker.
- [x] **D3-01** Fusionner les handlers API dupliqués.
- [x] **D3-02** Fusionner les `getUserStats`.
- [x] **D3-03** Fusionner les helpers de partage.
- [x] **D3-04** Fusionner les chemins d'upload.
- [x] **D4-01** Vérifier le soft-delete : filtrer `is_deleted` dans les lectures.
- [x] **D4-02** Documenter la politique de suppression financière (interdite).

**DoD :** plus de doublons structurels ; comportements cohérents.

---

## 7. REFONTE TRANSACTIONS (PHASES P1 → P9)

### P1 — Socle ledger

- [x] **T1-01** `lib/finance/core/ledger.ts` : `postLedgerEntries`.
- [x] **T1-02** `lib/finance/core/accounts.ts` : résolution + création idempotente.
- [x] **T1-03** `lib/finance/core/idempotency.ts`.
- [x] **T1-04** Migration additive : enums, colonnes, tables.
- [~] **T1-05** Tests unitaires ledger (équilibre, comptes inactifs, solde négatif).
- [~] **T1-06** Vérifier que le solde d'émission peut être négatif **uniquement** pour les comptes autorisés.

### P2 — Moteur et types

- [x] **T2-01** `transaction-engine.ts` : `executeFinancialOperation`.
- [x] **T2-02** Verrouillage déterministe (ordre trié).
- [x] **T2-03** Machine à états `assertTransition`.
- [x] **T2-04** Erreurs typées + codes.
- [ ] **T2-05** Schémas Zod par commande.
- [~] **T2-06** Tests moteur + idempotence.

### P3 — Transfert et remboursement

- [~] **T3-01** `transactions/transfer.ts`.
- [x] **T3-02** `transactions/refund.ts`.
- [ ] **T3-03** Façades `actions/transactions.ts`.
- [ ] **T3-04** Tests transfert (valide, auto, solde, destinataire).
- [x] **T3-05** Tests remboursement (total, partiel, double, contrepartie insuffisante).

### P4 — Achats et inscriptions

- [ ] **T4-01** `transactions/purchase.ts` (produit, item, thème, VIP).
- [ ] **T4-02** `transactions/tournament.ts`.
- [x] **T4-03** Migrer `actions/orders.ts`.
- [x] **T4-04** Migrer `actions/editions.ts`.
- [ ] **T4-05** Tests escrow, commission unique, édition, stock, prix.

### P5 — Dépôts / retraits

- [x] **T5-01** `transactions/deposit.ts` (demande + approbation).
- [x] **T5-02** `transactions/withdrawal.ts` (réservation + paiement + rejet).
- [x] **T5-03** Migrer `actions/requests.ts`.
- [ ] **T5-04** Tests réservation, rejet, coordonnées, concurrence.

### P6 — Émission et demandes A/B/C

- [~] **T6-01** `transactions/issuance.ts`.
- [x] **T6-02** `requests/credit-requests.ts`.
- [x] **T6-03** `requests/approval.ts`.
- [x] **T6-04** `policies/admin-policy.ts` + `limits.ts`.
- [x] **T6-05** Table `transaction_credit_requests`.
- [x] **T6-06** Table `financial_audit_logs`.
- [ ] **T6-07** Tests A/B/C complets (émission, demande, auto-approbation, rejet, double approbation).
- [ ] **T6-08** Tests : aucun débit du wallet admin lors d'une émission.

### P7 — UI admin

- [ ] **T7-01** Onglets : Vue d'ensemble, Historique, Émissions, Demandes, Dépôts, Retraits, Remboursements.
- [ ] **T7-02** `AdminGtcIssuanceForm`.
- [ ] **T7-03** `AdminGtcRequestForm`.
- [ ] **T7-04** `TransactionRequestTable` + `TransactionRequestDetails`.
- [ ] **T7-05** `TransactionApprovalDialog` + `TransactionRejectionDialog`.
- [ ] **T7-06** `TransactionAuditDetails`.
- [ ] **T7-07** Boutons conditionnés par la politique serveur.
- [ ] **T7-08** Message explicite : l'émission ne débite pas le wallet admin.
- [ ] **T7-09** Responsive + états de chargement/erreur.

### P8 — UI utilisateur

- [ ] **T8-01** `resolveTransactionIntent(searchParams)`.
- [ ] **T8-02** Priorité `editionId` pour les tournois.
- [ ] **T8-03** Parcours TRANSFER.
- [ ] **T8-04** Parcours TOURNAMENT_PARTICIPATION.
- [ ] **T8-05** Parcours GAME_ITEM_PURCHASE.
- [ ] **T8-06** Parcours ORDER_PURCHASE.
- [ ] **T8-07** Parcours THEME_PURCHASE.
- [ ] **T8-08** Parcours VIP_SUBSCRIPTION.
- [ ] **T8-09** Parcours DEPOSIT.
- [ ] **T8-10** Parcours WITHDRAWAL.
- [ ] **T8-11** Récapitulatif montant / frais / total débité.
- [ ] **T8-12** États : manquant, inexistant, indisponible, incompatible, contradictoire.
- [ ] **T8-13** Tests E2E desktop et mobile.

### P9 — Nettoyage et rapport

- [ ] **T9-01** Supprimer les wrappers dépréciés.
- [ ] **T9-02** Ajouter les contraintes finales (FK, unicité, checks).
- [ ] **T9-03** Réconciliation comptable finale.
- [ ] **T9-04** Typecheck, lint, build, tests.
- [ ] **T9-05** Rédiger `TRANSACTION-IMPLEMENTATION-REPORT.md`.

---

## 8. MATRICE DE TESTS MINIMALE

### 8.1 Administrateurs

- [ ] A émet vers un utilisateur.
- [ ] A émet vers un admin C.
- [ ] B émet vers un utilisateur.
- [ ] B émet vers un admin C.
- [ ] C ne peut pas émettre.
- [ ] C peut soumettre une demande.
- [ ] Une demande ne crédite rien avant approbation.
- [ ] A/B approuvent selon la politique.
- [ ] Le demandeur ne peut pas s'auto-approuver.
- [ ] Un rejet ne modifie aucun solde.
- [ ] Une demande ne peut pas être approuvée deux fois.
- [ ] Un non-admin ne peut pas appeler les actions admin.

### 8.2 Comptabilité

- [ ] Chaque émission équilibre les écritures.
- [ ] `SYSTEM_GTC_ISSUANCE` est correctement débité.
- [ ] Le destinataire est correctement crédité.
- [ ] Aucun wallet admin n'est débité pour une émission.
- [ ] Les rejeux sont idempotents.
- [ ] Un échec SQL ne laisse aucune écriture partielle.
- [ ] Les opérations concurrentes restent cohérentes.
- [ ] Les remboursements génèrent des écritures inverses.

### 8.3 Utilisateurs

- [ ] Transfert valide.
- [ ] Auto-transfert refusé.
- [ ] Solde insuffisant.
- [ ] Destinataire inexistant.
- [ ] Édition récupérée avec `editionId`.
- [ ] Édition fermée.
- [ ] Inscription déjà existante.
- [ ] Item indisponible.
- [ ] Prix modifié entre affichage et confirmation.
- [ ] Produit indisponible.
- [ ] Thème déjà possédé.
- [ ] Offre VIP invalide.
- [ ] Dépôt avec paramètres manquants.
- [ ] Retrait avec coordonnées invalides.

### 8.4 Interface

- [ ] Desktop.
- [ ] Mobile.
- [ ] Chargement.
- [ ] Vide.
- [ ] Erreurs.
- [ ] Confirmations.
- [ ] Navigation.
- [ ] Rafraîchissement.
- [ ] Filtres.
- [ ] Recherche.
- [ ] Accessibilité de base.
- [ ] Cohérence du thème.

---

## 9. QUALITÉ — À EXÉCUTER APRÈS CHAQUE PHASE

- [ ] `npm run typecheck` (ou script réel du projet).
- [ ] `npm run lint`.
- [ ] `npm run build`.
- [ ] Tests unitaires.
- [ ] Tests d'intégration.
- [ ] Tests E2E concernés.
- [ ] Vérification des imports.
- [ ] Vérification des Server Actions.
- [ ] Vérification des migrations.
- [ ] Vérification des régressions.
- [ ] Aucun `any` ajouté pour contourner une erreur.
- [ ] Aucun `@ts-ignore` non justifié.

---

## 10. DÉFINITION GLOBALE DE « TERMINÉ »

La refonte est terminée lorsque :

1. Tous les constats P0 sont corrigés et testés.
2. Tous les constats P1 sont corrigés ou explicitement reportés avec justification.
3. Un seul moteur financier est utilisé par tous les points d'entrée.
4. Le ledger est équilibré et contraint.
5. Aucun prix client n'atteint le ledger.
6. Les permissions A/B/C sont appliquées côté serveur.
7. Les émissions passent par `SYSTEM_GTC_ISSUANCE`.
8. Les demandes de crédit sont atomiques et idempotentes.
9. Les remboursements produisent des écritures inverses.
10. Les parcours utilisateur sont spécifiques par type.
11. L'interface admin est distincte de l'interface utilisateur.
12. Typecheck, lint, build et tests passent.
13. `TRANSACTION-IMPLEMENTATION-REPORT.md` est rédigé.
14. Aucune opération manuelle non documentée n'est nécessaire avant déploiement.

---

## 11. BLOCAGES CONNUS

- [ ] Validation utilisateur des plans requise avant de commencer.
- [ ] Validation des plafonds A/B/C proposés.
- [ ] Validation de la convention de frais.
- [ ] Validation du choix `ORDER_PURCHASE` vs `PRODUCT_PURCHASE`.
- [ ] Accès à une base de préprod pour les tests d'intégration et de migration.
- [ ] Décision sur les données historiques anomalies (refunds sans écriture, escrow négatif).

---

**Prochaine action : attendre la validation, puis démarrer par `PREP-01` et la Vague 0.**
