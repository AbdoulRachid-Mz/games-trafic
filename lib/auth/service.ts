// lib/auth/service.ts
import { auth } from '../auth';
import { db } from '@/lib/db';
import { users, userWallets, shops, tournaments, vipSubscriptions, products, interactions, UserWithRelations, User, VipSubscription, Tournament, Shop, UserWallet } from '@/database/schema';
import { and, eq, sql } from 'drizzle-orm';
import { headers } from 'next/headers';
import { AuthErrorHandler } from './errors';
import { getProfile, getMyProfile } from '@/actions/users';
import { getAppUrlEnv } from '@/utils/app-url';
import { createUserWallet } from '@/actions/wallets';

// Définition des types basés sur le schéma
export interface AuthResponse {
  success: boolean;
  user?: UserWithRelations;
  session?: any;
  error?: string;
}

// export interface CompleteUserData {
//   user: User;
//   wallet?: UserWallet;
//   shops: Shop[];
//   tournaments: Tournament[];
//   vipSubscription?: VipSubscription;
//   stats: {
//     shopsCount: number;
//     tournamentsCount: number;
//     productsCount: number;
//     followersCount?: number;
//     followingCount?: number;
//   };
// }

export class AuthService {
  /**
   * Récupération de session côté serveur
   */
  static async getSession() {
    try {
      const session = await auth.api.getSession({
        headers: await headers(),
      });
      return session;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  /**
   * Inscription avec email/mot de passe
   */
  static async signUp(
    email: string,
    password: string,
    userData?: {
      username?: string;
      fullName?: string;
      phoneNumber?: string;
    }
  ): Promise<AuthResponse> {
    try {
      // Préparer le body avec des valeurs par défaut pour les champs requis
      const body: any = {
        email,
        password,
        username: userData?.fullName || email.split('@')[0], // 'name' est requis par Better Auth
      };

      // Ajouter les champs additionnels seulement s'ils sont définis
      if (userData?.username) body.username = userData.username;
      if (userData?.fullName) body.fullName = userData.fullName;
      if (userData?.phoneNumber) body.phoneNumber = userData.phoneNumber;

      const result = await auth.api.signUpEmail({
        body,
        headers: await headers(),
      });
      // Le résultat peut être soit une URL de redirection, soit un objet avec l'utilisateur
      if ('url' in result && result.url) {
        // Redirection nécessaire (ex. vérification email)
        return {
          success: true,
          session: result
        };
      }

      // Vérifier si l'utilisateur est présent dans le résultat
      if ('user' in result && result.user?.id) {
        // Créer le wallet par défaut
        await createUserWallet({
          userId: result.user.id,
          pinHash: 'default', // to be hashed in production
          isActive: false,
          isLocked: false,
          verificationStatus: 'PENDING',
        });

        return {
          success: true,
          user: (await getProfile(result.user.id, { includeFullData: true })) as UserWithRelations | undefined,
          session: result
        };
      }

      // Si aucune donnée utilisateur n'est présente, retourner une erreur
      return {
        success: false,
        error: 'Une erreur est survenue lors de l\'inscription'
      };

    } catch (error: any) {
      console.error('Erreur lors de l\'inscription:', error);
      return {
        success: false,
        error: 'Une erreur est survenue lors de l\'inscription'
      };
    }
  }

  /**
   * Connexion avec email/mot de passe
   */
  // Mettre à jour signIn et signUp pour utiliser getMyProfile
  static async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      const result = await auth.api.signInEmail({
        body: { email, password },
        headers: await headers(),
      });

      // Handle redirect case
      if ('url' in result && result.url) {
        return { success: true, session: result };
      }

      // Handle error case
      if ('error' in result && result.error) {
        return {
          success: false,
          error: result.error ? AuthErrorHandler.handleAuthError(result.error as string, {
            operation: 'signIn',
            timestamp: new Date(),
          }).message : 'Une erreur est survenue lors de la connexion'
        };
      }

      // Ensure user exists
      if (!('user' in result) || !result.user?.id) {
        return { success: false, error: 'Une erreur est survenue lors de la connexion' };
      }

      // Mettre à jour la dernière connexion
      await this.updateLastLogin(result.user.id);

      // Récupérer le profil complet
      const completeData = await this.getCompleteUserData(result.user.id);

      return {
        success: true,
        user: completeData as UserWithRelations | undefined,
        session: result
      };

    } catch (error: any) {
      console.error('Erreur lors de la connexion:', error);
      return {
        success: false,
        error: 'Une erreur est survenue lors de la connexion'
      };
    }
  }

  /**
   * Mot de passe oublié
   */
  static async forgotPassword(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await auth.api.requestPasswordReset({
        body: {
          email,
          redirectTo: `${getAppUrlEnv()}/reset-password`,
        },
      });

      // Le résultat de requestPasswordReset ne contient pas de champ 'error'
      // Si la méthode échoue, une exception est levée ; sinon le reset a été initié

      return { success: true };

    } catch (error: unknown) {
      console.error('Erreur lors de la demande de réinitialisation:', error);
      const handled = AuthErrorHandler.handleAuthError(error, {
        operation: 'forgotPassword',
        timestamp: new Date(),
      });
      return {
        success: false,
        error: handled.message,
      };
    }
  }

  /**
   * Réinitialisation du mot de passe
   */
  static async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await auth.api.resetPassword({
        body: {
          token,
          newPassword,
        },
      });

      // Le résultat de resetPassword ne contient pas d'erreur, seulement une URL ou un user
      if (!result) {
        return {
          success: false,
          error: 'Une erreur est survenue lors de la réinitialisation du mot de passe'
        };
      }

      return { success: true };

    } catch (error: any) {
      console.error('Erreur lors de la réinitialisation du mot de passe:', error);
      const handled = AuthErrorHandler.handleAuthError(error, {
        operation: 'resetPassword',
        timestamp: new Date(),
      });
      return {
        success: false,
        error: handled.message,
      };
    }
  }

  /**
   * Connexion sociale - version serveur
   */
  static async signInWithSocial(provider: "google" | "facebook" | "tiktok"): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const result = await auth.api.signInSocial({
        body: {
          provider,
          callbackURL: `${getAppUrlEnv()}/api/auth/callback/${provider}`,
        },
      });

      // Le résultat de signInSocial ne contient pas d'erreur, seulement une URL ou un user
      if (!result) {
        const handled = AuthErrorHandler.handleAuthError('SERVER_ERROR', {
          operation: 'signInWithSocial',
          timestamp: new Date(),
        });
        return {
          success: false,
          error: handled.message
        };
      }

      return {
        success: true,
        url: result?.url
      };

    } catch (error: any) {
      console.error(`Erreur lors de la connexion ${provider}:`, error);
      const handled = AuthErrorHandler.handleAuthError(error, {
        operation: 'signInWithSocial',
        timestamp: new Date(),
      });
      return {
        success: false,
        error: handled.message
      };
    }
  }

  /**
   * Déconnexion
   */
  static async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await auth.api.signOut({
        headers: await headers(),
      });

      // Le résultat de signOut ne contient pas d'erreur, seulement un user ou une URL
      if (!result) {
        const handled = AuthErrorHandler.handleAuthError('SERVER_ERROR', {
          operation: 'signOut',
          timestamp: new Date(),
        });
        return {
          success: false,
          error: handled.message,
        };
      }

      return { success: true };

    } catch (error: any) {
      console.error('Erreur lors de la déconnexion:', error);
      const handled = AuthErrorHandler.handleAuthError(error, {
        operation: 'signOut',
        timestamp: new Date(),
      });
      return {
        success: false,
        error: handled.message,
      };
    }
  }

  /**
   * Changement de mot de passe
   */
  static async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await auth.api.changePassword({
        body: {
          currentPassword,
          newPassword,
        },
        headers: await headers(),
      });

      // Better Auth changePassword returns either a user object (success) or throws on failure
      // No error field is present in the result, so we simply return success if we reach here

      return { success: true };

    } catch (error: any) {
      console.error('Erreur lors du changement de mot de passe:', error);
      return {
        success: false,
        error: 'Une erreur est survenue lors du changement de mot de passe'
      };
    }
  }

  /**
   * Vérification d'email
   */
  static async sendVerificationEmail(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await auth.api.sendVerificationEmail({
        body: {
          email,
          callbackURL: `${getAppUrlEnv()}/verify-email`,
        },
      });

      // sendVerificationEmail ne renvoie pas d'erreur ; si la méthode échoue, une exception est levée
      // On ne fait donc rien ici et on laisse le bloc try/catch gérer les erreurs

      return { success: true };

    } catch (error: any) {
      console.error('Erreur lors de l\'envoi de l\'email de vérification:', error);
      return {
        success: false,
        error: 'Une erreur est survenue lors de l\'envoi de l\'email de vérification'
      };
    }
  }

  /**
   * Vérification du token de réinitialisation
   */
  static async verifyResetToken(token: string): Promise<{ success: boolean; email?: string; error?: string }> {
    try {
      // Cette fonctionnalité n'est pas directement disponible dans Better Auth
      // On peut implémenter une vérification custom si nécessaire
      return {
        success: false,
        error: 'Fonctionnalité non implémentée'
      };
    } catch (error: any) {
      console.error('Erreur lors de la vérification du token:', error);
      return {
        success: false,
        error: 'Une erreur est survenue lors de la vérification du token'
      };
    }
  }

  /**
    * Récupération des données utilisateur complètes
    */
  static async getCompleteUserData(userId: string) {
    try {
      return await getProfile(userId, { includeFullData: true });
    } catch (error) {
      console.error('Error getting complete user data:', error);
      return null;
    }
  }

  /**
   * Récupération du profil de l'utilisateur courant
   */
  static async getMyProfile() {
    try {
      const session = await this.getSession();
      if (!session?.user?.id) return null;

      return await getMyProfile();
    } catch (error) {
      console.error('Error getting my profile:', error);
      return null;
    }
  }


  /**
   * Mise à jour du profil
   */
  static async updateProfile(
    userId: string,
    updates: {
      username?: string;
      fullName?: string;
      profileImage?: string;
      bio?: string;
      website?: string;
      country?: string;
      phoneNumber?: string;
    }
  ): Promise<AuthResponse> {
    try {
      const result = await db.update(users)
        .set({
          ...(updates.username && { username: updates.username }),
          ...(updates.fullName && { fullName: updates.fullName }),
          ...(updates.profileImage && { profileImage: updates.profileImage }),
          ...(updates.bio && { bio: updates.bio }),
          ...(updates.website && { website: updates.website }),
          ...(updates.country && { country: updates.country }),
          ...(updates.phoneNumber && { phoneNumber: updates.phoneNumber }),
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning();

      if (!result.length) {
        return {
          success: false,
          error: 'Utilisateur non trouvé'
        };
      }

      return {
        success: true,
        user: (await this.getCompleteUserData(userId)) as UserWithRelations | undefined,
      };

    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      return {
        success: false,
        error: 'Erreur lors de la mise à jour du profil'
      };
    }
  }

  /**
   * Créer un wallet utilisateur
   */
  private static async createUserWallet(userId: string): Promise<void> {
    try {
      await createUserWallet({
        userId,
        pinHash: 'default', // to be hashed in production
        isActive: false,
        isLocked: false,
        verificationStatus: 'PENDING',
      });
    } catch (error) {
      console.error('Error creating user wallet:', error);
    }
  }

  /**
   * Mettre à jour la dernière connexion
   */
  private static async updateLastLogin(userId: string): Promise<void> {
    try {
      await db.update(users)
        .set({
          lastLogin: new Date(),
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  }

}