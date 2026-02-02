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
  }
];