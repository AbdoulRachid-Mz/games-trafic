// lib/ai/assistant-knowledge.ts
import { GuideWithRelations } from '@/database/schema';

// Base de connaissances locale structurée
export const LOCAL_KNOWLEDGE_BASE = {
  shops: {
    general: [
      "Les boutiques sur Games-Trafics sont des espaces personnalisés où les vendeurs proposent leurs comptes gaming.",
      "Chaque boutique peut avoir un thème unique, créé par le propriétaire ou sélectionné parmi les thèmes disponibles.",
      "Les boutiques vérifiées (badge bleu ✓) ont été examinées par notre équipe pour garantir leur fiabilité."
    ],
    creation: [
      "Pour créer une boutique, vous devez être connecté et avoir un compte vérifié.",
      "Vous pouvez choisir un nom unique, ajouter une description et personnaliser l'apparence avec un thème.",
      "Les utilisateurs VIP peuvent créer jusqu'à 5 boutiques, les utilisateurs standards jusqu'à 1."
    ],
    management: [
      "Dans le dashboard de votre boutique, vous pouvez gérer les produits, voir les commandes et analyser les statistiques.",
      "Vous pouvez activer/désactiver votre boutique à tout moment depuis les paramètres.",
      "Les notifications de commande peuvent être configurées pour recevoir des alertes par email ou notification push."
    ],
    products: [
      "Les produits sont des comptes de jeux vidéo que vous pouvez vendre dans votre boutique.",
      "Chaque produit doit avoir un prix en GTC (Games-Trafics Currency).",
      "Vous pouvez ajouter des images, décrire le compte et spécifier le jeu et la plateforme.",
      "Les produits ont différents statuts : Non vendu, Réservé, En échange, Livré, Vendu, Annulé."
    ]
  },
  tournaments: {
    general: [
      "Les tournois permettent d'organiser des compétitions gaming entre joueurs.",
      "Un tournoi peut avoir plusieurs éditions (saisons ou événements).",
      "Les organisateurs peuvent définir des frais d'inscription et des prix pour les gagnants."
    ],
    creation: [
      "Pour créer un tournoi, vous devez spécifier le jeu, la plateforme et le format de compétition.",
      "Vous pouvez choisir entre plusieurs formats : Élimination, Phase de groupes, Round Robin, etc.",
      "Les tournois peuvent être publics, privés ou par invitation."
    ],
    participation: [
      "Les joueurs peuvent s'inscrire aux éditions actives d'un tournoi.",
      "Les inscriptions peuvent être gratuites ou payantes.",
      "Les participants doivent parfois vérifier leur présence (check-in) avant le début du tournoi."
    ],
    organization: [
      "Les organisateurs peuvent créer plusieurs phases dans leur tournoi.",
      "Chaque phase peut avoir des groupes de participants.",
      "Les matchs sont générés automatiquement selon le format choisi.",
      "Les résultats des matchs doivent être validés par les participants et/ou les administrateurs."
    ]
  },
  wallet: {
    general: [
      "Le wallet (portefeuille) est votre compte monétaire sur Games-Trafics.",
      "La devise principale est le GTC (Games-Trafics Currency).",
      "Vous devez vérifier votre identité pour activer toutes les fonctionnalités du wallet."
    ],
    transactions: [
      "Les transactions incluent les achats, les dépôts, les retraits et les transferts.",
      "Les frais de transaction varient selon le type d'opération.",
      "L'historique des transactions est disponible dans votre dashboard wallet."
    ],
    security: [
      "Votre wallet est protégé par un PIN que vous définissez à la création.",
      "Après plusieurs tentatives échouées, le wallet se verrouille temporairement.",
      "Toutes les transactions sont tracées et enregistrées pour la sécurité."
    ]
  },
  accounts: {
    gaming: [
      "Les comptes gaming sont le principal produit vendu sur la plateforme.",
      "Un compte comprend généralement le login, le mot de passe (crypté), et les détails du jeu.",
      "Les vendeurs peuvent spécifier le niveau, le rang, et les éléments inclus dans le compte.",
      "Après achat, le compte est livré au client via un système sécurisé."
    ],
    security: [
      "Les mots de passe des comptes sont toujours cryptés dans la base de données.",
      "Les acheteurs ne voient les identifiants qu'après paiement complet et validation.",
      "En cas de problème, un système de réclamation est disponible."
    ],
    delivery: [
      "La livraison est automatique après confirmation de paiement.",
      "Le vendeur peut aussi livrer manuellement en fournissant les identifiants.",
      "Une fois livré, le produit change de statut et ne peut plus être modifié."
    ]
  }
};

// Catégories pour organiser les guides
export const GUIDE_CATEGORIES = {
  GETTING_STARTED: "getting-started",
  SHOPS: "shops",
  TOURNAMENTS: "tournaments",
  WALLET: "wallet",
  PRODUCTS: "products",
  SECURITY: "security",
  PAYMENTS: "payments",
  GAMES: "games",
  COMMUNITY: "community",
  VIP: "vip"
};

// Structure pour les réponses de l'assistant
export interface AssistantResponse {
  answer: string;
  sources: {
    type: 'local' | 'guide';
    id?: string;
    title?: string;
    confidence: number;
  }[];
  suggestions?: string[];
  actions?: {
    text: string;
    url?: string;
    type: 'link' | 'action' | 'guide';
  }[];
}

// Configuration de l'assistant
export interface AssistantConfig {
  useLocalKnowledge: boolean;
  useGuideDatabase: boolean;
  maxResults: number;
  confidenceThreshold: number;
}

// Score de pertinence basé sur la correspondance des termes
export function calculateRelevanceScore(query: string, content: string): number {
  const queryTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 2);
  const contentLower = content.toLowerCase();
  
  let score = 0;
  
  queryTerms.forEach(term => {
    if (contentLower.includes(term)) {
      score += 2;
      // Bonus pour les termes exacts au début du contenu
      if (contentLower.indexOf(term) < 50) {
        score += 1;
      }
    }
  });
  
  // Normaliser le score
  return Math.min(score / (queryTerms.length * 3), 1);
}