<p align="center">
  <img src="public/icons/gt-primary.png" alt="Games-Trafics Logo" width="240" height="240" />
</p>

# 🎮 Games-Trafics

> *"Joue, échange, domine — L'infini du gaming commence ici."*

**Games-Trafics** est une plateforme web moderne et premium dédiée à l'écosystème du gaming compétitif et communautaire. Elle combine la gestion avancée de tournois e-sport, une marketplace de jeux et services, un système de streaming de clips vidéo, un portefeuille financier sécurisé intégré, ainsi qu'un système de layout réactif et adaptatif (App Shell pilotable dynamiquement, dock responsive, scroll-reveal et carousels).

---

## 🚀 Fonctionnalités Principales

- **Compétition & Tournois** :
  - Création de tournois et gestion complète des éditions.
  - Page de détails d'édition avec en-tête hero e-sport, tabs à défilement scroll-reveal synchronisés avec le App Shell (sans décalage de contenu).
  - Moteur dynamique de brackets de playoffs (simples/doubles éliminations, groupes, rondes suisses).
  - Page dédiée de révélation de structure 3D e-sport (`/reveal`) avec déclencheur unique par utilisateur (`localStorage`).
  - Carousels fluides d'éditions associées (« Autres éditions de ce tournoi » et « Éditions similaires »).
  - Suivi en temps réel des matchs, MVPs, classements et calendrier officiel.
- **Portefeuille Numérique & Transactions** : Portefeuille sécurisé, rechargement, transferts P2P, génération et scan de QR codes dynamiques, sécurisation des opérations par code PIN chiffré AES-256-GCM.
- **Marketplace Gaming** : Boutiques officielles et marchands partenaires, vente d'articles gaming, gestion de commandes et paiements instantanés.
- **Communauté & Game Clips** : Partage de clips de gameplay, flux interactifs, système d'interactions, chat temps réel et messagerie instantanée.
- **App Shell & Expérience Utilisateur** :
  - Pilotage centralisé et dynamique du layout (`stores/app-shell-store.ts`) avec support des surcharges temporaires par composant (`requestOverride` / `clearOverride`).
  - Header Dashboard et Top Middle avec masquage au défilement descendant et réapparition fluide au défilement montant (scroll-reveal via Framer Motion).
  - Floating Action Button responsive intégré directement au Dock (4 éléments max sur mobile/tablette, 6 max sur desktop, défilement horizontal fluide et bouton d'action `+` fixe à droite).
- **Système de Notifications Multi-Canal** :
  - **WhatsApp Cloud API** : Notifications instantanées de tournois, inscriptions, programmation de matchs et alertes financières sur WhatsApp.
  - **Email Transactionnel (Resend)** : Templates HTML e-sport responsive avec confirmation d'inscription, reçus et récapitulatifs de matchs.
  - **Web Push (VAPID)** : Notifications natives navigateur et PWA avec signature cryptographique VAPID.
  - **In-App** : Centre de notifications temps réel avec badge flottant, marquer comme lu et pagination infinie.
  - **Dispatcher intelligent** : Routage automatique selon les préférences granulaires de l'utilisateur (`lib/notifications`).
- **Administration & Modération** : Console d'administration centralisée, gestion des rôles, modération des utilisateurs, audits et monitoring financier.

---

## 🛠️ Stack Technique

- **Framework Web** : [Next.js 16.4.3](https://nextjs.org/) (App Router, Turbopack, Partial Prefetching)
- **Langage** : [TypeScript](https://www.typescriptlang.org/) (Mode strict, typage intégral sans régression)
- **Base de Données & ORM** : PostgreSQL managé avec [Drizzle ORM](https://orm.drizzle.team/)
- **Authentification & Sessions** : [Better-Auth](https://www.better-auth.com/) avec cookies HTTP-Only sécurisés et support Passkey
- **Gestion d'État UI** : [Zustand](https://github.com/pmndrs/zustand) (`app-shell-store.ts` avec gestion des offsets réels et priorités de superposition)
- **Style & Animation** : [Tailwind CSS](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/), Radix UI, Lucide Icons
- **Sécurité** : Chiffrement AES-256-GCM (`lib/encryption.ts`), protection anti-Open Redirect (`lib/routes/safe-redirect.ts`), proxy de contrôle de route (`proxy.ts`)
- **Tests Automatisés** : [Vitest](https://vitest.dev/) (270 tests unitaires et d'intégration validés, 29 suites de tests)

---

## 📁 Architecture et Documentation Détaillée

Pour explorer en détail chaque composant du projet, consultez la documentation dédiée :

- 🏛️ **[ARCHITECTURE.md](./ARCHITECTURE.md)** : Cartographie globale, schémas Mermaid d'architecture, App Shell, sécurité, sessions et performances.
- 📱 **[app/README.md](./app/README.md)** : Structure des pages Next.js, groupes de routes, hiérarchie des layouts et navigation.
- 🌐 **[app/api/README.md](./app/api/README.md)** : Spécifications des Route Handlers REST, contrats d'entrée/sortie et flux.
- ⚡ **[actions/README.md](./actions/README.md)** : Server Actions, mutations métier, tournois, inscriptions et finances.

---

## 📦 Installation et Démarrage

### Prérequis
- [Bun](https://bun.sh/) (recommandé) ou Node.js 20+
- Une instance PostgreSQL configurée (ex: Neon DB)

### 1. Cloner le projet et installer les dépendances
```bash
bun install
```

### 2. Configurer les variables d'environnement
Créez un fichier `.env` ou `.env.local` à la racine :
```env
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
BETTER_AUTH_SECRET="votre_secret_super_securise"
BETTER_AUTH_URL="http://localhost:3000"
ENCRYPTION_KEY="cle_hex_32_octets_pour_aes_256"
```

### 3. Lancer les migrations
```bash
bun run db:push
```

### 4. Démarrer en développement
```bash
bun run dev
```
L'application est accessible sur [http://localhost:3000](http://localhost:3000).

---

## 🧪 Tests et Vérifications Qualité

```bash
# Exécuter les 270 tests unitaires et de sécurité
bun run test

# Vérification du typage TypeScript
bunx tsc --noEmit

# Vérification du linter
bun run lint
```

---

## 🔒 Sécurité et Bonnes Pratiques

1. **Aucun secret exposé** : Les clés privées et secrets de signature restent strictement réservés à l'environnement serveur.
2. **Protection CSRF & Open Redirect** : Validation rigoureuse des redirections et des en-têtes d'origine.
3. **Sécurité des Portefeuilles** : Toutes les transactions requièrent la validation cryptographique du code PIN.
4. **App Shell Invariants** : Nettoyage systématique des surcharges de layout lors des transitions de route.
