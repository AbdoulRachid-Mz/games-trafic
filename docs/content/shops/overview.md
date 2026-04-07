---
title: "Boutiques & Produits (comptes)"
description: "Création, gestion et vente sur la Marketplace intégrée."
category: "Shops"
order: 3
---

# Boutiques & Marketplace

## 🧩 Vue d’ensemble
L'application propose des outils de E-Commerce complets avec les <beautifulMention>Boutiques</beautifulMention>. Chaque utilisateur ou équipe peut avoir sa propre boutique (selon conditions) et ses produits (comptes) mis à la vente globale sur l'espace central.

<Callout type="tip" title="Monétisation">
La Marketplace permet la revente de matériel de jeu, de designs virtuels ou encore l'achat d'abonnements.
</Callout>

## ⚙️ Fonctionnement

L'espace e-commerce de Games-Trafics s'organise en 3 axes :
- **Shops** : Identité globale (bannière, descriptions, devises).
- **Categories** : Structuration hiérarchique pour la segmentation catalogue (ex: Accessoires, Assets Numériques).
- **Produits** : Attributs spécifiques (images, variantes). L'interface produit implique du multi-upload sophistiqué, parfois protégé pour des services spécifiques.

## 👤 Côté utilisateur

**Acheteur :**
- L'utilisateur dispose de listes, tri par collections et paiements extrêmement fluides (puisés sur le `Wallet GTC`).
- Accès facile au tracking de commandes (digital ou physique).

**Vendeur :**
- Dashboard métier privé (`/shops/dashboard`) avec un constructeur visuel performant.
- `AutoSyncField` : Des formulaires modernes qui s'enregistrent instantanément sans besoin d'appuyer sur Save à chaque fois (autosauvegarde et revalidation SSR).

## 🧠 Logique métier
- La table *shops* a une relation forte (1 : N) vers `products`.
- Les produits peuvent être *Soft Deleted* (masqués) ou passés en status "ARCHIVED" afin de protéger les archives de commandes (`orders`) passées. Lève par contre l'affichage dans la marketplace.

## 🔗 Relations
- Tout est lié de façon transparente aux **Orders**. 
- Le compte vendeur dispose d'un wallet spécifique séparable qui va agréger les profits après prélèvement d'éventuelles commissions de la plateforme.

## 📊 Cas d’usage
- Romain possède un grand stock de cartes in-game qu'il vend physiquement. 
- Il crée une boutique, paramètre la catégorie "Hardware" et publie 5 objets avec photo multi-upload. 
- Dès qu'un objet est vendu, son compteur "Stock" baisse à 0 et empêche une nouvelle commande.

## 🖼️ Illustration
![Shop Configuration](/docs/images/shop-dashboard.png)
