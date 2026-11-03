# PLAN DE CORRECTION DES PRINCIPAUX CONSTATS

> **Source :** §0.3 « Ce qui est cassé, incohérent ou dangereux » et §5.10 « Failles et bugs finance » de `ANALYSIS.md`.
> **Statut :** planification uniquement — aucune correction appliquée.
> **Périmètre financier détaillé :** voir `TRANSACTION-AUDIT.md` et `TRANSACTION-IMPLEMENTATION-PLAN.md`.
> **Exécution :** la checklist actionnable est dans `TASK.md`.

---

## 1. OBJET

Ce document ordonne les corrections des constats critiques, élevés et moyens. Il ne remplace pas le plan de refonte financière : il décrit **quoi corriger, dans quel ordre, avec quels critères d'acceptation**.

Trois principes :

1. **Stopper les pertes financières avant d'embellir l'UI.**
2. **Fermer les surfaces non authentifiées avant d'ajouter des fonctionnalités.**
3. **Ne jamais corriger un symptôme en dupliquant une logique.**

---

## 2. PRIORISATION

| ID | Gravité | Constat | Zone | Dépend de |
|---|---|---|---|---|
| **P0-F1** | Critique | `actions/wallets.ts::createTransaction` non authentifiée, non atomique, création monétaire | Finance | — |
| **P0-F2** | Critique | `transferMoney` crée deux transactions et déséquilibre l'escrow | Finance | P0-F1 |
| **P0-F3** | Critique | Remboursement admin sans écriture ledger | Finance | P0-F1 |
| **P0-F4** | Critique | Transfert admin débité du wallet personnel de l'admin | Finance | P0-F1 |
| **P0-F5** | Critique | Prix client pour items, tournois, thèmes, VIP | Finance | P0-F1 |
| **P0-F6** | Critique | `approveRequest`/`rejectRequest` font confiance à `adminUserId` client | Finance | — |
| **P0-S1** | Critique | `/api/cookies` expose tous les cookies, dont la session | API | — |
| **P0-S2** | Critique | `/api/users` non authentifié : énumération et création | API | — |
| **P0-S3** | Critique | CRUD `/api/games` et `/api/services` non authentifié | API | — |
| **P0-S4** | Critique | Mutations `claims` et `app-settings` sans auth | Actions | — |
| **P1-F1** | Élevé | `joinEdition` payante ne déclenche aucun paiement | Tournois | P0-F1 |
| **P1-F2** | Élevé | Escrow des commandes structurellement négatif (frais comptés deux fois) | Commandes | P0-F1 |
| **P1-F3** | Élevé | Types frontend ≠ enum PostgreSQL | Types | — |
| **P1-F4** | Élevé | Absence d'idempotence réelle | Finance | P0-F1 |
| **P1-F5** | Élevé | `/api/transactions/calculate-fees` non authentifiée, total faux | API | — |
| **P1-A1** | Élevé | `/api/auth/profile?userId=` sans contrôle de visibilité | Auth | — |
| **P1-A2** | Élevé | Chat : actions font confiance aux IDs client (IDOR) | Social | — |
| **P1-A3** | Élevé | Upload de pièces jointes factice | Social | — |
| **P1-A4** | Élevé | `vipSubscriptions.userId` unique : renouvellement impossible | VIP | — |
| **P2-P1** | Moyen | Trois systèmes de permissions divergents, `level` ignoré par la finance | Permissions | P0-F1 |
| **P2-P2** | Moyen | `hasWallet` incohérent, FAB wallet désactivés | UI | — |
| **P2-P3** | Moyen | PWA : `waiting`/`controllerchange` non gérés | PWA | — |
| **P2-P4** | Moyen | `conversations.unreadCount` jamais incrémenté | Social | — |
| **P2-P5** | Moyen | Doublons structurels (API, stats, partage, upload) | Dette | — |
| **P2-P6** | Moyen | Contraintes ledger absentes (FK, unicité comptes système) | Schéma | P0-F1 |
| **P2-P7** | Moyen | `updateWalletBalance` no-op trompeur | Finance | P0-F1 |
| **P2-P8** | Moyen | Frais fail-open à 0 | Finance | P0-F1 |

---

## 3. VAGUES D'EXÉCUTION

### Vague 0 — Arrêter l'hémorragie financière

Objectif : rendre impossible toute création ou perte d'argent non contrôlée, **sans attendre la refonte UI**.

1. `P0-F1` Neutraliser le moteur parallèle.
2. `P0-F2` Supprimer `transferMoney` ou le faire déléguer au moteur sûr.
3. `P0-F3` Remboursement avec écriture inverse ou blocage explicite.
4. `P0-F4` Corriger la cible du transfert admin.
5. `P0-F5` Recalculer tous les prix côté serveur.
6. `P0-F6` Lire l'approbateur depuis la session.
7. `P2-P7` Supprimer le no-op `updateWalletBalance`.
8. `P2-P8` Rendre le calcul des frais non silencieux.

### Vague 1 — Fermer les surfaces non authentifiées

1. `P0-S1` Supprimer ou protéger `/api/cookies`.
2. `P0-S2` Protéger `/api/users`.
3. `P0-S3` Protéger `/api/games` et `/api/services`.
4. `P0-S4` Protéger les mutations `claims` et `app-settings`.
5. `P1-F5` Protéger le calcul des frais.
6. `P1-A1` Restreindre le profil par `userId`.

### Vague 2 — Intégrité comptable et métier

1. `P1-F2` Corriger l'escrow des commandes.
2. `P1-F1` Paiement d'inscription atomique.
3. `P1-F4` Idempotence.
4. `P1-F3` Harmoniser les types.
5. `P2-P6` Contraintes ledger.
6. `P1-A4` Renouvellement VIP.

### Vague 3 — Permissions et surfaces sociales

1. `P2-P1` Unifier les permissions.
2. `P1-A2` IDOR chat.
3. `P1-A3` Upload réel ou suppression.
4. `P2-P4` Compteur non lus.

### Vague 4 — Dette et UX

1. `P2-P2` `hasWallet`.
2. `P2-P3` PWA.
3. `P2-P5` Doublons structurels.
4. Refonte UI utilisateur/admin (voir plan transactions).

---

## 4. FICHES DE CORRECTION

### P0-F1 — Neutraliser le moteur parallèle

**Constat.** `actions/wallets.ts::createTransaction` insère une transaction et deux écritures sans `db.transaction`, sans auth, sans PIN. `spendTypes` omet `THEME_PURCHASE`, `TOURNAMENT_PARTICIPATION`, `PRODUCT_PURCHASE`, `ORDER_PURCHASE` : ces types sont traités comme des **crédits** depuis `SYSTEM_ADJUSTMENT`.

**Correction.**

- Remplacer le corps par un appel au moteur sûr, ou lever `DEPRECATED_USE_FINANCE_SERVICE`.
- Migrer `transferMoney`, `depositToWallet`, `actions/requests.ts` et `app/api/transactions/create` vers le service canonique.
- Ajouter un test qui prouve qu'aucun type de dépense n'est crédité.

**Fichiers.** `actions/wallets.ts`, `actions/requests.ts`, `app/api/transactions/create/route.ts`, `lib/finance/**`.

**Acceptation.**

- `createTransaction` de `actions/wallets.ts` n'écrit plus aucune ligne.
- Tous les appelants passent par le moteur sûr.
- Test : `THEME_PURCHASE`, `TOURNAMENT_PARTICIPATION`, `ORDER_PURCHASE` débitent, jamais ne créditent.

---

### P0-F2 — `transferMoney` et l'escrow

**Constat.** Deux transactions : débit → escrow, puis crédit depuis `SYSTEM_ADJUSTMENT`. L'escrow conserve les fonds, la plateforme crée la contrepartie, les frais ne vont pas à `PLATFORM_FEES`.

**Correction.** Un seul transfert `wallet source → wallet destination`, frais vers `PLATFORM_FEES`, atomique.

**Acceptation.**

- Une seule ligne `wallet_transactions` par transfert.
- `SUM(debit) = SUM(credit)`.
- Escrow inchangé.
- Frais crédités à `PLATFORM_FEES`.

---

### P0-F3 — Remboursement administratif

**Constat.** `app/admin/transactions/page.tsx::handleRefund` change le statut sans écriture. `refundTransaction` crée un `REFUND` depuis `SYSTEM_ADJUSTMENT`, sans inverser les écritures d'origine.

**Correction.** Un service `refund.ts` qui inverse les écritures d'origine, refuse le double remboursement et journalise l'opération. Le bouton admin appelle ce service, jamais `updateTransactionStatus`.

**Acceptation.**

- Impossible d'avoir `REFUNDED` sans transaction de remboursement liée.
- Les écritures inverses équilibrent le ledger.
- Un double clic ne rembourse pas deux fois.

---

### P0-F4 — Transfert admin

**Constat.** `handleActionConfirm` utilise `completeData.wallet.id`, wallet de l'admin connecté.

**Correction.** Supprimer le transfert depuis l'espace admin ou le remplacer par une **émission GTC** vers le destinataire. Ne jamais utiliser le wallet de l'admin comme source implicite.

**Acceptation.**

- Aucun débit du wallet admin lors d'une action admin.
- L'action est une émission ou un transfert explicitement approvisionné.
- Le récapitulatif indique la source réelle.

---

### P0-F5 — Prix côté serveur

**Constat.** `create/page.tsx::executeConfirm` calcule la quantité d'item à partir du prix client ; tournoi, thème et VIP envoient le montant client.

**Correction.** Chaque service relit le prix/les frais en base et ignore le montant client. Le client n'envoie que l'identifiant, la quantité et les choix.

**Acceptation.**

- Modifier le montant dans la requête ne change pas le débit.
- Le prix affiché et le prix débité sont identiques ou l'opération échoue avec `PRICE_CHANGED`.
- Tests pour item, tournoi, thème, VIP.

---

### P0-F6 — Approbateur de demande

**Constat.** `approveRequest(id, adminUserId)` et `rejectRequest(id, adminUserId, reason)` reçoivent l'identifiant de l'admin depuis le client.

**Correction.** Supprimer le paramètre `adminUserId` des signatures publiques. Lire la session serveur, vérifier `isAdmin` et `level`, puis journaliser.

**Acceptation.**

- Un appel direct avec un faux `adminUserId` est ignoré.
- Un non-admin ne peut ni approuver ni rejeter.
- Le demandeur ne peut pas approuver sa demande.

---

### P0-S1 — `/api/cookies`

**Constat.** Route non authentifiée qui retourne tous les cookies.

**Correction.** Supprimer la route si elle n'est pas indispensable. Sinon, exiger une session admin A et ne jamais retourner les cookies de session.

**Acceptation.** `401` sans session, `403` sans niveau A, aucun cookie de session dans la réponse.

---

### P0-S2 — `/api/users`

**Constat.** `GET`/`POST` non authentifiés : énumération d'emails/téléphones et création d'utilisateurs.

**Correction.** `GET` : admin uniquement, projection minimale. `POST` : inscription contrôlée ou admin A. Rate limiting.

**Acceptation.** `401` anonyme, `403` non admin, pas d'énumération, création tracée.

---

### P0-S3 — `/api/games` et `/api/services`

**Constat.** CRUD non authentifié.

**Correction.** Lecture publique si justifiée ; écriture admin A/B. Validation Zod.

**Acceptation.** Écriture anonyme refusée ; lecture conforme à la politique.

---

### P0-S4 — `claims` et `app-settings`

**Constat.** `createClaim`, `updateClaim`, `updateClaimStatus`, `deleteClaim`, `updateTransactionFees`, `updateVipPricing`, `resetAppSettings` sans auth.

**Correction.** Auth + permission (`claim:create` pour l'utilisateur, `settings:write` admin A). Les frais et prix VIP sont réservés au niveau A.

**Acceptation.** Toute mutation anonyme échoue ; les modifications de frais sont auditées.

---

### P1-F1 — Inscription payante

**Constat.** `joinEdition` s'arrête à `paymentRequired` sans déclencher de paiement.

**Correction.** Service `tournament.ts` : vérifier l'édition, réserver la place, débiter, créer l'inscription et le paiement dans une seule transaction. Si le paiement échoue, aucune inscription.

**Acceptation.** Aucune inscription payée sans débit, aucun débit sans inscription. Test de la dernière place en concurrence.

---

### P1-F2 — Escrow des commandes

**Constat.** Frais appliqués à la capture (`ORDER_PURCHASE`) puis à la sortie (`TRANSFER`). L'escrow est débité du prix plein alors qu'il a reçu le net.

**Correction.** Capture : débit acheteur = crédit escrow, sans frais. Finalisation : débit escrow = crédit vendeur + commission plateforme. Un seul prélèvement de commission.

**Acceptation.** Escrow ≥ 0 après chaque étape. `SUM(debit) = SUM(credit)`. Rejet : remboursement exact.

---

### P1-F3 — Types

**Constat.** `PRODUCT_PURCHASE` (front) absent de la base ; `PURCHASE`, `ORDER_PURCHASE`, `BONUS`, `REFUND` absents du front.

**Correction.** Type canonique dérivé de Drizzle. `ORDER_PURCHASE` pour les produits. Configurations UI complétées.

**Acceptation.** Aucune valeur TypeScript sans équivalent PostgreSQL. Tests de compilation et de sérialisation.

---

### P1-F4 — Idempotence

**Constat.** Cooldown de 60 s/120 s, aucune clé unique.

**Correction.** Table `idempotency_keys`, hash de requête, contrainte unique, rejeu retournant le résultat initial.

**Acceptation.** Deux requêtes identiques → un seul débit. Même clé + payload différent → `409`.

---

### P1-F5 — API de frais

**Constat.** Non authentifiée, utilise `settings`, retourne `totalAmount = amount`.

**Correction.** Auth, validation du type, appel du moteur de frais, retour `{fees, totalDebit, netAmount}`.

**Acceptation.** `401` anonyme ; total cohérent avec la convention ; tests.

---

### P1-A1 — Profil par `userId`

**Correction.** Vérifier la session, la visibilité du profil et limiter les relations retournées.

**Acceptation.** Un utilisateur ne peut pas lire les données privées d'un autre.

---

### P1-A2 — IDOR chat

**Correction.** Vérifier l'appartenance aux conversations/groupes avant toute action. Ne jamais faire confiance à `senderId`, `groupId` ou `recipientId` fournis.

**Acceptation.** Tests d'accès croisés.

---

### P1-A3 — Pièces jointes

**Correction.** Implémenter le stockage réel ou retirer l'upload factice. Vérifier type MIME, taille, propriétaire.

**Acceptation.** Un fichier envoyé est réellement stocké et retrievable ; aucun faux succès.

---

### P1-A4 — VIP

**Correction.** Remplacer l'unicité globale par un index partiel sur les abonnements actifs. Vérifier l'offre et la durée côté serveur.

**Acceptation.** Renouvellement après expiration possible ; un seul actif à la fois.

---

### P2-P1 — Permissions

**Correction.** Un module `lib/auth/permissions.ts` unique : rôles, `isAdmin`, `level`, contexte financier. Les gardes serveur sont obligatoires ; l'UI ne fait qu'afficher.

**Acceptation.** Une matrice de tests couvre chaque action × chaque niveau.

---

### P2-P2 — `hasWallet`

**Correction.** Une seule source : le wallet réellement chargé. Supprimer les valeurs par défaut contradictoires.

**Acceptation.** Le FAB et les actions wallet sont cohérents sur tous les chemins.

---

### P2-P3 — PWA

**Correction.** Gérer `waiting`, `controllerchange`, nettoyer le code mort.

**Acceptation.** Mise à jour contrôlée, pas de double rechargement.

---

### P2-P4 — Non lus

**Correction.** Incrémenter/décrémenter dans les actions de message, ou calculer à la lecture.

**Acceptation.** Badge cohérent après envoi/lecture.

---

### P2-P5 — Doublons

**Correction.** Un seul handler API, un seul `getUserStats`, un seul helper de partage, un seul chemin d'upload.

**Acceptation.** Les doublons sont supprimés ou fusionnés, pas masqués.

---

### P2-P6 — Contraintes ledger

**Correction.** FK `ledger_entries.transaction_id`, unicité des comptes système, checks débit/crédit.

**Acceptation.** Les anomalies historiques sont traitées avant contrainte ; aucune perte de données.

---

### P2-P7 — `updateWalletBalance`

**Correction.** Supprimer la fonction ou la remplacer par une opération ledger explicite.

**Acceptation.** Aucun appel ne promet une modification de solde sans écriture.

---

### P2-P8 — Frais fail-open

**Correction.** En cas d'erreur de lecture des paramètres, échouer avec `FEE_POLICY_UNAVAILABLE` ou utiliser un fallback explicitement configuré et audité.

**Acceptation.** Aucun frais silencieusement à 0.

---

## 5. CRITÈRES D'ACCEPTATION GLOBAUX

Une correction n'est « terminée » que si :

1. Le constat est reproduit par un test avant correction.
2. Le test échoue avant, passe après.
3. Aucun `any`, `@ts-ignore` ou lint désactivé sans justification.
4. Les permissions sont vérifiées côté serveur.
5. Les erreurs sont typées et ne fuient pas d'information sensible.
6. Les tests existants restent verts.
7. Le typecheck, le lint et le build passent.
8. La documentation concernée est mise à jour.

---

## 6. ORDRE RECOMMANDÉ (RÉSUMÉ)

```text
1. P0-F1 → P0-F2 → P0-F3 → P0-F4 → P0-F5 → P0-F6
2. P0-S1 → P0-S2 → P0-S3 → P0-S4
3. P1-F5 → P1-F1 → P1-F2 → P1-F4 → P1-F3
4. P1-A1 → P1-A2 → P1-A3 → P1-A4
5. P2-P1 → P2-P6 → P2-P7 → P2-P8
6. P2-P2 → P2-P3 → P2-P4 → P2-P5
7. Refonte UI utilisateur/admin
```

La refonte UI vient **après** la sécurisation du backend. Une belle interface branchée sur un moteur non sûr ne fait qu'accélérer la perte.

---

## 7. HORS PÉRIMÈTRE DE CETTE ÉTAPE

- Aucune correction appliquée.
- Aucune migration.
- Aucun composant modifié.
- Aucune suppression de fichier.

**Prochaine action : validation de ce plan et de `TRANSACTION-IMPLEMENTATION-PLAN.md`, puis exécution de `TASK.md`.**
