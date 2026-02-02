import { APIError } from "better-auth/api";

export interface AuthErrorContext {
  operation: string;
  timestamp: Date;
  userAgent?: string;
}

export class AuthErrorHandler {
  private static readonly ERROR_MESSAGES: Record<string, string> = {
    // Erreurs d'authentification
    EMAIL_ALREADY_EXISTS: "Un compte avec cet email existe déjà",
    INVALID_EMAIL: "Adresse email invalide",
    INVALID_PASSWORD: "Mot de passe incorrect",
    USER_NOT_FOUND: "Aucun compte trouvé avec cet email",
    WEAK_PASSWORD: "Le mot de passe doit contenir au moins 8 caractères",
    USER_DISABLED: "Ce compte a été désactivé",
    TOO_MANY_REQUESTS: "Trop de tentatives, réessayez dans quelques minutes",
    INVALID_CREDENTIALS: "Email ou mot de passe invalide",
    UNABLE_TO_CREATE_USER:
      "Impossible de créer le compte. Le nom d'utilisateur est peut-être déjà pris.",

    // Erreurs de tokens
    INVALID_TOKEN: "Lien de vérification invalide ou expiré",
    EXPIRED_TOKEN: "Le lien a expiré, veuillez en demander un nouveau",

    // Erreurs d'autorisation
    UNAUTHORIZED: "Veuillez vous connecter pour continuer",
    FORBIDDEN: "Accès refusé",

    // Erreurs réseau/serveur
    NETWORK_ERROR: "Erreur réseau, vérifiez votre connexion internet",
    SERVER_ERROR: "Erreur interne du serveur, nos techniciens ont été prévenus",
    CORS_ERROR: "Erreur de sécurité, accès refusé par le serveur",
    ECONNRESET:
      "La connexion à la base de données a été interrompue. Veuillez réessayer.",
  };

  /**
   * Gestion complète des erreurs Better Auth
   */
  static handleAuthError(
    error: unknown,
    context?: Partial<AuthErrorContext>
  ): {
    message: string;
    code: string;
    isRetryable: boolean;
    context?: AuthErrorContext;
  } {
    // Erreurs API Better Auth
    if (error instanceof APIError) {
      return {
        message: this.getErrorMessage(error.message),
        code: error.message,
        isRetryable: this.isRetryableError(error.message),
        context: context as AuthErrorContext,
      };
    }

    // Erreurs réseau (CORS, etc.)
    if (error instanceof TypeError && error.message.includes("fetch")) {
      return {
        message: this.ERROR_MESSAGES["NETWORK_ERROR"],
        code: "NETWORK_ERROR",
        isRetryable: true,
        context: context as AuthErrorContext,
      };
    }

    // Erreurs génériques
    if (error instanceof Error) {
      // Détection des erreurs CORS
      if (error.message.includes("CORS") || error.message.includes("Origin")) {
        return {
          message: this.ERROR_MESSAGES["CORS_ERROR"],
          code: "CORS_ERROR",
          isRetryable: false,
          context: context as AuthErrorContext,
        };
      }

      return {
        message: this.getErrorMessage(error.message),
        code: "UNKNOWN_ERROR",
        isRetryable: false,
        context: context as AuthErrorContext,
      };
    }

    // Erreur inconnue
    return {
      message: "Une erreur inattendue est survenue",
      code: "UNEXPECTED_ERROR",
      isRetryable: false,
      context: context as AuthErrorContext,
    };
  }

  private static getErrorMessage(errorCode: string): string {
    return this.ERROR_MESSAGES[errorCode] || "Une erreur est survenue";
  }

  private static isRetryableError(errorCode: string): boolean {
    const retryableErrors = [
      "TOO_MANY_REQUESTS",
      "NETWORK_ERROR",
      "SERVER_ERROR",
    ];
    return retryableErrors.includes(errorCode);
  }
}
