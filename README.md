# 🎮 Games-Trafics

> *"Joue, échange, domine — L'infini du gaming commence ici."*

**Games-Trafics** est une plateforme web moderne dédiée à l'écosystème du gaming compétitif et communautaire. Elle combine la gestion avancée de tournois e-sport, une marketplace de jeux et services, un système de streaming de clips vidéo et un portefeuille financier sécurisé intégré.

---

## 🚀 Fonctionnalités Principales

- **Compétition & Tournois** : Création de tournois, gestion des éditions, arbres de tournois (brackets simples/doubles éliminations, groupes, rondes suisses), suivi en temps réel des matchs et classements.
- **Portefeuille Numérique & Transactions** : Portefeuille sécurisé, rechargement, transferts P2P, génération et scan de QR codes, sécurisation des opérations par code PIN chiffré AES-256-GCM.
- **Marketplace Gaming** : Boutiques officielles et marchands partenaires, vente d'articles gaming, gestion de commandes et paiements.
- **Communauté & Game Clips** : Partage de clips de gameplay, flux interactifs, système d'interactions et messagerie instantanée.
- **Administration & Modération** : Console d'administration centralisée, gestion des rôles, modération des utilisateurs et des contenus.

---

## 🛠️ Stack Technique

- **Framework** : [Next.js 16.4.3](https://nextjs.org/) (App Router, Turbopack, Partial Prefetching)
- **Langage** : [TypeScript](https://www.typescriptlang.org/) (Mode strict)
- **Base de Données & ORM** : PostgreSQL managé avec [Drizzle ORM](https://orm.drizzle.team/)
- **Authentification** : [Better-Auth](https://www.better-auth.com/) avec cookies sécurisés et support Passkey
- **Style & Composants** : [Tailwind CSS](https://tailwindcss.com/), Framer Motion, Radix UI, Lucide Icons
- **Sécurité** : Chiffrement AES-256-GCM (`lib/encryption.ts`), protection anti-Open Redirect (`lib/routes/safe-redirect.ts`), proxy de contrôle de route (`proxy.ts`)
- **Tests Automatisés** : [Vitest](https://vitest.dev/) (35 tests unitaires et d'intégration)

---

## 📁 Architecture et Documentation Détaillée

Pour explorer en détail chaque composant du projet, consultez la documentation dédiée :

- 🏛️ **[ARCHITECTURE.md](./ARCHITECTURE.md)** : Cartographie globale, schémas Mermaid d'architecture, sécurité, sessions et performances.
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
# Exécuter les tests unitaires et de sécurité
bun run test

# Vérification du typage TypeScript
bunx tsc --noEmit

# Vérification du linter
bunx eslint
```

---

## 🔒 Sécurité et Bonnes Pratiques

1. **Aucun secret exposé** : Les clés privées et secrets de signature restent strictement réservés à l'environnement serveur.
2. **Protection CSRF & Open Redirect** : Validation rigoureuse des redirections et des en-têtes d'origine.
3. **Sécurité des Portefeuilles** : Toutes les transactions requièrent la validation cryptographique du code PIN.