# Shops & Produits

L'écosystème **Games-Trafics** permet aux partenaires et aux utilisateurs certifiés de créer leur propre espace de vente.

## 🧩 Vue d'ensemble

Un **Shop** est une boutique virtuelle associée à un utilisateur ou une entité. Elle peut contenir :
- **Produits Physiques/Digitaux** : Clés de jeux, skins, matériel.
- **Services** : Coaching, boost de compte, design de logo.
- **Catégories** : Organisation logique des articles.

## ⚙️ Fonctionnement

Chaque boutique dispose d'un inventaire géré dynamiquement.
1. **Création** : Un utilisateur demande l'ouverture d'une boutique.
2. **Ajout d'Articles** : Définition du prix (en GTC), de la description et des images.
3. **Gestion des Stocks** : Mise à jour automatique ou manuelle des quantités disponibles.

### Validation :
Toute nouvelle boutique ou produit passe par une phase de @beautifulMention(Modération) pour garantir la sécurité des acheteurs.

## 👤 Côté utilisateur

Les acheteurs parcourent la **Marketplace**, ajoutent des articles à leur panier et règlent via leur @beautifulMention(Wallet GTC). Ils peuvent laisser des avis et noter les vendeurs.

## 🧠 Logique métier

Lors d'un achat, les GTC sont transférés du wallet de l'acheteur vers un compte d'attente. Ils ne sont libérés au vendeur que lorsque l'acheteur confirme la réception du produit ou du service.

## 🔗 Relations
- **Users** : Propriétaires des boutiques.
- **Orders** : Historique des ventes et achats.
- **GTC** : Monnaie de transaction.

## 🖼️ Illustration

![Shop Management](/docs/images/shop-management.png)
