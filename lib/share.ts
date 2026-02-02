import { toast } from "sonner"

interface ShareOptions {
  title?: string
  text?: string
  url?: string
  fallbackMessage?: string
  successMessage?: string
  errorMessage?: string
  onSuccess?: () => void
  onError?: (error: unknown) => void
}

/**
 * Utilitaire pour partager du contenu en utilisant l'API Web Share avec fallback vers le presse-papier
 * @param options Options de configuration pour le partage
 * @returns Promise qui se résout lorsque le partage est terminé
 */
export const shareContent = async ({
  title = "",
  text = "",
  url = window.location.href,
  fallbackMessage = "Lien copié dans le presse-papier",
  successMessage = "Lien partagé avec succès",
  errorMessage = "Impossible de partager le contenu",
  onSuccess,
  onError,
}: ShareOptions): Promise<boolean> => {
  try {
    // Vérifier si l'API Web Share est disponible
    if (navigator.share) {
      await navigator.share({
        title,
        text,
        url,
      })
      toast.success(successMessage)
      onSuccess?.()
      return true
    } else {
      // Fallback vers le presse-papier
      await navigator.clipboard.writeText(url)
      toast.success(fallbackMessage)
      onSuccess?.()
      return true
    }
  } catch (error) {
    // Gérer les erreurs (annulation par l'utilisateur, permissions du presse-papier, etc.)
    if (error instanceof Error && error.name !== "AbortError") {
      // Afficher l'erreur uniquement pour les erreurs non liées à l'annulation par l'utilisateur
      // console.error("Erreur de partage:", error)
      toast.error(errorMessage)
      onError?.(error)
    }

    try {
      // Essayer le presse-papier en dernier recours
      await navigator.clipboard.writeText(url)
      toast.success(fallbackMessage)
      onSuccess?.()
      return true
    } catch (clipboardError) {
      console.error("Erreur de presse-papier:", clipboardError)
      toast.error(errorMessage)
      onError?.(clipboardError)
      return false
    }
  }
}
