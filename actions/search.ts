// actions/search.ts
'use server';

import { 
  shops, products, tournaments, 
  themes, services, guides, blogs, posts,
  searchHistory,
  type Shop, type Product, type Tournament,
  type Theme, type Service, type Guide, type Blog, type Post
} from '@/database/schema';
import { db } from '@/lib/db';
import { ilike, or, and, desc, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { cacheTag, cacheLife } from 'next/cache';

// Types pour les résultats de recherche
export interface SearchResult<T = any> {
  id: string;
  type: string;
  title: string;
  description?: string;
  image?: string;
  price?: number;
  currency?: string;
  metadata: T;
}

// Fonction de recherche unifiée
export async function unifiedSearch(
  entityTypes: string[],
  searchTerm: string,
  options: {
    limit?: number;
    offset?: number;
    userId?: string;
  } = {}
): Promise<SearchResult[]> {
  try {
    const { limit = 20, offset = 0, userId } = options;
    const cleanTerm = searchTerm.trim();
    
    if (!cleanTerm || cleanTerm.length < 2) {
      return [];
    }

    const searchPattern = `%${cleanTerm}%`;
    const results: SearchResult[] = [];

    // Recherche dans chaque type d'entité demandé
    for (const entityType of entityTypes) {
      let entityResults: any[] = [];
      
      switch (entityType.toLowerCase()) {
        case 'shops':
        case 'shop':
          entityResults = await db
            .select({
              id: shops.id,
              name: shops.name,
              description: shops.description,
              profileImage: shops.profileImage,
              type: sql`'shop'`.as('type')
            })
            .from(shops)
            .where(
              and(
                or(
                  ilike(shops.name, searchPattern),
                  ilike(shops.description || '', searchPattern)
                ),
                sql`${shops.isActive} = true`,
                sql`${shops.isDeleted} = false`
              )
            )
            .limit(Math.ceil(limit / entityTypes.length))
            .offset(offset);
          break;

        case 'products':
        case 'product':
          entityResults = await db
            .select({
              id: products.id,
              name: products.name,
              description: products.description,
              featuredImage: products.featuredImage,
              price: products.price,
              currency: products.currency,
              type: sql`'product'`.as('type')
            })
            .from(products)
            .where(
              and(
                or(
                  ilike(products.name, searchPattern),
                  ilike(products.description || '', searchPattern),
                  ilike(products.game || '', searchPattern)
                ),
                sql`${products.isActive} = true`,
                sql`${products.isVisible} = true`,
                sql`${products.isDeleted} = false`
              )
            )
            .limit(Math.ceil(limit / entityTypes.length))
            .offset(offset);
          break;

        case 'tournaments':
        case 'tournament':
          entityResults = await db
            .select({
              id: tournaments.id,
              name: tournaments.name,
              description: tournaments.description,
              profileImage: tournaments.profileImage,
              type: sql`'tournament'`.as('type')
            })
            .from(tournaments)
            .where(
              and(
                or(
                  ilike(tournaments.name, searchPattern),
                  ilike(tournaments.description || '', searchPattern)
                ),
                sql`${tournaments.isActive} = true`,
                sql`${tournaments.isDeleted} = false`
              )
            )
            .limit(Math.ceil(limit / entityTypes.length))
            .offset(offset);
          break;

        case 'themes':
        case 'theme':
          entityResults = await db
            .select({
              id: themes.id,
              name: themes.name,
              description: themes.description,
              thumbnail: themes.thumbnail,
              price: themes.price,
              type: sql`'theme'`.as('type')
            })
            .from(themes)
            .where(
              and(
                or(
                  ilike(themes.name, searchPattern),
                  ilike(themes.description || '', searchPattern)
                ),
                sql`${themes.isActive} = true`,
                sql`${themes.isPublic} = true`,
                sql`${themes.isDeleted} = false`
              )
            )
            .limit(Math.ceil(limit / entityTypes.length))
            .offset(offset);
          break;

        case 'services':
        case 'service':
          entityResults = await db
            .select({
              id: services.id,
              title: services.title,
              description: services.description,
              images: services.images,
              type: sql`'service'`.as('type')
            })
            .from(services)
            .where(
              and(
                or(
                  ilike(services.title, searchPattern),
                  ilike(services.description, searchPattern)
                ),
                sql`${services.isActive} = true`,
                sql`${services.isDeleted} = false`
              )
            )
            .limit(Math.ceil(limit / entityTypes.length))
            .offset(offset);
          break;

        case 'guides':
        case 'guide':
          entityResults = await db
            .select({
              id: guides.id,
              title: guides.title,
              category: guides.category,
              images: guides.images,
              type: sql`'guide'`.as('type')
            })
            .from(guides)
            .where(
              and(
                or(
                  ilike(guides.title, searchPattern),
                  ilike(guides.category, searchPattern)
                ),
                sql`${guides.isActive} = true`,
                sql`${guides.isDeleted} = false`
              )
            )
            .limit(Math.ceil(limit / entityTypes.length))
            .offset(offset);
          break;

        case 'blogs':
        case 'blog':
          entityResults = await db
            .select({
              id: blogs.id,
              title: blogs.title,
              content: blogs.content,
              images: blogs.images,
              type: sql`'blog'`.as('type')
            })
            .from(blogs)
            .where(
              and(
                or(
                  ilike(blogs.title, searchPattern),
                  ilike(blogs.content, searchPattern)
                ),
                sql`${blogs.isActive} = true`,
                sql`${blogs.isDeleted} = false`
              )
            )
            .limit(Math.ceil(limit / entityTypes.length))
            .offset(offset);
          break;

        case 'news':
          entityResults = await db
            .select({
              id: posts.id,
              content: posts.content,
              images: posts.images,
              type: sql`'news'`.as('type')
            })
            .from(posts)
            .where(
              and(
                ilike(posts.content, searchPattern),
                sql`${posts.isStory} = false`,
                sql`${posts.isActive} = true`,
                sql`${posts.isDeleted} = false`
              )
            )
            .limit(Math.ceil(limit / entityTypes.length))
            .offset(offset);
          break;
      }

      // Transformer les résultats
      const transformed = entityResults.map(item => ({
        id: item.id,
        type: entityType.toLowerCase(),
        title: item.name || item.title || item.content?.substring(0, 50) || 'Sans titre',
        description: item.description || item.content?.substring(0, 100),
        image: item.profileImage || item.featuredImage || item.thumbnail || 
               item.images?.[0] || item.image,
        price: item.price,
        currency: item.currency,
        metadata: item
      }));

      results.push(...transformed);
    }

    // Enregistrer la tendance de recherche (asynchrone - ne pas attendre)
    if (userId && cleanTerm.length >= 2) {
      recordSearchTrend(cleanTerm, entityTypes, userId).catch(console.error);
    }

    return results;
  } catch (error) {
    console.error('Search error:', error);
    throw new Error('Failed to perform search');
  }
}

// Fonction pour enregistrer les tendances de recherche
export async function recordSearchTrend(
  searchTerm: string,
  entityTypes: string[] = [],
  userId?: string
): Promise<void> {
  try {
    const cleanTerm = searchTerm.trim().toLowerCase();
    if (!cleanTerm || cleanTerm.length < 2) return;

    // Vérifier si une recherche similaire existe déjà pour cet utilisateur (dans les 30 dernières minutes)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    
    if (userId) {
      const existingEntry = await db
        .select()
        .from(searchHistory)
        .where(
          and(
            sql`${searchHistory.userId} = ${userId}`,
            sql`LOWER(${searchHistory.query}) = ${cleanTerm}`,
            sql`${searchHistory.createdAt} > ${thirtyMinutesAgo}`
          )
        )
        .limit(1);

      // Si une entrée similaire existe récemment, mettre à jour la date
      if (existingEntry.length > 0) {
        await db
          .update(searchHistory)
          .set({ createdAt: new Date() })
          .where(sql`${searchHistory.id} = ${existingEntry[0].id}`);
        return;
      }

      // Sinon, créer une nouvelle entrée
      await db.insert(searchHistory).values({
        id: crypto.randomUUID(),
        userId,
        query: cleanTerm,
        createdAt: new Date()
      });

    } else {
      // Pour les utilisateurs non authentifiés, on enregistre de manière anonyme
      // On peut utiliser une IP hashée ou un identifiant de session
      // Pour l'instant, on skip pour éviter de remplir la DB
      return;
    }

    // Nettoyage périodique (une fois sur 100 recherches)
    if (Math.random() < 0.01) {
      cleanupOldSearchHistory().catch(console.error);
    }

  } catch (error) {
    console.error('Error recording search trend:', error);
    // Ne pas propager l'erreur pour ne pas perturber l'expérience utilisateur
  }
}

// Nettoyage de l'ancien historique (garder seulement 30 jours)
async function cleanupOldSearchHistory(): Promise<void> {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    await db
      .delete(searchHistory)
      .where(sql`${searchHistory.createdAt} < ${thirtyDaysAgo}`);
    
  } catch (error) {
    console.error('Error cleaning up old search history:', error);
  }
}

// Récupérer les tendances de recherche populaires
export async function getSearchTrends(
  limit: number = 10,
  days: number = 7
): Promise<Array<{ query: string; count: number }>> {
  'use cache';
  cacheTag('search');
  cacheLife('minutes');
  try {
    const dateFrom = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const trends = await db
      .select({
        query: searchHistory.query,
        count: sql<number>`COUNT(*)`.as('count')
      })
      .from(searchHistory)
      .where(sql`${searchHistory.createdAt} > ${dateFrom}`)
      .groupBy(searchHistory.query)
      .orderBy(sql`COUNT(*) DESC`)
      .limit(limit);

    return trends;
  } catch (error) {
    console.error('Error getting search trends:', error);
    return [];
  }
}

// Recherche avec suggestion en temps réel
export async function searchWithSuggestions(
  term: string,
  userId?: string
): Promise<{
  results: SearchResult[];
  suggestions: string[];
}> {
  try {
    const cleanTerm = term.trim();
    
    if (!cleanTerm || cleanTerm.length < 2) {
      return { results: [], suggestions: [] };
    }

    // Recherche principale
    const results = await unifiedSearch(
      ['shop', 'product', 'tournament', 'theme', 'service', 'guide', 'blog', 'news'],
      cleanTerm,
      { limit: 10, userId }
    );

    // Suggestions basées sur l'historique de l'utilisateur
    let suggestions: string[] = [];
    
    if (userId) {
      const userHistory = await db
        .select({
          query: searchHistory.query
        })
        .from(searchHistory)
        .where(
          and(
            sql`${searchHistory.userId} = ${userId}`,
            sql`${searchHistory.query} ILIKE ${`%${cleanTerm}%`}`
          )
        )
        .orderBy(sql`${searchHistory.createdAt} DESC`)
        .limit(5);

      suggestions = userHistory.map(h => h.query);
    }

    // Ajouter des suggestions générales si l'utilisateur n'a pas d'historique
    if (suggestions.length === 0) {
      const popularTrends = await getSearchTrends(5, 30);
      suggestions = popularTrends
        .filter(t => t.query.includes(cleanTerm.toLowerCase()))
        .map(t => t.query)
        .slice(0, 3);
    }

    return {
      results,
      suggestions: [...new Set(suggestions)] // Éliminer les doublons
    };
  } catch (error) {
    console.error('Search with suggestions error:', error);
    return { results: [], suggestions: [] };
  }
}