
import { z } from "zod";
import { GameClip, User, Shop, Game } from "@/database/schema";
// ============================================================================
// TYPES EXTENDUS POUR GAME-CLIPS AVEC STATS
// ============================================================================

export type GameClipWithStats = GameClip & {
  author?: User;
  shop?: Shop;
  game?: Game;
  likesCount: number;
  commentsCount: number;
  viewsCount: number;
  userInteractions?: {
    liked: boolean;
    bookmarked: boolean;
  };
};

export type GameClipWithRelations = Omit<GameClipWithStats, 'likesCount' | 'commentsCount' | 'viewsCount' | 'userInteractions'> & {
  likesCount: number;
  viewsCount: number;
  commentsCount?: number;
  userInteractions?: {
    liked: boolean;
    bookmarked: boolean;
  };
};

// Types pour les filtres
export interface ClipFilters {
  authorId?: string;
  shopId?: string;
  gameId?: string;
  search?: string;
  minDuration?: number;
  maxDuration?: number;
  createdFrom?: Date;
  createdTo?: Date;
  sortBy?: 'createdAt' | 'likes' | 'views' | 'comments';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// Schema Zod pour la validation (à garder dans un fichier séparé, mais ici pour référence)
export const createGameClipSchema = z.object({
  caption: z.string().max(500).optional(),
  videoUrl: z.string().url().optional(),
  imageUrls: z.string().url().optional(),
  shopId: z.string().uuid().optional(),
  gameId: z.string().uuid().optional(),
  isPublic: z.boolean().default(true),
});

export const updateGameClipSchema = createGameClipSchema.partial();

export const gameClipFiltersSchema = z.object({
  authorId: z.string().uuid().optional(),
  shopId: z.string().uuid().optional(),
  gameId: z.string().uuid().optional(),
  isPublic: z.boolean().optional(),
  search: z.string().optional(),
  sortBy: z.enum(["createdAt", "likes", "views", 'comments']).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});