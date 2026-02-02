// lib/ai/assistant-service.ts
import { GuideWithRelations, GuideStepWithRelations } from '@/database/schema';
import { 
  LOCAL_KNOWLEDGE_BASE, 
  GUIDE_CATEGORIES,
  AssistantResponse,
  AssistantConfig,
  calculateRelevanceScore 
} from './assistant-knowledge';
import { getGuides, getGuideSteps } from '@/actions/guides';

export class AssistantService {
  private config: AssistantConfig;

  constructor(config: Partial<AssistantConfig> = {}) {
    this.config = {
      useLocalKnowledge: true,
      useGuideDatabase: true,
      maxResults: 5,
      confidenceThreshold: 0.3,
      ...config
    };
  }

  /**
   * Recherche dans la base de connaissances locale
   */
  private searchLocalKnowledge(query: string, category?: string) {
    const results: Array<{
      answer: string;
      category: string;
      subcategory: string;
      confidence: number;
    }> = [];

    if (!this.config.useLocalKnowledge) return results;

    const queryLower = query.toLowerCase();

    // Rechercher dans toutes les catégories
    for (const [categoryKey, subcategories] of Object.entries(LOCAL_KNOWLEDGE_BASE)) {
      if (category && category !== categoryKey) continue;

      for (const [subcategoryKey, items] of Object.entries(subcategories)) {
        items.forEach(item => {
          const confidence = calculateRelevanceScore(query, item);
          if (confidence >= this.config.confidenceThreshold) {
            results.push({
              answer: item,
              category: categoryKey,
              subcategory: subcategoryKey,
              confidence
            });
          }
        });
      }
    }

    return results.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Recherche dans les guides de la base de données
   */
  private async searchGuideDatabase(query: string, category?: string) {
    const results: Array<{
      guide: GuideWithRelations;
      steps: GuideStepWithRelations[];
      confidence: number;
    }> = [];

    if (!this.config.useGuideDatabase) return results;

    try {
      // Rechercher les guides pertinents
      const guidesResponse = await getGuides({
        filters: {
          title: query,
          category: category,
          isActive: true,
          isDeleted: false
        },
        pagination: { page: 1, limit: 10 }
      });

      for (const guide of guidesResponse.data) {
        let confidence = calculateRelevanceScore(query, guide.title);
        
        // Ajouter le contenu de la description
        if (guide.description) {
          confidence = Math.max(confidence, calculateRelevanceScore(query, guide.description));
        }

        if (confidence >= this.config.confidenceThreshold) {
          // Récupérer les étapes du guide
          const stepsResponse = await getGuideSteps(guide.id, {
            pagination: { page: 1, limit: 50 }
          });

          results.push({
            guide,
            steps: stepsResponse.data,
            confidence
          });
        }
      }
    } catch (error) {
      console.error('Error searching guide database:', error);
    }

    return results.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Détecte le contexte de la requête utilisateur
   */
  private detectContext(query: string): string {
    const queryLower = query.toLowerCase();
    
    const contextKeywords = {
      shops: ['boutique', 'magasin', 'shop', 'vendre', 'vendeur', 'produit'],
      tournaments: ['tournoi', 'compétition', 'match', 'gagnant', 'inscription', 'prix'],
      wallet: ['wallet', 'portefeuille', 'argent', 'payer', 'achat', 'solde', 'GTC'],
      products: ['produit', 'compte', 'jeu', 'achat', 'vendre', 'livraison'],
      account: ['compte', 'identifiant', 'mot de passe', 'login'],
      guide: ['guide', 'aide', 'comment', 'tutoriel', 'étape']
    };

    for (const [context, keywords] of Object.entries(contextKeywords)) {
      if (keywords.some(keyword => queryLower.includes(keyword))) {
        return context;
      }
    }

    return 'general';
  }

  /**
   * Génère des suggestions basées sur le contexte
   */
  private generateSuggestions(context: string): string[] {
    const suggestions = {
      shops: [
        "Comment créer une boutique ?",
        "Comment ajouter un produit ?",
        "Comment gérer les commandes ?",
        "Comment personnaliser l'apparence ?"
      ],
      tournaments: [
        "Comment organiser un tournoi ?",
        "Comment s'inscrire à un tournoi ?",
        "Comment gérer les participants ?",
        "Comment définir les prix ?"
      ],
      wallet: [
        "Comment déposer de l'argent ?",
        "Comment retirer mes gains ?",
        "Comment sécuriser mon wallet ?",
        "Quels sont les frais ?"
      ],
      products: [
        "Comment vendre un compte ?",
        "Comment décrire mon produit ?",
        "Comment fixer un prix ?",
        "Comment livrer un compte ?"
      ],
      general: [
        "Comment commencer sur Games Trafics ?",
        "Qu'est-ce que le programme VIP ?",
        "Comment signaler un problème ?",
        "Comment contacter le support ?"
      ]
    };

    return suggestions[context as keyof typeof suggestions] || suggestions.general;
  }

  /**
   * Formate une réponse complète à partir de sources multiples
   */
  async generateResponse(userQuery: string): Promise<AssistantResponse> {
    const context = this.detectContext(userQuery);
    
    // Recherche parallèle dans les sources
    const [localResults, guideResults] = await Promise.all([
      this.searchLocalKnowledge(userQuery, context),
      this.searchGuideDatabase(userQuery, context)
    ]);

    // Combiner les résultats
    const allResults = [
      ...localResults.map(result => ({
        type: 'local' as const,
        content: result.answer,
        confidence: result.confidence,
        metadata: {
          category: result.category,
          subcategory: result.subcategory
        }
      })),
      ...guideResults.flatMap(result => 
        result.steps.map(step => ({
          type: 'guide' as const,
          content: step.content,
          confidence: result.confidence,
          metadata: {
            guideId: result.guide.id,
            guideTitle: result.guide.title,
            stepTitle: step.title
          }
        }))
      )
    ].sort((a, b) => b.confidence - a.confidence)
     .slice(0, this.config.maxResults);

    // Générer la réponse principale
    let answer = "";
    const sources: AssistantResponse['sources'] = [];

    if (allResults.length > 0) {
      // Utiliser le meilleur résultat comme réponse principale
      const mainResult = allResults[0];
      answer = mainResult.content;

      // Ajouter des sources
      allResults.forEach(result => {
        sources.push({
          type: result.type,
          id: result.type === 'guide' ? result.metadata.guideId : undefined,
          title: result.type === 'guide' ? result.metadata.guideTitle : undefined,
          confidence: result.confidence
        });
      });

      // Ajouter des informations supplémentaires si disponibles
      if (allResults.length > 1) {
        answer += "\n\nPour plus d'informations, consultez nos guides complets sur le sujet.";
      }
    } else {
      answer = "Je n'ai pas trouvé d'information spécifique sur ce sujet. ";
      answer += "Pourriez-vous reformuler votre question ou consulter notre centre d'aide ?";
    }

    // Générer des suggestions
    const suggestions = this.generateSuggestions(context);

    // Proposer des actions pertinentes
    const actions = this.generateActions(context, guideResults);

    return {
      answer,
      sources,
      suggestions,
      actions
    };
  }

  /**
   * Génère des actions suggérées
   */
  private generateActions(context: string, guideResults: any[]) {
    const actions: AssistantResponse['actions'] = [];

    // Actions basées sur le contexte
    switch (context) {
      case 'shops':
        actions.push({
          text: "Créer une boutique",
          url: "/shops/create",
          type: "link"
        });
        break;
      case 'tournaments':
        actions.push({
          text: "Voir les tournois",
          url: "/tournaments",
          type: "link"
        });
        break;
      case 'wallet':
        actions.push({
          text: "Accéder à mon wallet",
          url: "/wallet",
          type: "link"
        });
        break;
    }

    // Ajouter des guides pertinents
    guideResults.slice(0, 2).forEach(result => {
      actions.push({
        text: `Guide: ${result.guide.title}`,
        url: `/guides/${result.guide.id}`,
        type: "guide"
      });
    });

    return actions;
  }

  /**
   * Apprentissage automatique simple : enrichit la base locale avec les interactions
   */
  learnFromInteraction(query: string, response: AssistantResponse) {
    // Enregistre l'interaction pour améliorer les futures réponses
    // (Pourrait être stockée dans une table dédiée pour analyse)
    console.log('Learning from interaction:', { query, response });
  }
}

// Instance singleton pour l'application
export const assistantService = new AssistantService();