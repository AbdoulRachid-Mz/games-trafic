'use server';

import { appSettings, type AppSettings, type NewAppSettings } from '@/database/schema';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';
import { assertAdmin, assertCanManageFees } from '@/lib/auth/permissions';
import { createUserTrace } from '@/actions/user-traces';
import type { AppSettingsUpdate } from '@/config/app-config';
import { cacheTag, cacheLife } from 'next/cache';
import { revalidateTag } from 'next/cache';

// ============================================================================
// QUERIES - Lecture des données
// ============================================================================

/** Identifiant stable de la ligne singleton de configuration. */
const APP_SETTINGS_SINGLETON_ID = 'global';

/**
 * Récupère la configuration actuelle (singleton).
 *
 * Auto-réparation : si la table `app_settings` est vide (base fraîche ou
 * migration appliquée manuellement sans seed), la ligne singleton est créée
 * avec les valeurs par défaut du schéma. Sans cela, toutes les opérations
 * financières échouaient avec `FEE_POLICY_UNAVAILABLE`.
 */
export async function getAppSettings(): Promise<NewAppSettings | null> {
  'use cache';
  cacheTag('app-settings');
  cacheLife('hours');
  try {
    const rows = await db.select().from(appSettings).limit(1);
    if (rows[0]) return rows[0];

    // Toutes les colonnes ont une valeur par défaut en base : insérer
    // uniquement l'id suffit à matérialiser la politique par défaut.
    // `onConflictDoNothing` protège contre deux requêtes concurrentes.
    await db
      .insert(appSettings)
      .values({ id: APP_SETTINGS_SINGLETON_ID })
      .onConflictDoNothing({ target: appSettings.id });

    const [created] = await db.select().from(appSettings).limit(1);
    return created ?? null;
  } catch (error) {
    console.warn('Database offline or unreachable for app-settings, fallback to null:', (error as any)?.message || error);
    return null;
  }
}

/**
 * Récupère une valeur spécifique de configuration
 */
export async function getAppSettingValue<T = any>(key: keyof NewAppSettings): Promise<T | null> {
  try {
    const settings = await getAppSettings();
    return settings ? (settings[key] as T) : null;
  } catch (error) {
    console.error(`Error getting app setting ${String(key)}:`, error);
    throw new Error(`Failed to fetch setting ${String(key)}`);
  }
}

// ============================================================================
// MUTATIONS - Écriture des données
// ============================================================================

/**
 * Initialise la configuration de base si elle n'existe pas
 */
export async function initAppConfig(): Promise<NewAppSettings> {
  try {
    const existing = await getAppSettings();
    if (existing) return existing;

    const defaultSettings: NewAppSettings = {
      maxProductsRegular: 5,
      maxProductsVip: 20,
      maxShopsRegular: 1,
      maxShopsVip: 5,
      maxTournamentsRegular: 1,
      maxTournamentsVip: 5,
      storyDurationHours: 48,
      maxStoriesPerDayRegular: 3,
      maxStoriesPerDayVip: 10,
      transactionFeePercentage: '0.001',
      purchaseFeePercentage: '0.01',
      depositFeePercentage: '0.00',
      withdrawalFeePercentage: '0.02',
      transferFeePercentage: '0.005',
      tournamentParticipationFeePercentage: '0.01',
      gtcToFcfaRate: '500.0',
      gtcToEurRate: null,
      gtcToUsdRate: null,
      lastExchangeRateUpdate: new Date(),
      vipMonthlyPrice: '250',
      vipYearlyPrice: '2500',
      freeThemesLimitRegular: 2,
      freeThemesLimitVip: 10,
      maxThemeCreationsRegular: 0,
      maxThemeCreationsVip: 5,
      canVipCreateThemes: true,
      canVipSellThemes: true,
      themeCreationFee: '0.0',
      themeSaleCommissionPercentage: '0.15',
      maxParticipantsPerTournament: 32,
      maxCoOrganizersRatio: 0.33,
      gameItemsEnabled: true,
      gameItemCommissionPercentage: '0.05',
      minGameItemRequest: '1.0',
      maxGameItemRequest: '1000.0',
      userPermissions: {},
      adminPermissions: {},
      regularUserPermissions: [],
      vipUserPermissions: [],
      publicRoutes: [],
      protectedRoutes: [],
      adminRoutes: {},
      adminTasks: {},
      maintenanceMode: false,
      defaultUserBalance: 250,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const [inserted] = await db.insert(appSettings).values(defaultSettings).returning();
    return inserted;
  } catch (error) {
    console.error('Error initializing app config:', error);
    throw new Error('Failed to initialize app config');
  }
}

/**
 * Met à jour la configuration globale (merge partiel)
 */
export async function updateAppSettings(
  updates: AppSettingsUpdate
): Promise<NewAppSettings> {
  try {
    const sessionUser = await getCurrentUser();
    assertAdmin(sessionUser);

    const existing = await getAppSettings();
    if (!existing) throw new Error('App settings not found');

    // Préparer les mises à jour avec timestamp
    const updateData: Record<string, any> = {
      ...updates,
      updatedAt: new Date(),
    };

    const [updated] = await db
      .update(appSettings)
      .set(updateData)
      .returning();
    
    revalidateTag('app-settings', 'max');
    return updated;
  } catch (error) {
    console.error('Error updating app settings:', error);
    if (error instanceof Error) throw error;
    throw new Error('Failed to update app settings');
  }
}

/**
 * Met à jour un champ spécifique
 */
export async function setAppSettingValue<K extends keyof NewAppSettings>(
  key: K,
  value: NewAppSettings[K]
): Promise<NewAppSettings> {
  try {
    const [updated] = await db
      .update(appSettings)
      .set({ [key]: value, updatedAt: new Date() })
      .returning();
    
    if (!updated) throw new Error('App settings not found');
    revalidateTag('app-settings', 'max');
    return updated;
  } catch (error) {
    console.error(`Error setting ${String(key)}:`, error);
    throw new Error(`Failed to update setting ${String(key)}`);
  }
}

/**
 * Active/désactive le mode maintenance
 */
export async function setMaintenanceMode(enabled: boolean): Promise<NewAppSettings> {
  return setAppSettingValue('maintenanceMode', enabled);
}


/**
 * Met à jour les taux de change
 */
export async function updateExchangeRates(rates: {
  gtcToFcfa?: string;
  gtcToEur?: string;
  gtcToUsd?: string;
}): Promise<NewAppSettings> {
  try {
    const updateData: Record<string, any> = {
      lastExchangeRateUpdate: new Date(),
    };
    
    if (rates.gtcToFcfa !== undefined) {
      updateData.gtcToFcfaRate = rates.gtcToFcfa;
    }
    
    if (rates.gtcToEur !== undefined) {
      updateData.gtcToEurRate = rates.gtcToEur;
    }
    
    if (rates.gtcToUsd !== undefined) {
      updateData.gtcToUsdRate = rates.gtcToUsd;
    }
    
    const [updated] = await db
      .update(appSettings)
      .set(updateData)
      .returning();
    
    return updated;
  } catch (error) {
    console.error('Error updating exchange rates:', error);
    throw new Error('Failed to update exchange rates');
  }
}

/**
 * Met à jour les tarifs VIP
 */
export async function updateVipPricing(pricing: {
  monthly?: string;
  yearly?: string;
}): Promise<NewAppSettings> {
  try {
    const sessionUser = await getCurrentUser();
    assertCanManageFees(sessionUser);
    if (!sessionUser) {
      throw new Error('Non autorisé : aucune session active trouvée');
    }

    const updates: AppSettingsUpdate = {};
    if (pricing.monthly !== undefined) updates.vipMonthlyPrice = pricing.monthly;
    if (pricing.yearly !== undefined) updates.vipYearlyPrice = pricing.yearly;

    const result = await updateAppSettings(updates);

    try {
      await createUserTrace({
        userId: sessionUser.id,
        type: "OTHER",
        payload: {
          action: "UPDATE_VIP_PRICING",
          pricing,
        },
      });
    } catch (traceErr) {
      console.warn("Could not log trace for VIP pricing update:", traceErr);
    }

    return result;
  } catch (error) {
    console.error('Error updating VIP pricing:', error);
    throw new Error('Failed to update VIP pricing');
  }
}

/**
 * Met à jour les frais de transaction
 */
export async function updateTransactionFees(fees: {
  transaction?: string;
  purchase?: string;
  deposit?: string;
  withdrawal?: string;
  transfer?: string;
  tournamentParticipation?: string;
}): Promise<NewAppSettings> {
  try {
    const sessionUser = await getCurrentUser();
    assertCanManageFees(sessionUser);
    if (!sessionUser) {
      throw new Error('Non autorisé : aucune session active trouvée');
    }
    
    const updates: AppSettingsUpdate = {};
    if (fees.transaction !== undefined) updates.transactionFeePercentage = fees.transaction;
    if (fees.purchase !== undefined) updates.purchaseFeePercentage = fees.purchase;
    if (fees.deposit !== undefined) updates.depositFeePercentage = fees.deposit;
    if (fees.withdrawal !== undefined) updates.withdrawalFeePercentage = fees.withdrawal;
    if (fees.transfer !== undefined) updates.transferFeePercentage = fees.transfer;
    if (fees.tournamentParticipation !== undefined) updates.tournamentParticipationFeePercentage = fees.tournamentParticipation;

    const result = await updateAppSettings(updates);

    try {
      await createUserTrace({
        userId: sessionUser.id,
        type: "OTHER",
        payload: {
          action: "UPDATE_TRANSACTION_FEES",
          fees,
        },
      });
    } catch (traceErr) {
      console.warn("Could not log trace for fee update:", traceErr);
    }

    return result;
  } catch (error) {
    console.error('Error updating transaction fees:', error);
    throw new Error('Failed to update transaction fees');
  }
}

/**
 * Met à jour les limites utilisateur
 */
export async function updateUserLimits(limits: {
  maxProductsRegular?: number;
  maxProductsVip?: number;
  maxShopsRegular?: number;
  maxShopsVip?: number;
  maxTournamentsRegular?: number;
  maxTournamentsVip?: number;
  maxStoriesPerDayRegular?: number;
  maxStoriesPerDayVip?: number;
}): Promise<NewAppSettings> {
  try {
    const updates: AppSettingsUpdate = {};
    if (limits.maxProductsRegular !== undefined) updates.maxProductsRegular = limits.maxProductsRegular;
    if (limits.maxProductsVip !== undefined) updates.maxProductsVip = limits.maxProductsVip;
    if (limits.maxShopsRegular !== undefined) updates.maxShopsRegular = limits.maxShopsRegular;
    if (limits.maxShopsVip !== undefined) updates.maxShopsVip = limits.maxShopsVip;
    if (limits.maxTournamentsRegular !== undefined) updates.maxTournamentsRegular = limits.maxTournamentsRegular;
    if (limits.maxTournamentsVip !== undefined) updates.maxTournamentsVip = limits.maxTournamentsVip;
    return await updateAppSettings(updates);
  } catch (error) {
    console.error('Error updating user limits:', error);
    throw new Error('Failed to update user limits');
  }
}

/**
 * Met à jour les permissions
 */
export async function updatePermissions(permissions: {
  user?: Record<string, any>;
  admin?: Record<string, any>;
  regularUser?: string[];
  vipUser?: string[];
}): Promise<NewAppSettings> {
  try {
    const updates: AppSettingsUpdate = {};
    if (permissions.user !== undefined) updates.userPermissions = permissions.user;
    if (permissions.admin !== undefined) updates.adminPermissions = permissions.admin;
    if (permissions.regularUser !== undefined) updates.regularUserPermissions = permissions.regularUser;
    if (permissions.vipUser !== undefined) updates.vipUserPermissions = permissions.vipUser;
    return await updateAppSettings(updates);
  } catch (error) {
    console.error('Error updating permissions:', error);
    throw new Error('Failed to update permissions');
  }
}

/**
 * Met à jour les routes
 */
export async function updateRoutes(routes: {
  public?: string[];
  protected?: string[];
  admin?: Record<string, any>;
}): Promise<NewAppSettings> {
  try {
    return await updateAppSettings({
      publicRoutes: routes.public ?? undefined,
      protectedRoutes: routes.protected ?? undefined,
      adminRoutes: routes.admin ?? undefined,
    });
  } catch (error) {
    console.error('Error updating routes:', error);
    throw new Error('Failed to update routes');
  }
}

/**
 * Supprime la configuration (réinitialisation complète)
 * ⚠️ À utiliser avec précaution
 */
export async function resetAppSettings(): Promise<void> {
  try {
    const sessionUser = await getCurrentUser();
    assertAdmin(sessionUser, 'A');
    await db.delete(appSettings);
  } catch (error) {
    console.error('Error resetting app settings:', error);
    throw new Error('Failed to reset app settings');
  }
}
