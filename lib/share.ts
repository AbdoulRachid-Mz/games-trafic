import { toast } from "sonner";

export interface ShareOptions {
  title?: string;
  text?: string;
  url?: string;
  fallbackMessage?: string;
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}

/**
 * Utilitaire centralisé pour partager du contenu en utilisant l'API Web Share avec fallback vers le presse-papier
 * @param options Options de configuration pour le partage
 * @returns Promise qui se résout lorsque le partage est terminé
 */
export const shareContent = async ({
  title = "",
  text = "",
  url = typeof window !== "undefined" ? window.location.href : "",
  fallbackMessage = "Lien copié dans le presse-papier",
  successMessage = "Lien partagé avec succès",
  errorMessage = "Impossible de partager le contenu",
  onSuccess,
  onError,
}: ShareOptions): Promise<boolean> => {
  if (typeof window === "undefined") return false;

  try {
    // Vérifier si l'API Web Share est disponible
    if (navigator.share) {
      await navigator.share({
        title,
        text,
        url,
      });
      toast.success(successMessage);
      onSuccess?.();
      return true;
    } else {
      // Fallback vers le presse-papier
      await navigator.clipboard.writeText(url);
      toast.success(fallbackMessage);
      onSuccess?.();
      return true;
    }
  } catch (error) {
    // Gérer les erreurs (annulation par l'utilisateur, permissions du presse-papier, etc.)
    if (error instanceof Error && error.name !== "AbortError") {
      toast.error(errorMessage);
      onError?.(error);
    }

    try {
      // Essayer le presse-papier en dernier recours
      await navigator.clipboard.writeText(url);
      toast.success(fallbackMessage);
      onSuccess?.();
      return true;
    } catch (clipboardError) {
      console.error("Erreur de presse-papier:", clipboardError);
      toast.error(errorMessage);
      onError?.(clipboardError);
      return false;
    }
  }
};

/**
 * Partager un produit avec un formatage prédéfini
 */
export const shareProduct = (
  productId: string,
  productName: string,
  options?: Partial<ShareOptions>
) => {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return shareContent({
    title: `${productName} | Games-Trafics`,
    text: `Découvrez ce produit: ${productName}`,
    url: `${origin}/produits/${productId}`,
    ...options,
  });
};

/**
 * Partager une boutique avec un formatage prédéfini
 */
export const shareBoutique = (
  boutiqueId: string,
  boutiqueName: string,
  options?: Partial<ShareOptions>
) => {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return shareContent({
    title: `${boutiqueName} | Games-Trafics`,
    text: `Découvrez cette boutique: ${boutiqueName}`,
    url: `${origin}/boutiques/${boutiqueId}`,
    ...options,
  });
};

/**
 * Partager un tournoi avec un formatage prédéfini
 */
export const shareTournament = (
  tournamentId: string,
  tournamentName: string,
  options?: Partial<ShareOptions>
) => {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return shareContent({
    title: `${tournamentName} | Games-Trafics`,
    text: `Rejoignez ce tournoi: ${tournamentName}`,
    url: `${origin}/tournois/${tournamentId}`,
    ...options,
  });
};
