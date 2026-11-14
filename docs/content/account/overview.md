---
title: "Compte & Sécurité"
description: "Gestion du profil utilisateur, vérification d'identité, authentification et paramètres de sécurité."
category: "Compte"
order: 2
---

# Compte Utilisateur & Sécurité

Votre compte **Games-Trafics** est le centre névralgique de votre expérience sur la plateforme. Il regroupe vos informations d'identité, vos statistiques de tournois, votre réputation et l'accès à votre Wallet GTC.

<Callout type="info" title="Sécurité Renforcée">
Nous prenons la protection de vos identifiants au sérieux. Games-Trafics intègre l'authentification moderne avec support des Passkeys (empreinte digitale, Face ID, clé de sécurité FIDO2).
</Callout>

---

## 🧩 Structure d'un Compte

Chaque utilisateur dispose de :
- **Un Profil Public** : Pseudo unique, photo d'avatar, bio, pays de résidence, badges de réputation (Vérifié, VIP).
- **Des Identifiants de Connexion** : Adresse email vérifiée, mot de passe robuste ou Passkey.
- **Un Wallet GTC associé** : Créé automatiquement dès votre inscription.
- **Un Rôle Système** : Détermine vos permissions (`BUYER`, `SELLER`, `TRADER`, `TOURNAMENT_ORGANIZER`, `ADMIN`).

---

## ⚙️ Processus de Vérification (KYC)

Pour les utilisateurs qui souhaitent créer une boutique, organiser des tournois à cash-prize élevé ou effectuer des retraits volumineux, un processus de vérification est disponible :

1. **Statut `PENDING`** : Vous soumettez vos pièces justificatives (pièce d'identité officielle, informations de contact).
2. **Examen par l'Administration** : L'équipe de modération analyse les documents sous 24 à 48 heures.
3. **Statut `VERIFIED`** : Votre compte reçoit le badge vérifié officiel, débloquant des limites étendues.
4. **Statut `REJECTED`** : En cas de document illisible ou non conforme, un motif est fourni et vous pouvez soumettre une nouvelle demande.

---

## 🔑 Authentification & Passkeys

Games-Trafics s'appuie sur le framework d'authentification Better-Auth :
- **Connexion par Email / Mot de Passe** avec hachage cryptographique sécurisé.
- **Passkeys (WebAuthn)** : Connectez-vous en un instant sans mot de passe à l'aide du capteur biométrique de votre appareil (téléphone, ordinateur).
- **Sessions Multi-Appareils** : Consultez la liste de vos sessions actives et déconnectez les appareils suspects en un clic depuis vos paramètres.

---

## 🛡️ Protection du Wallet par Code PIN

Indépendamment de votre mot de passe de compte, les opérations financières sensibles nécessitent votre **Code PIN Wallet** :
- Définition du code à la création du wallet.
- Demande systématique lors d'un transfert ou d'un retrait.
- Blocage temporaire après plusieurs tentatives infructueuses pour prévenir les attaques par force brute.

---

## 👤 Paramètres du Profil

Dans l'onglet `/settings/profile`, vous pouvez à tout moment :
- Mettre à jour votre avatar et votre bannière.
- Renseigner vos réseaux sociaux et vos identifiants gaming (PlayStation Network, Xbox Live, Steam, Riot ID).
- Ajuster vos préférences de notification (email, alertes in-app).
