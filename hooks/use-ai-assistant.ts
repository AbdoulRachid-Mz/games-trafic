// hooks/use-ai-assistant.ts
import { useState, useCallback } from 'react';
import { assistantService } from '@/lib/ai/assistant-service';
import { AssistantResponse } from '@/lib/ai/assistant-knowledge';

export function useAIAssistant() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<Array<{
    query: string;
    response: AssistantResponse;
    timestamp: Date;
  }>>([]);

  const askQuestion = useCallback(async (query: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await assistantService.generateResponse(query);
      
      setHistory(prev => [...prev, {
        query,
        response,
        timestamp: new Date()
      }]);

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const getContextSuggestions = useCallback((context?: string) => {
    const suggestions = {
      shops: [
        "Comment créer une boutique sur Games Trafics ?",
        "Quels sont les avantages d'une boutique vérifiée ?",
        "Comment gérer les produits dans ma boutique ?",
        "Comment personnaliser l'apparence de ma boutique ?",
        "Quelles sont les limites pour les boutiques standards vs VIP ?"
      ],
      tournaments: [
        "Comment organiser mon premier tournoi ?",
        "Quels formats de tournoi sont disponibles ?",
        "Comment définir les frais d'inscription ?",
        "Comment gérer les participants d'un tournoi ?",
        "Comment distribuer les prix aux gagnants ?"
      ],
      wallet: [
        "Comment ajouter des fonds à mon wallet ?",
        "Quels sont les frais de transaction ?",
        "Comment retirer mon argent ?",
        "Comment sécuriser mon wallet ?",
        "Que faire en cas de problème avec une transaction ?"
      ],
      products: [
        "Comment vendre un compte de jeu ?",
        "Comment fixer un prix pour mon produit ?",
        "Comment décrire efficacement un compte ?",
        "Comment livrer un compte après vente ?",
        "Quelles sont les règles pour les produits ?"
      ],
      general: [
        "Comment commencer sur Games Trafics ?",
        "Qu'est-ce que le programme VIP et ses avantages ?",
        "Comment signaler un utilisateur ou un problème ?",
        "Comment contacter le support technique ?",
        "Où trouver les guides détaillés ?"
      ]
    };

    return suggestions[context as keyof typeof suggestions] || suggestions.general;
  }, []);

  return {
    askQuestion,
    isLoading,
    error,
    history,
    clearHistory,
    getContextSuggestions
  };
}