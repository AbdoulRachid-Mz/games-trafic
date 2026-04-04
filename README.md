# 🎮 Games-Trafics (GT-V3)

Bienvenue sur le dépôt officiel de **Games-Trafics**, la plateforme e-sport et gaming tout-en-un conçue pour dynamiser l'écosystème compétitif francophone.

!\[Games-Trafics Banner]\(/icons/gt-primary.png)

## 🚀 À propos du projet

Games-Trafics est une plateforme moderne permettant aux joueurs de participer à des tournois, de gérer leurs finances via un wallet sécurisé (GTC), et d'accéder à une marketplace dédiée aux produits et services gaming.

> \[!IMPORTANT]
> Ce projet est actuellement en phase de développement actif (V3). La stabilité des fonctionnalités est notre priorité.

## ✨ Fonctionnalités Clés

- **Système de Tournois Avancé** : Gestion des éditions, phases de groupes, brackets et progression automatique des scores.
- **Wallet GTC** : Un système financier interne sécurisé pour les dépôts, retraits et transferts.
- **Boutiques & Marketplace** : Espaces de vente certifiés pour produits digitaux et physiques.
- **Hub de Documentation** : Documentation technique et utilisateur intégrée via MDX.
- **Messagerie Contextuelle** : Échanges facilités autour des matches et des commandes.

## 🛠️ Stack Technique

Le projet repose sur les technologies les plus récentes du web :

- **Framework** : [Next.js 16 ](https://nextjs.org/)(App Router)
- **Base de Données** : PostgreSQL avec [Drizzle ORM](https://orm.drizzle.team/)
- **Styling** : [Tailwind CSS 4.0](https://tailwindcss.com/)
- **Animations** : [Framer Motion](https://www.framer.com/motion/)
- **Documentation** : [MDX](https://mdxjs.com/) avec `next-mdx-remote`
- **Composants UI** : Radix UI & Lucide React

## 📖 Documentation

Notre système de documentation est désormais modulaire et éditable directement en Markdown.

- **Guides Utilisateurs** : `/docs`
- **Dépannage & Support** : `/support`
- **Contact Technique** : `/contact`

> \[!TIP]
> Pour ajouter ou modifier la documentation, consultez le dossier `docs/content/`.

## ⚙️ Installation Locale

1. **Cloner le projet** :
   ```TypeScript
   git clone https://github.com/AbdoulRachid-Mz/games-trafic.git
   cd games-trafic
   ```
2. **Installer les dépendances** :
   ```bash
   pnpm install
   ```
3. **Configurer l'environnement** :
   Créez un fichier `.env.local` basé sur `.env.example` et renseignez vos clés d'accès (Database, API Keys).
4. **Lancer le serveur de développement** :
   ```bash
   pnpm dev
   ```

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une *Issue* ou une *Pull Request* pour suggérer des améliorations ou signaler des bugs.

***

*© 2026 Games-Trafics - Tous droits réservés.*
