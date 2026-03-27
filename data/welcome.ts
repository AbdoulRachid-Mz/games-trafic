export interface WelcomeData {
  title: string;
  description: string;
  image: string;
  details: string[];
}

export const welcomeSlides: WelcomeData[] = [
  {
    title: "Bienvenue sur Games-Trafics",
    description: "La plateforme ultime pour acheter, vendre, jouer et gagner dans l’univers du gaming.",
    image: "/images/icons/pages/welcome/welcome.png",
    details: [
      "Une communauté active de gamers passionnés",
      "Transactions rapides, fiables et sécurisées",
      "Tournois compétitifs avec récompenses réelles",
      "Support client réactif 24h/24",
      "Une expérience moderne pensée pour les gamers"
    ]
  },
  {
    title: "Achetez et vendez en toute sécurité",
    description: "Accédez à un marketplace fiable pour échanger vos comptes et produits gaming sans risque.",
    image: "/icons/marketplace-500.png",
    details: [
      "Protection acheteur et vendeur intégrée",
      "Paiements sécurisés via portefeuille (GTC Wallet)",
      "Ajout et gestion de cartes virtuelles",
      "Système de litiges (Claims) en cas de problème",
      "Vendeurs vérifiés pour plus de confiance"
    ]
  },
  {
    title: "Participez à des tournois et gagnez",
    description: "Affrontez d'autres joueurs, grimpez dans les classements et remportez des récompenses.",
    image: "/images/icons/pages/welcome/tournoi.png",
    details: [
      "Tournois organisés avec système de brackets",
      "Suivi en temps réel des matchs et résultats",
      "Récompenses en GTC ou en argent réel",
      "Communication intégrée (chat & groupes)",
      "Formats variés : élimination directe, ligues, etc."
    ]
  },
  {
    title: "Créez votre propre boutique",
    description: "Lancez votre business gaming et vendez facilement vos produits à une large audience.",
    image: "/images/icons/pages/welcome/market.png",
    details: [
      "Boutique personnalisée avec profil et design",
      "Gestion simple des produits et catégories",
      "Système d’avis et de notation clients",
      "Suivi complet des ventes et transactions",
      "Outils pour booster votre visibilité"
    ]
  },
  {
    title: "Rejoignez une communauté active",
    description: "Échangez, partagez et connectez-vous avec des joueurs du monde entier.",
    image: "/images/icons/pages/welcome/social.png",
    details: [
      "Profils personnalisables et sociaux",
      "Messagerie instantanée intégrée",
      "Publications et interactions communautaires",
      "Notifications en temps réel",
      "Historique et suivi de vos activités"
    ]
  },
  {
    title: "Une expérience qui vous ressemble",
    description: "Personnalisez votre interface pour une immersion totale.",
    image: "/images/icons/pages/welcome/gt-player.webp",
    details: [
      "Mode clair et sombre adaptatif",
      "Thème violet & gold premium",
      "Interface flexible et responsive",
      "Paramètres personnalisables",
      "Sauvegarde automatique de vos préférences"
    ]
  },
  {
    title: "Prêt à commencer ?",
    description: "Rejoignez Games-Trafics dès maintenant et entrez dans une nouvelle dimension du gaming.",
    image: "/images/icons/pages/welcome/gt-primary.png",
    details: [
      "Créer un compte en quelques secondes",
      "Accéder à toutes les fonctionnalités",
      "Commencer à acheter, vendre et jouer"
    ]
  }
]
