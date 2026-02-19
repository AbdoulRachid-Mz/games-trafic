// config/page-explanations.ts
import { PageExplanation } from '@/types/explanation';

export const PAGE_EXPLANATIONS: PageExplanation[] = [
  {
    page: '/',
    title: 'Bienvenue sur Games Trafics',
    description: 'Découvrez les principales fonctionnalités de notre plateforme',
    version: 1,
    steps: [
      {
        id: 'home-1',
        title: 'Navigation principale',
        content: 'Accédez rapidement aux différentes sections de la plateforme',
        image: '/explanations/navigation.png',
        position: {
          elementSelector: 'nav',
          placement: 'bottom'
        }
      },
      {
        id: 'home-2',
        title: 'Marketplace',
        content: 'Achetez et vendez vos comptes de jeux en toute sécurité',
        image: '/explanations/marketplace.png',
        position: {
          elementSelector: '[data-feature="marketplace"]',
          placement: 'right'
        }
      },
      {
        id: 'home-3',
        title: 'Tournois',
        content: 'Participez à des tournois et gagnez des récompenses',
        image: '/explanations/tournaments.png',
        position: {
          elementSelector: '[data-feature="tournaments"]',
          placement: 'left'
        }
      }
    ]
  },
  {
    page: '/dashboard',
    title: 'Votre Dashboard',
    description: 'Gérez rapidement vos activités et raccourcis',
    version: 1,
    steps: [
      {
        id: 'dashboard-1',
        title: 'Actions rapides',
        content: 'Utilisez les raccourcis pour accéder aux fonctions clés',
        position: { elementSelector: '[data-section="quick-actions"]', placement: 'bottom' }
      },
      {
        id: 'dashboard-2',
        title: 'Statistiques',
        content: 'Suivez vos métriques essentielles',
        position: { elementSelector: '[data-section="stats"]', placement: 'right' }
      }
    ]
  },
  {
    page: '/wallet',
    title: 'Gestion du Wallet',
    description: 'Consultez le solde et vos transactions',
    version: 1,
    steps: [
      {
        id: 'wallet-1',
        title: 'Solde et opérations',
        content: 'Vérifiez votre solde et lancez des opérations',
        position: { elementSelector: '[data-section="balance"]', placement: 'bottom' }
      },
      {
        id: 'wallet-2',
        title: 'Transactions',
        content: 'Parcourez l’historique et les détails',
        position: { elementSelector: '[data-section="transactions"]', placement: 'right' }
      }
    ]
  },
  {
    page: '/admin',
    title: 'Administration',
    description: 'Accédez aux outils d’administration',
    version: 1,
    steps: [
      {
        id: 'admin-1',
        title: 'Navigation admin',
        content: 'Utilisez le menu pour parcourir les sections',
        position: { elementSelector: '[data-section="admin-menu"]', placement: 'left' }
      },
      {
        id: 'admin-2',
        title: 'Actions',
        content: 'Gérez les entités et modérez les contenus',
        position: { placement: 'center' }
      }
    ]
  },
  {
    page: '/tournaments/[tournamentId]/editions/[editionId]/dashboard',
    title: 'Dashboard Édition',
    description: 'Pilotez phases, groupes, matches et paiements',
    version: 1,
    steps: [
      {
        id: 'edition-1',
        title: 'Phases',
        content: 'Configurez et suivez les phases de l’édition',
        position: { elementSelector: '[data-section="phases"]', placement: 'right' }
      },
      {
        id: 'edition-2',
        title: 'Groupes et matches',
        content: 'Organisez les groupes et planifiez les matches',
        position: { elementSelector: '[data-section="groups"]', placement: 'bottom' }
      },
      {
        id: 'edition-3',
        title: 'Paiements d’inscription',
        content: 'Approuvez ou refusez les inscriptions payantes',
        position: { elementSelector: '[data-section="payments"]', placement: 'left' }
      }
    ]
  },
  {
    page: '/marketplace',
    title: 'Exploration du Marketplace',
    description: 'Apprenez à naviguer et utiliser le marketplace',
    version: 1,
    steps: [
      {
        id: 'marketplace-1',
        title: 'Filtres de recherche',
        content: 'Affinez votre recherche avec nos filtres avancés',
        image: '/explanations/filters.png',
        position: {
          elementSelector: '[data-feature="filters"]',
          placement: 'bottom'
        }
      },
      {
        id: 'marketplace-2',
        title: 'Liste des produits',
        content: 'Parcourez les produits disponibles avec leurs détails',
        image: '/explanations/products.png',
        position: {
          placement: 'center'
        }
      }
    ]
  },
  {
    page: '/tournaments',
    title: 'Exploration des tournois',
    description: 'Apprenez à naviguer et utiliser les tournois',
    version: 1,
    steps: [
      {
        id: 'tournaments-1',
        title: 'Filtres de recherche',
        content: 'Affinez votre recherche avec nos filtres avancés',
        image: '/explanations/filters.png',
        position: {
          elementSelector: '[data-feature="filters"]',
          placement: 'bottom'
        }
      },
      {
        id: 'tournaments-2',
        title: 'Liste des tournois',
        content: 'Parcourez les tournois disponibles avec leurs détails',
        image: '/explanations/tournaments.png',
        position: {
          placement: 'center'
        }
      }
    ]
  },
  {
    page: '/profile',
    title: 'Gestion de votre profil',
    description: 'Personnalisez votre profil et gérez vos paramètres',
    version: 1,
    steps: [
      {
        id: 'profile-1',
        title: 'Informations personnelles',
        content: 'Modifiez vos informations et votre photo de profil',
        image: '/explanations/profile-info.png',
        position: {
          elementSelector: '[data-section="personal-info"]',
          placement: 'right'
        }
      },
      {
        id: 'profile-2',
        title: 'Tableau de bord',
        content: 'Suivez vos activités et statistiques',
        image: '/explanations/dashboard.png',
        position: {
          elementSelector: '[data-section="dashboard"]',
          placement: 'bottom'
        }
      }
    ]
  },
  {
    page: '/marketplace/[productId]',
    title: 'Detail du produit',
    description: 'Ici on affiche le detail du produit',
    version: 1,
    steps: [
      {
        id: 'product-1',
        title: 'Vue d’ensemble',
        content: 'Consultez les détails et les statistiques',
        image: '/explanations/product-overview.png',
        position: {
          elementSelector: '[data-section="overview"]',
          placement: 'right'
        }
      },
      {
        id: 'product-2',
        title: 'Modification',
        content: 'Modifiez les informations du produit',
        image: '/explanations/product-edit.png',
        position: {
          elementSelector: '[data-section="edit"]',
          placement: 'bottom'
        }
      }
    ]
  },
  {
    page: '/tournaments/[tournamentId]',
    title: 'Detail de la compétition',
    description: 'Ici on affiche le detail de la compétition',
    version: 1,
    steps: [
      {
        id: 'tournament-1',
        title: 'Inscription',
        content: 'Inscrivez les participants payants et gratuits',
        image: '/explanations/registration.png',
        position: {
          elementSelector: '[data-section="registration"]',
          placement: 'right'
        }
      },
      {
        id: 'tournament-2',
        title: 'Gestion des places',
        content: 'Assignez et gérez les places disponibles',
        image: '/explanations/places.png',
        position: {
          elementSelector: '[data-section="places"]',
          placement: 'bottom'
        }
      }
    ]
  },
  {
    page: '/shops/[shopId]',
    title: 'Gestion de la boutique',
    description: 'Ici on affiche le detail de la boutique',
    version: 1,
    steps: [
      {
        id: 'shop-1',
        title: 'Inscription',
        content: 'Inscrivez les produits disponibles',
        image: '/explanations/registration.png',
        position: {
          elementSelector: '[data-section="registration"]',
          placement: 'right'
        }
      },
      {
        id: 'shop-2',
        title: 'Gestion des inscriptions',
        content: 'Assignez et gérez les inscriptions disponibles',
        image: '/explanations/registrations.png',
        position: {
          elementSelector: '[data-section="registrations"]',
          placement: 'bottom'
        }
      }
    ]
  },
  {
    page: '/welcome',
    title: 'Bienvenue',
    description: 'Présentation rapide pour bien démarrer',
    version: 1,
    steps: [
      {
        id: 'welcome-1',
        title: 'Découverte',
        content: 'Parcourez les sections clés de la plateforme',
        position: { placement: 'center' }
      }
    ]
  },
  {
    page: '/settings',
    title: 'Paramètres',
    description: 'Gérez vos préférences et la sécurité',
    version: 1,
    steps: [
      {
        id: 'settings-1',
        title: 'Profil et préférences',
        content: 'Modifiez vos informations et vos préférences',
        position: { elementSelector: '[data-section="preferences"]', placement: 'right' }
      },
      {
        id: 'settings-2',
        title: 'Sécurité',
        content: 'Gérez la sécurité et les connexions',
        position: { elementSelector: '[data-section="security"]', placement: 'bottom' }
      }
    ]
  },
  {
    page: '/shops',
    title: 'Boutiques',
    description: 'Explorez les boutiques et leurs produits',
    version: 1,
    steps: [
      {
        id: 'shops-1',
        title: 'Liste des boutiques',
        content: 'Parcourez et filtrez les boutiques',
        position: { elementSelector: '[data-section="shops-list"]', placement: 'bottom' }
      },
      {
        id: 'shops-2',
        title: 'Actions rapides',
        content: 'Accédez aux actions disponibles',
        position: { elementSelector: '[data-section="quick-actions"]', placement: 'right' }
      }
    ]
  },
  {
    page: '/products',
    title: 'Produits',
    description: 'Découvrez les produits disponibles',
    version: 1,
    steps: [
      {
        id: 'products-1',
        title: 'Catalogue',
        content: 'Filtrez et consultez les produits',
        position: { elementSelector: '[data-section="catalog"]', placement: 'bottom' }
      },
      {
        id: 'products-2',
        title: 'Achat',
        content: 'Achetez directement depuis la fiche produit',
        position: { placement: 'center' }
      }
    ]
  },
];
