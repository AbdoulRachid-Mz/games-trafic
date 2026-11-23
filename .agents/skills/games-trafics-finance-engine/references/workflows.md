# Workflows financiers — règles métier et états

> Référence les briques réelles (`lib/finance/transactions/*`, `requests/*`, actions/API). Tout écart code/règle doit être corrigé côté serveur canonique.

## 1. Dépôts (argent entrant)

- **Modèle attendu :** création de **demande** (`requests` type dépôt ou flux équivalent) en état initial non crédité (`PENDING`/équivalent) ; **aucun crédit utilisateur immédiat** à la création.
- **Preuves :** pas de référence de paiement externe ni de screenshot obligatoires au niveau métier/UX si la règle projet l'impose ; si fournis, upload/stockage doit être sécurisé et optionnel.
- **Approbation :** `executeDepositApproval` (`lib/finance/transactions/deposit.ts`) crédite le net au wallet bénéficiaire depuis `SYSTEM_EXTERNAL_CLEARING`, frais éventuels vers `PLATFORM_FEES`, idempotence `deposit:approval` / `deposit-request:{requestId}`.
- **Refus/annulation :** aucun mouvement ledger de crédit utilisateur ; statuts cohérents et audit.

## 2. Retraits (argent sortant)

- **Modèle attendu :** demande utilisateur ; fonds réservés/bloqués selon politique pour éviter double spend, puis règlement après approbation.
- **Réservation :** `reserveWithdrawal` débite `montant + frais` du wallet, crédite `ESCROW` du brut et `FEES` des frais, transaction `PENDING` (phase réservation), idempotence `withdrawal:reservation` / `withdrawal-reserve:{requestId}`.
- **Approbation/règlement :** `executeWithdrawalApproval` vide l'escrow vers `SYSTEM_EXTERNAL_CLEARING` (ou chemin historique contrôlé si non réservé) ; marquer complété uniquement quand le règlement financier du flux est effectif selon la règle retenue.
- **Rejet :** `executeWithdrawalRejection` annule la réservation (escrow+frais -> wallet, remboursement/contrepassation cohérente), idempotence `withdrawal:rejection`.
- Toujours recalculer frais/montants serveur-side, vérifier ownership, solde suffisant, état wallet/compte et permissions approbateur.

## 3. Transferts wallet → wallet

- Exécutés via brique canonique (`executeTransfer` / `executeFinancialOperation` kind `TRANSFER`) : payeur débité `montant + frais`, bénéficiaire crédité du montant, frais à `PLATFORM_FEES`.
- Interdire transfert vers soi-même si non autorisé, vérifier comptes/wallets distincts et utilisables, appliquer cooldown 2 min utilisateur et idempotence déterministe.
- Actions/API ne doivent pas exposer de contournement (ex. admin/system flags non contrôlés).

## 4. Émissions GTC et demandes de crédit admin

- **Émission directe :** `executeIssuance`/`issueGtcDirect` (`lib/finance/transactions/issuance.ts`) — contrepartie `SYSTEM_GTC_ISSUANCE` (négatif autorisé), aucun wallet admin débité, motif obligatoire, plafonds/politique A/B/C et audit.
- **Demandes de crédit :** `transaction_credit_requests` via `lib/finance/requests/credit-requests.ts` ; **aucun mouvement ledger avant approbation**.
- **Approbation/rejet :** `lib/finance/requests/approval.ts` + `policies/admin-policy.ts` (pas d'auto-approbation, règles B/C, seuil double approbation/A selon politique). Idempotence et traçabilité obligatoires.
- `actions/admin-finance.ts` est la façade serveur ; toute autre voie doit être alignée ou supprimée.

## 5. Commandes produits / marketplace

- **Capture/escrow :** acheteur → `ESCROW` du montant brut (sans frais acheteur côté capture selon builder actuel) ; produit réservé/verrouillé selon disponibilité.
- **Paiement vendeur :** `ESCROW` → vendeur (net) + `PLATFORM_FEES` (commission) après conditions métier remplies (approbation shop/admin/confirmation selon flux réel retenu).
- **Remboursement/annulation :** via mécanisme de refund/cancellation cohérent avec réservation/escrow et statut commande ; pas de double payout/refund.
- Interdictions : auto-achat, modification/suppression d'un produit vendu/payé/verrouillé selon règles, montants client imposés.

## 6. Tournois / éditions

- Inscription/participation payante : tarif d'entrée serveur (`edition.entryFee`/source DB), frais calculés serveur, postings/totaux cohérents (participant débité `entryFee + frais`, pool/crédits/frais selon `tournament` builders).
- **Organisateur** : rejoint sa propre édition gratuitement (aucun paiement requis).
- Idempotence stable par édition+utilisateur/intention ; gérer capacité, éligibilité, état édition, et remboursements selon règles d'annulation.
- `PRICE_CHANGED` si le tarif/frais effectif ne correspond plus à l'intention validée au moment d'exécution.

## 7. VIP, thèmes, items de jeu

- **VIP :** prix dérivé de la politique/app settings serveur, pas de nouvel abonnement si actif/non expiré selon règles, paiement/exécution via flux financier canonique atomique.
- **Thèmes :** achat payant doit débiter/créditer via moteur financier canonique (pas simple insertion `themePurchases` + prix client), prix serveur, idempotence, ownership/licence.
- **Items de jeu :** demande/achat/fulfillment ne doit pas marquer `COMPLETED` sans traitement financier requis ; distinguer clairement demande, paiement, livraison/traitement et échec/remboursement.

## 8. Remboursements

- `executeRefund` (`lib/finance/transactions/refund.ts`) : basé sur session/permissions (ou acteur interne contrôlé), inversion des écritures d'origine, support partiel/cumulatif selon reliquat, traçabilité et audit.
- Ne rembourser que des transactions/états éligibles ; prévenir dépassement du remboursable ; mettre à jour objets métier liés dans la même logique transactionnelle quand requis.

## 9. Wizard transaction / PIN / passkey (UX + exécution)

- Le wizard doit refléter le type/pricing mode réel : montant masqué/non éditable en prix fixe, quantité pour items quantifiables, montant libre uniquement quand autorisé.
- Afficher clairement : demande créée vs en attente/approuvée/complétée/échouée/remboursée, frais/total/net/bénéficiaire calculés serveur.
- PIN/passkey : capture UX possible côté client, mais **validation et consommation serveur-side à l'exécution** sur intention liée et à usage unique. Pas de simulation d'upload ni de succès local sans résultat serveur confirmé.
