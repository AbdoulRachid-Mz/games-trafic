// app/api/stats/docs/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const documentation = {
    api: {
      name: 'Statistics API',
      version: '1.0.0',
      description: 'API complète pour accéder aux statistiques de la plateforme',
      base_url: '/api/stats',
    },
    endpoints: {
      GET: {
        description: 'Récupérer des statistiques avec paramètres de requête',
        parameters: {
          entity: {
            type: 'string',
            description: "Entité à analyser (users, shops, products, tournaments, transactions, etc.)",
            required: false,
            default: 'global',
            examples: ['users', 'shops', 'products', 'tournaments', 'transactions']
          },
          statId: {
            type: 'string',
            description: "Type de statistique spécifique",
            required: false,
            examples: ['growth', 'status', 'countries', 'types', 'platforms']
          },
          action: {
            type: 'string',
            description: "Action spécifique à exécuter",
            required: false,
            options: ['global', 'recent', 'dashboard', 'performance', 'custom'],
            default: 'getStats'
          },
          date_from: {
            type: 'string (ISO date)',
            description: "Date de début pour le filtre temporel",
            required: false,
            example: '2024-01-01'
          },
          date_to: {
            type: 'string (ISO date)',
            description: "Date de fin pour le filtre temporel",
            required: false,
            example: '2024-12-31'
          },
          year: {
            type: 'number',
            description: "Année spécifique",
            required: false,
            example: 2024
          },
          month: {
            type: 'number (1-12)',
            description: "Mois spécifique",
            required: false,
            example: 3
          },
          group_by: {
            type: 'string',
            description: "Groupement temporel",
            required: false,
            options: ['day', 'week', 'month', 'year', 'quarter'],
            default: 'month'
          },
          userId: {
            type: 'string',
            description: "Filtrer par ID utilisateur",
            required: false
          },
          shopId: {
            type: 'string',
            description: "Filtrer par ID boutique",
            required: false
          },
          tournamentId: {
            type: 'string',
            description: "Filtrer par ID tournoi",
            required: false
          },
          game: {
            type: 'string',
            description: "Filtrer par jeu",
            required: false
          },
          platform: {
            type: 'string',
            description: "Filtrer par plateforme",
            required: false,
            options: ['PC', 'PLAYSTATION', 'XBOX', 'NINTENDO_SWITCH', 'MOBILE', 'VR', 'OTHER']
          },
          status: {
            type: 'string',
            description: "Filtrer par statut",
            required: false
          },
          limit: {
            type: 'number',
            description: "Limiter le nombre de résultats",
            required: false,
            default: 10
          },
          page: {
            type: 'number',
            description: "Numéro de page pour la pagination",
            required: false,
            default: 1
          },
          sort_by: {
            type: 'string',
            description: "Champ de tri",
            required: false
          },
          sort_order: {
            type: 'string',
            description: "Ordre de tri",
            required: false,
            options: ['asc', 'desc'],
            default: 'desc'
          },
          includeDeleted: {
            type: 'boolean',
            description: "Inclure les éléments supprimés",
            required: false,
            default: false
          },
          timeframe: {
            type: 'string',
            description: "Période pour les métriques de performance (avec action=performance)",
            required: false,
            options: ['day', 'week', 'month'],
            default: 'day'
          }
        },
        examples: {
          "Statistiques globales": "/api/stats?action=global",
          "Utilisateurs par pays": "/api/stats?entity=users&statId=countries&limit=5",
          "Croissance des transactions": "/api/stats?entity=transactions&statId=growth&group_by=day&date_from=2024-01-01",
          "Activités récentes": "/api/stats?action=recent&limit=20",
          "Tableau de bord": "/api/stats?action=dashboard",
          "Métriques de performance": "/api/stats?action=performance&timeframe=week"
        }
      },
      POST: {
        description: 'Exécuter des requêtes statistiques complexes',
        body_format: 'application/json',
        actions: {
          batch: {
            description: "Récupérer plusieurs types de statistiques en une seule requête",
            body_example: {
              action: "batch",
              queries: [
                { filters: { entity: "users", statId: "growth" } },
                { filters: { entity: "transactions", statId: "types" } },
                { filters: { entity: "products", statId: "status" } }
              ]
            }
          },
          compare: {
            description: "Comparer des statistiques sur différentes périodes",
            body_example: {
              action: "compare",
              entity: "users",
              statId: "growth",
              periods: [
                { name: "Janvier 2024", start: "2024-01-01", end: "2024-01-31" },
                { name: "Février 2024", start: "2024-02-01", end: "2024-02-29" },
                { name: "Mars 2024", start: "2024-03-01", end: "2024-03-31" }
              ]
            }
          },
          export: {
            description: "Générer des statistiques pour export",
            body_example: {
              action: "export",
              format: "csv",
              entity: "products",
              statId: "status",
              date_from: "2024-01-01",
              date_to: "2024-12-31"
            }
          },
          advanced: {
            description: "Requêtes statistiques avancées",
            body_example: {
              action: "advanced",
              query: {
                type: "correlation",
                metrics: ["user_growth", "transaction_volume"],
                timeframe: "monthly"
              }
            }
          }
        }
      }
    },
    response_format: {
      success: "boolean",
      action: "string",
      filters: "object",
      data: "any",
      metadata: "object",
      timestamp: "string (ISO date)",
      error: "string (only on error)"
    },
    entities_available: [
      "users",
      "shops", 
      "products",
      "tournaments",
      "transactions",
      "teams",
      "posts",
      "messages",
      "groups",
      "interactions",
      "notifications",
      "themes",
      "announcements",
      "claims",
      "searches",
      "traces",
      "categories",
      "games",
      "vip",
      "orders",
      "editions",
      "matches"
    ],
    stat_types_available: {
      users: ["summary", "roles", "status", "growth", "countries", "account_types"],
      shops: ["summary", "countries", "verification", "growth"],
      products: ["summary", "status", "games", "platforms", "growth"],
      tournaments: ["summary", "status", "games", "platforms", "visibility", "growth"],
      transactions: ["summary", "types", "status", "growth", "hourly"]
    },
    usage_tips: [
      "Utilisez les paramètres de filtre pour affiner vos résultats",
      "Combinez plusieurs filtres pour des requêtes précises",
      "Utilisez POST pour des requêtes complexes ou batch",
      "Consultez la documentation pour les types de statistiques disponibles par entité",
      "Les dates doivent être au format ISO (YYYY-MM-DD)",
      "Utilisez group_by pour agréger les données temporelles"
    ],
    rate_limiting: {
      free: "100 requêtes par heure",
      authenticated: "1000 requêtes par heure",
      vip: "10000 requêtes par heure"
    },
    changelog: [
      "v1.0.0 (2024-01-01): Version initiale avec support complet des statistiques"
    ]
  };

  return NextResponse.json(documentation);
}