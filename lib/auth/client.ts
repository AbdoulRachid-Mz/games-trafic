import { authClient } from "../auth-client";

// Types pour le client
export type ClientSession = typeof authClient.$Infer.Session;
export type ClientUser = typeof authClient.$Infer.Session.user;

// Messages d'erreur en français
const errorMessages = {
  USER_ALREADY_EXISTS: "Un utilisateur avec cet email existe déjà",
  INVALID_EMAIL_OR_PASSWORD: "Email ou mot de passe invalide",
  EMAIL_NOT_VERIFIED: "Votre email n'est pas encore vérifié",
  INVALID_TOKEN: "Le jeton a expiré ou est invalide",
  PASSWORD_TOO_SHORT: "Le mot de passe est trop court",
  PASSWORD_TOO_WEAK: "Le mot de passe n'est pas assez sécurisé",
  INVALID_EMAIL: "Format d'email invalide",
  ACCOUNT_NOT_FOUND: "Aucun compte trouvé avec cet email",
  TOO_MANY_REQUESTS: "Trop de tentatives, veuillez réessayer plus tard",
  NETWORK_ERROR: "Erreur de connexion réseau",
  UNKNOWN_ERROR: "Une erreur inconnue s'est produite"
};

const getErrorMessage = (error: any): string => {
  if (!error) return errorMessages.UNKNOWN_ERROR;
  
  // Si c'est un code d'erreur connu
  if (error.code && errorMessages[error.code as keyof typeof errorMessages]) {
    return errorMessages[error.code as keyof typeof errorMessages];
  }
  
  // Si c'est un message d'erreur direct
  if (typeof error.message === 'string') {
    return error.message;
  }
  
  // Fallback
  return errorMessages.UNKNOWN_ERROR;
};

// Méthodes pratiques pour le client avec gestion d'erreurs améliorée
export const authMethods = {
  // Inscription
  signUp: async (email: string, password: string, userData?: any) => {
    try {
      const res = await authClient.signUp.email({
        email,
        password,
        name: userData?.fullName || '',
        ...userData,
      });
      
      if (res.error) {
        return { 
          data: null, 
          error: { message: getErrorMessage(res.error) } 
        };
      }
      
      return { data: res.data, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: { message: getErrorMessage(error) } 
      };
    }
  },

  // Connexion
  signIn: async (email: string, password: string, rememberMe = true) => {
    try {
      const res = await authClient.signIn.email({
        email,
        password,
        rememberMe,
      });
      
      if (res.error) {
        return { 
          data: null, 
          error: { message: getErrorMessage(res.error) } 
        };
      }
      
      return { data: res.data, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: { message: getErrorMessage(error) } 
      };
    }
  },

  // Connexion avec passkey
  signInWithPasskey: async (autoFill = true) => {
    try {
      const res = await authClient.signIn.passkey({
        autoFill,
      });
      
      if (res.error) {
        return { 
          data: null, 
          error: { message: getErrorMessage(res.error) } 
        };
      }
      
      return { data: res.data, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: { message: getErrorMessage(error) } 
      };
    }
  },

  // Ajouter une passkey (utilisateur connecté)
  addPasskey: async (name?: string, authenticatorAttachment?: "platform" | "cross-platform") => {
    try {
      const res = await authClient.passkey.addPasskey({
        name: name || "Ma passkey",
        authenticatorAttachment,
      });
      
      if (res.error) {
        return { 
          data: null, 
          error: { message: getErrorMessage(res.error) } 
        };
      }
      
      return { data: res.data, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: { message: getErrorMessage(error) } 
      };
    }
  },

  // Lister les passkeys de l'utilisateur
  listPasskeys: async () => {
    try {
      const res = await authClient.passkey.listUserPasskeys();
      
      if (res.error) {
        return { 
          data: null, 
          error: { message: getErrorMessage(res.error) } 
        };
      }
      
      return { data: res.data, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: { message: getErrorMessage(error) } 
      };
    }
  },

  // Supprimer une passkey
  deletePasskey: async (id: string) => {
    try {
      const res = await authClient.passkey.deletePasskey({ id });
      
      if (res.error) {
        return { 
          data: null, 
          error: { message: getErrorMessage(res.error) } 
        };
      }
      
      return { data: res.data, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: { message: getErrorMessage(error) } 
      };
    }
  },

  // Connexion sociale
  signInWithSocial: async (provider: "google" | "github") => {
    try {
      const res = await authClient.signIn.social({
        provider,
        callbackURL: "/dashboard",
      });
      
      return { data: res, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: { message: getErrorMessage(error) } 
      };
    }
  },

  // Déconnexion
  signOut: async () => {
    try {
      const res = await authClient.signOut();
      return { data: res, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: { message: getErrorMessage(error) } 
      };
    }
  },

  // Mot de passe oublié
  // forgotPassword: async (email: string, redirectTo?: string) => {
  //   try {
  //     const res = await authClient.forgetPassword({
  //       email,
  //       redirectTo,
  //     });
      
  //     if (res.error) {
  //       return { 
  //         data: null, 
  //         error: { message: getErrorMessage(res.error) } 
  //       };
  //     }
      
  //     return { data: res.data, error: null };
  //   } catch (error) {
  //     return { 
  //       data: null, 
  //       error: { message: getErrorMessage(error) } 
  //     };
  //   }
  // },

  // Réinitialisation mot de passe
  resetPassword: async (token: string, newPassword: string) => {
    try {
      const res = await authClient.resetPassword({
        token,
        newPassword,
      });
      
      if (res.error) {
        return { 
          data: null, 
          error: { message: getErrorMessage(res.error) } 
        };
      }
      
      return { data: res.data, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: { message: getErrorMessage(error) } 
      };
    }
  },

  // Changement mot de passe
  changePassword: async (currentPassword: string, newPassword: string) => {
    try {
      const res = await authClient.changePassword({
        currentPassword,
        newPassword,
      });
      
      if (res.error) {
        return { 
          data: null, 
          error: { message: getErrorMessage(res.error) } 
        };
      }
      
      return { data: res.data, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: { message: getErrorMessage(error) } 
      };
    }
  },

  // Vérification email
  sendVerificationEmail: async (email: string) => {
    try {
      const res = await authClient.sendVerificationEmail({
        email,
      });
      
      if (res.error) {
        return { 
          data: null, 
          error: { message: getErrorMessage(res.error) } 
        };
      }
      
      return { data: res.data, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: { message: getErrorMessage(error) } 
      };
    }
  },
};

// Export du client pour utilisation directe si nécessaire
export { authClient };