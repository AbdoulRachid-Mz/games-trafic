// @/types/game-clips.ts
import { GameClip, User, Shop, Game } from "@/database/schema";

export interface GameClipWithStats extends GameClip {
  author?: User;
  shop?: Shop;
  game?: Game;
  likesCount: number;
  commentsCount: number;
  viewsCount: number;
  sharesCount: number;
  savesCount: number;
  isLiked: boolean;
  isSaved: boolean;
  metadata?: {
    resolution?: string;
    frameRate?: number;
    size?: number;
    format?: string;
    aspectRatio?: number;
  };
}

export interface GameClipWithRelations extends Omit<GameClipWithStats, 'likesCount' | 'commentsCount' | 'viewsCount' | 'sharesCount' | 'savesCount' | 'isLiked' | 'isSaved'> {
  likesCount: number;
  viewsCount: number;
  commentsCount?: number;
  userInteractions?: {
    liked: boolean;
    bookmarked: boolean;
  };
}

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