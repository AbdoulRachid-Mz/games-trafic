🎯 Objectif global

Refactoriser le système de création et gestion des transactions pour :

Corriger le flow des étapes (stepper)
Améliorer la logique métier (providers obligatoires)
Simplifier l’UX (moins d’infos inutiles)
Ajouter une page détail transaction
Générer un reçu PDF premium
Améliorer la navigation et la cohérence globale
🧠 1. ANALYSE AVANT TOUT (OBLIGATOIRE)

Avant toute modification, analyser :

create-transaction page
composants des étapes (stepper)
hooks (useTransaction / useWallet)
actions backend (createTransaction, validate, etc.)

types de transaction :
  | 'THEME_PURCHASE'
  | 'VIP_SUBSCRIPTION'
  | 'PRODUCT_PURCHASE'
  | 'TOURNAMENT_PARTICIPATION'
  | 'GAME_ITEM_PURCHASE'
  | 'DEPOSIT'
  | 'WITHDRAWAL'
  | 'TRANSFER';
❗ 2. PROBLÈME PRINCIPAL (STEP FLOW)
🐛 Bug actuel

Quand le type est passé via params :

la 1ère étape (choix fournisseur) est skip
→ donc pas de provider
→ erreur dans validation finale
✅ CORRECTION
🔒 Règle obligatoire

TOUTES les transactions doivent commencer par la sélection du fournisseur

🔁 Nouveau flow (OBLIGATOIRE)
Étape 1 → Choix fournisseur
Étape 2 → Informations paiement
Étape 3 → Récapitulatif
Étape 4 → Validation
⚙️ Implémentation
Même si type vient de l’URL :
👉 NE PAS skip étape 1
👉 Pré-remplir type uniquement
Bloquer progression si :
provider == null
💳 3. FOURNISSEURS (NIGER — IMPORTANT)

Ajouter providers :

📱 Mobile Money
Airtel Money
Zamani
🏦 Banques
NITA
Amana TA
🎯 UX
Cards avec :
logo
nom
type (mobile / bank)
sélection visuelle (active state)
🧹 4. SIMPLIFICATION UX
❌ Supprimer dans UI :
transactionId (pendant création)
infos techniques inutiles
✅ Garder uniquement :
fournisseur
montant
utilisateur cible (si besoin)
description
📄 5. PAGE DÉTAIL TRANSACTION
📍 Nouvelle route
/wallet/transactions/[transactionId]
📊 Contenu
🧾 Infos principales
Montant
Type
Statut
Date
👤 Parties concernées
Cas 1 : Achat produit
Acheteur
Boutique
Cas 2 : Wallet / dépôt
Utilisateur
Application
Cas 3 : Tournoi
Joueur
Édition
⚙️ Actions
📥 Télécharger PDF
🔗 Partager
📋 Copier ID / infos
🧾 6. GÉNÉRATION PDF (PREMIUM)
🎯 Objectif

Créer un reçu professionnel (type Stripe / PayPal)

🎨 Design
Header
Logo app
Nom : Games-Trafics
Email / contact
Body
🧾 Détails
ID transaction
Date
Type
Statut
💰 Paiement
Montant
Méthode (provider)
👥 Parties
Expéditeur
Destinataire
Footer

Message :

"Merci d'utiliser Games-Trafics"

Contact support
⚙️ Technique
Génération côté serveur
export PDF (download)
📋 7. PAGE LISTE TRANSACTIONS
📍 /wallet/transactions
✅ Ajout

Pour chaque transaction :

👉 bouton :

Voir détails →
🎯 UX
card cliquable
accès rapide au détail
🔄 8. COHÉRENCE LOGIQUE
🔒 Validation stricte

Impossible de créer une transaction si :

provider non sélectionné
montant invalide
participants manquants
🔁 Gestion des types

Chaque type adapte :

Type	Spécificité
Deposit	provider obligatoire
Withdrawal	provider obligatoire
Transfer	utilisateur cible
Payment	order / service
🧠 9. BONUS (RECOMMANDÉ)
🔔 Notifications
succès transaction
échec
📊 Statut visuel
pending
success
failed
📱 Mobile UX
stepper fluide
boutons sticky
✅ RÉSULTAT ATTENDU
Flow transaction sans bug
UX simple et claire
Providers adaptés au Niger 🇳🇪
Page détail complète
PDF professionnel
Navigation fluide