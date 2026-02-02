import { StaticImageData } from "next/image";

export interface WelcomeData {
  title: string;
  description: string;
  image: string;
  details: string[];
}

export const welcomeSlides: WelcomeData[] = [
  {
    title: "Bienvenue sur Games-Trafics",
    description: "Votre plateforme de confiance pour l'achat, la vente et les tournois de jeux vidéo.",
    image: "/images/pages/welcome/img1.png",
    details: [
      "Une communauté active de gamers passionnés",
      "Des transactions sécurisées et garanties", 
      "Des tournois excitants avec des récompenses",
      "Un support client disponible 24/7",
      "Une expérience unique dédiée aux joueurs"
    ]
  },
  {
    title: "Acheter et vendre des comptes de jeux",
    description: "Trouvez des comptes de jeux à acheter ou vendez les vôtres en toute sécurité.",
    image: "/images/icons/pages/welcome/img2.png",
    details: [
      "Système de transaction sécurisé avec protection acheteur/vendeur",
      "Gestion des paiements via portefeuille électronique (Wallet)",
      "Possibilité d'ajouter des cartes bancaires pour les transactions",
      "Système de réclamation (Claims) en cas de litige",
      "Vérification d'identité des vendeurs pour plus de sécurité"
    ]
  },
  {
    title: "Participer à des tournois", 
    description: "Rejoignez des tournois compétitifs et gagnez des prix.",
    image: "/images/icons/pages/welcome/img3.png",
    details: [
      "Organisation de tournois avec système de brackets",
      "Gestion des participants et des résultats de matchs",
      "Prix en monnaie virtuelle (GTC) ou réelle",
      "Communication via messages de tournoi et groupes WhatsApp",
      "Formats variés (élimination simple, etc.)"
    ]
  },
  {
    title: "Créer votre boutique",
    description: "Ouvrez votre propre boutique et vendez vos produits.",
    image: "/images/icons/pages/welcome/img4.png",
    details: [
      "Création de boutique personnalisée avec profil et couverture",
      "Gestion des catégories de produits",
      "Système de notation et d'avis",
      "Suivi des commandes et des transactions",
      "Outils de promotion et mise en avant des produits"
    ]
  },
  {
    title: "Communauté de joueurs",
    description: "Connectez-vous avec d'autres joueurs et partagez votre passion.",
image: "/images/icons/pages/welcome/img5.png",
    details: [
      "Profils personnalisables avec réseaux sociaux",
      "Système de messagerie intégré",
      "Partage de posts et interactions",
      "Notifications en temps réel",
      "Historique des activités et recherches"
    ]
  },
  {
    title: "Personnalisez votre expérience",
    description: "Adaptez l'interface à vos préférences pour une expérience unique.",
    image: "/images/icons/pages/welcome/img6.png",
    details: [
      "Choix entre mode clair et sombre",
      "Personnalisation des couleurs de l'interface",
      "Options d'affichage configurables",
      "Disposition adaptable des éléments",
      "Sauvegarde de vos préférences"
    ]
  }
]
