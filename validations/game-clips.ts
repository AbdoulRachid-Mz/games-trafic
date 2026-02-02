
import { z } from "zod";
// Validation schemas
export const createGameClipSchema = z.object({
  caption: z.string().max(500).optional(),
  videoUrl: z.string().url(),
  imageUrls: z.string().url().optional(),
  shopId: z.string().uuid().optional(),
  gameId: z.string().uuid().optional(),
  isPublic: z.boolean().default(true),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const updateGameClipSchema = createGameClipSchema.partial();

export const gameClipFiltersSchema = z.object({
  authorId: z.string().uuid().optional(),
  shopId: z.string().uuid().optional(),
  gameId: z.string().uuid().optional(),
  isPublic: z.boolean().optional(),
  search: z.string().optional(),
  sortBy: z.enum(["createdAt", "likes", "views"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});
