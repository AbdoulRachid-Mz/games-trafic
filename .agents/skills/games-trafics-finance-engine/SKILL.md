---
name: games-trafics-finance-engine
description: Référence obligatoire pour toute intervention sur le moteur financier de Games Trafics. À activer pour audit, correction, création ou refactor de transactions, wallets, ledger, frais, dépôts, retraits, transferts, commandes, inscriptions tournoi, achats VIP/thèmes/items, émissions/admin finance, idempotence, cooldown, PIN/passkey financier, API/routes/actions financières, ou réconciliation read-only. Aligne les changements sur le code réel, l'autorité serveur, le ledger double-entrée et les politiques métier.
---

# Games Trafics — Finance Engine

Ce skill définit les **invariants non négociables** et l'architecture cible/réelle du moteur financier. Il complète `games-trafics-ui-ux` (UX) sans le remplacer : toute UI financière doit respecter les deux.

## 1. Quand activer ce skill

Activer dès que la tâche touche, directement ou indirectement :

- `actions/{transactions,wallets,requests,orders,admin-finance,vip,themes,games,editions,edition-registrations,pin-reset,passkey-transaction}.ts`
- `lib/finance/**`, `lib/ledger/**`, `lib/wallet/**` (aspects financiers)
- `app/api/transactions/**`, routes/API/actions exposant ou exécutant une opération monétaire
- `database/schema.ts` (tables/contraintes/enums financiers) et migrations `drizzle/*finance*|*pin*|*wallet*|*ledger*` (additives/compatibles uniquement)
- wizard/écrans de transaction, confirmation, PIN/passkey, historique wallet/transactions
- docs `docs/content/{transactions,wallet,orders,vip}/**`, `ANALYSIS.md` (alignement comportement réel)

Ne pas activer pour un changement purement visuel sans impact sur montants, états, autorisations, exécution ou intégrité financière.

## 2. Invariants fondamentaux

1. **Autorité serveur exclusive.** Le client ne contrôle jamais le prix final, les frais, le statut, les comptes ledger, les approbations, les options système ou les privilèges financiers. Toute valeur client est une intention à revalider/recalculer.
2. **Recalcul serveur depuis la base.** Prix, frais, totaux, nets, bénéficiaires, soldes disponibles et éligibilités sont dérivés de données serveur/DB au moment de l'exécution.
3. **Prix fixe immuable, quantité calculée serveur.** Pour un produit/item/abonnement à prix fixe, le montant n'est pas éditable ; pour une quantité, le total = quantité × prix unitaire serveur. En cas de dérive tarifaire/politique, retourner `PRICE_CHANGED` (ne pas exécuter silencieusement).
4. **Moteur de frais unique et déterministe.** Utiliser `lib/finance/fees/fee-engine.ts` (`calculateTransactionFees` / politiques serveur). Ne pas accepter de `isVip`, taux ou total fourni par le client comme autorité d'exécution.
5. **Ledger double-entrée, source de vérité des soldes.** Écritures équilibrées via `postLedgerEntries`/`executeFinancialOperation`; soldes dérivés du ledger (`getAccountBalance*`), jamais de `balanceAfter` ou cache wallet comme autorité.
6. **Atomicité + idempotence + verrous.** Opérations sensibles dans une transaction DB, avec verrous/contraintes appropriés, clé d'idempotence déterministe (`scope` + `key` + hash payload via `lib/finance/core/{idempotency,hash}.ts`), réponses retry-safe. Les retries idempotents ne doivent pas re-exécuter l'effet.
7. **Cooldown financier utilisateur : 2 minutes, serveur, concurrence-safe.** Toute opération financière initiée par un utilisateur est soumise à un cooldown de 120s côté serveur (horloge serveur/DB, atomique/race-safe). Les retries strictement idempotents d'une même opération sont exemptés ; une nouvelle intention ne l'est pas.
8. **AuthN/AuthZ/éligibilité à l'exécution.** Re-vérifier session, propriété/ownership, état du wallet/compte (actif, non verrouillé, non supprimé/banni selon règles), permissions admin A/B/C, et règles métier au moment d'exécuter (pas seulement au rendu/UI/API d'entrée).
9. **Cycle de vie correct.** Aucun statut `COMPLETED` avant fin réelle du processus financier/métier requis. Dépôts/retraits = demandes (pas de crédit/débit utilisateur immédiat hors règles explicites de réservation/règlement). Approbations/admin via workflows dédiés.
10. **PIN/passkey lié à l'exécution.** La vérification PIN/passkey doit être validée serveur-side à l'exécution, liée à une intention/challenge à usage unique et aux paramètres exacts (montant/type/destinataire/frais/wallet) ; pas de simple flag client.
11. **Pas d'effets partiels/silencieux.** Échec explicite (`FinanceError`/erreurs métier), pas de débit/crédit partiel non journalisé, pas de négatif non autorisé, arrondis précis/contrôlés.
12. **Historique en lecture seule.** Diagnostiquer les anomalies existantes sans auto-correction destructive ; proposer uniquement des stratégies de réconciliation contrôlées. Pas de suppression/modification/recrédit automatique de l'historique.

## 3. Architecture canonique (réelle)

Consulter `references/architecture.md`, `references/invariants.md`, `references/workflows.md`.

**Noyau à privilégier :**
- Exécution : `lib/finance/core/transaction-engine.ts` (`executeFinancialOperation`)
- Ledger/solde : `lib/finance/core/ledger.ts`, `core/postings.ts`, `core/accounts.ts`
- Idempotence/hash : `lib/finance/core/idempotency.ts`, `core/hash.ts`
- Frais : `lib/finance/fees/fee-engine.ts` (`calculateTransactionFees`)
- Politiques/admin : `lib/finance/policies/{limits,admin-policy}.ts`
- Briques métier : `lib/finance/transactions/{transfer,issuance,refund,deposit,withdrawal,purchase,tournament}.ts`
- Demandes/crédit admin : `lib/finance/requests/{credit-requests,approval}.ts`
- Audit : `lib/finance/audit/audit-log.ts`
- Auth/permissions : `lib/auth/session.ts`, `lib/auth/permissions.ts`

**Chemins legacy/parallèles à éliminer ou ne pas étendre :**
- `lib/finance/ledger/ledger-engine.ts` (moteur parallèle exporté par `lib/finance/index.ts`)
- `lib/ledger/ledger-utils.ts` (façade rétro-compatible, `executeAtomicTransfer`/helpers parallèles)
- écritures directes de soldes/états financiers sur `userWallets` ou logique basée sur `balanceAfter`

## 4. Workflow obligatoire pour toute modification financière

1. **Cartographier** le chemin complet (UI → API/action → service finance → DB/ledger → statuts/audit) et les callers.
2. **Identifier** l'intention métier, le prix/frais serveur, le compte source/destination, l'idempotency key/scope, les verrous, le cooldown et les états avant/après.
3. **Centraliser** dans les services/politiques canoniques ; supprimer/contourner les chemins parallèles plutôt que d'en ajouter.
4. **Implémenter** serveur-first : validation, auth/ownership/éligibilité, pricing, frais, exécution atomique, audit.
5. **UI (si concernée)** : respecter `games-trafics-ui-ux`, afficher prix/frais/total/net/bénéficiaire/états réels, pas de faux upload/succès simulé, pas de montant éditable sur prix fixe.
6. **Vérifier** : `bun x tsc --noEmit`, `bun run lint`, tests ciblés `bun x vitest run ...`, puis `bun run build` si possible ; reporter les résultats réels.

## 5. Interdictions explicites

- Crédit/débit direct utilisateur hors flux canonique autorisé ; émission uniquement via flux d'émission/approbation prévu.
- `idempotencyKey` non déterministe pour une même opération métier (ex. `Date.now()` dans la clé d'exécution).
- `allowDuplicate`/`isSystem`/flags contournant les contrôles depuis une entrée non strictement interne et contrôlée.
- Mise à jour directe de `userWallets.balance`/soldes comme source de vérité.
- Statuts `COMPLETED` posés sans règlement/effet financier et métier effectif.
- Référence/screenshot de paiement imposé côté dépôt quand la règle exige une demande sans preuve obligatoire.
- Auto-réparation des données historiques en écriture.

## 6. Validation attendue

- [ ] Autorité serveur et recalcul des montants/frais confirmés au point d'exécution
- [ ] Auth, ownership, éligibilité, permissions et cooldown appliqués serveur-side
- [ ] Idempotence déterministe, atomicité et verrous/contraintes cohérents
- [ ] Ledger équilibré, soldes ledger-derived, pas de chemin parallèle introduit
- [ ] Statuts/workflows conformes (request/approval/escrow/payout/refund)
- [ ] UI alignée sur états réels et règles de pricing/PIN-passkey
- [ ] Vérifications techniques exécutées et résultats réels reportés
