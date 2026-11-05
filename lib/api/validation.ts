/**
 * lib/api/validation.ts
 *
 * Schémas Zod des routes API publiques/administratives. Les schémas sont
 * volontairement stricts sur les champs sensibles et tolérants sur les
 * colonnes métier additionnelles (`.catchall`).
 */

import { z } from "zod";

const booleanFlag = z
  .enum(["true", "false", "1", "0"])
  .transform((value) => value === "true" || value === "1");

const pagination = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
};

export const gamesListQuerySchema = z.object({
  ...pagination,
  sortBy: z.string().trim().min(1).max(64).optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  includeDeleted: booleanFlag.optional(),
  stats: booleanFlag.optional(),
});

const gameFields = {
  name: z.string().trim().min(1, "Le nom est obligatoire").max(200),
  slug: z.string().trim().min(1).max(200).optional(),
  description: z.string().max(20_000).optional(),
  icon: z.string().max(2048).optional(),
  coverImage: z.string().max(2048).optional(),
  images: z.array(z.string().max(2048)).max(50).optional(),
  isActive: z.boolean().optional(),
};

export const gameCreateSchema = z
  .object(gameFields)
  .catchall(z.unknown());

export const gameUpdateSchema = z
  .object(gameFields)
  .partial()
  .catchall(z.unknown());

export const servicesListQuerySchema = z.object({
  ...pagination,
  sortBy: z.string().trim().min(1).max(64).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  stats: booleanFlag.optional(),
  includeDeleted: booleanFlag.optional(),
  includeInactive: booleanFlag.optional(),
});

const serviceFields = {
  title: z.string().trim().min(1, "Le titre est obligatoire").max(200),
  description: z
    .string()
    .trim()
    .min(1, "La description est obligatoire")
    .max(20_000),
  icon: z.string().max(2048).optional(),
  images: z.array(z.string().max(2048)).max(50).optional(),
  isActive: z.boolean().optional(),
};

export const serviceCreateSchema = z
  .object(serviceFields)
  .catchall(z.unknown());

export const serviceUpdateSchema = z
  .object(serviceFields)
  .partial()
  .catchall(z.unknown());

export const usersListQuerySchema = z.object({
  ...pagination,
  limit: z.coerce.number().int().min(1).max(50).default(20),
  search: z.string().trim().min(2).max(100).optional(),
  id: z.string().min(1).max(64).optional(),
  username: z.string().trim().min(1).max(50).optional(),
  role: z.string().trim().min(1).max(32).optional(),
  level: z
    .string()
    .regex(/^[ABC](,[ABC])*$/, "Niveaux invalides")
    .optional(),
});

export type GamesListQuery = z.infer<typeof gamesListQuerySchema>;
export type ServicesListQuery = z.infer<typeof servicesListQuerySchema>;
export type UsersListQuery = z.infer<typeof usersListQuerySchema>;

export function formatValidationError(error: z.ZodError): {
  code: "VALIDATION_ERROR";
  message: string;
  fields: Record<string, string[]>;
} {
  const flattened = error.flatten();
  return {
    code: "VALIDATION_ERROR",
    message: "Paramètres invalides",
    fields: flattened.fieldErrors as Record<string, string[]>,
  };
}
