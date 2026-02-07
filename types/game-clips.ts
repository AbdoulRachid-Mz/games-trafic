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