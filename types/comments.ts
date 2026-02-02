import { Message, MessageWithRelations, User, Shop, Post, Product, EntityType } from "@/database/schema";

export interface Comment {
  id: string;
  content: string;
  authorId: string;
  entityId: string;
  entityType: EntityType;
  parentId?: string;
  likesCount: number;
  repliesCount: number;
  isLiked: boolean;
  isEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
  author?: User;
  replies?: Comment[];
}

export interface CommentWithRelations extends Comment {
  author?: User;
  replies?: CommentWithRelations[];
  mentions?: User[];
  hashtags?: string[];
  media?: any[];
}

export interface CommentFilters {
  entityId?: string;
  entityType?: EntityType;
  authorId?: string;
  parentId?: string | null;
  search?: string;
  hasMedia?: boolean;
  isEdited?: boolean;
  createdFrom?: Date;
  createdTo?: Date;
}

export interface CommentStats {
  total: number;
  totalReplies: number;
  totalLikes: number;
  totalWithMedia: number;
  averageReplies: number;
  averageLikes: number;
}