# 🌐 Documentation des API Routes — Games-Trafics

Ce document détaille les Route Handlers Next.js disponibles sous le répertoire \pp/api/\.
Toutes les routes API suivent les principes REST, avec vérification d'authentification serveur et contrats de réponse JSON normalisés.

---

## 1. Vue d'Ensemble des Endpoints API

| Méthode | Route | Fonction Métier | Authentification | Rôle Requis |
|---|---|---|---|---|
| \GET\ | \/api/auth/profile\ | Récupération du profil utilisateur courant | Oui | Tout utilisateur authentifié |
| \POST\ | \/api/transactions/create\ | Création d'une transaction financière / transfert | Oui | Propriétaire du portefeuille |
| \GET\ | \/api/wallet/stats\ | Statistiques du portefeuille (solde, flux) | Oui | Propriétaire du portefeuille |
| \GET\ | \/api/wallets/[id]\ | Détail d'un portefeuille | Oui | Propriétaire ou Admin |
| \GET\ | \/api/shops\ | Liste des boutiques de la marketplace | Non | Public |
| \GET\ | \/api/shops/[shopId]\ | Détail d'une boutique | Non | Public |
| \POST\ | \/api/users/[id]/ban\ | Bannissement d'un utilisateur | Oui | \ADMIN\ |
| \GET\, \POST\ | \/api/tournaments/[id]/editions\ | Éditions associées à un tournoi | Consultation : Public / Création : Oui | Créateur / Admin |
| \GET\ | \/api/tournaments/[id]/members\ | Liste des participants et organisateurs | Non | Public |

---

## 2. Diagramme Mermaid des Flux API

\\\mermaid
sequenceDiagram
    autonumber
    actor Client as Client / App
    participant Proxy as Next.js Proxy (proxy.ts)
    participant RouteHandler as API Route Handler
    participant SessionAuth as Better Auth (auth.api.getSession)
    participant Database as PostgreSQL (Neon DB / Drizzle)

    Client->>Proxy: Requête HTTP (ex: POST /api/transactions/create)
    Proxy->>RouteHandler: Relais de la requête avec en-têtes
    RouteHandler->>SessionAuth: Vérification du jeton de session (headers)
    alt Session Invalide ou Absente
        SessionAuth-->>RouteHandler: null
        RouteHandler-->>Client: 401 Unauthorized { "error": "Non authentifié" }
    else Session Valide
        SessionAuth-->>RouteHandler: Session Data & User Roles
        RouteHandler->>RouteHandler: Validation des entrées (Zod)
        RouteHandler->>Database: Exécution de l'opération métier
        Database-->>RouteHandler: Résultat
        RouteHandler-->>Client: 200 OK / 201 Created { "data": ... }
    end
\\\

---

## 3. Normes de Sécurité et de Réponse

- **Format des erreurs** :
  \\\json
  {
    "error": "Message explicatif en français",
    "details": []
  }
  \\\
- **Validation** : Les corps de requêtes entrants sont systématiquement validés via **Zod** avant toute interaction avec la base de données.
- **Protection contre les injections** : Utilisation exclusive de l'ORM **Drizzle** avec requêtes paramétrées.
- **Cache HTTP** : Les routes en lecture publique utilisent des en-têtes \Cache-Control\ appropriés (\public, s-maxage=60, stale-while-revalidate=120\). Les routes privées et transactions financières sont en \
o-store\.