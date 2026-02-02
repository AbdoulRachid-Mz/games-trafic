// @/validations/partners.ts
import { z } from "zod";

// Partner creation schema
export const createPartnerSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  legalName: z.string().max(255).optional(),
  slug: z.string().max(255).optional(),
  description: z.string().optional(),
  shortDescription: z.string().max(500).optional(),

  type: z.enum([
    "SPONSOR",
    "MEDIA",
    "TECHNOLOGY",
    "FINANCIAL",
    "ESPORTS",
    "GAMING",
    "STREAMING",
    "EQUIPMENT",
    "FOOD_BEVERAGE",
    "FASHION",
    "TELECOM",
    "SOFTWARE",
    "HARDWARE",
    "PUBLISHER",
    "DISTRIBUTOR",
    "OTHER",
  ]),
  categories: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),

  logo: z.string().url().optional(),
  coverImage: z.string().url().optional(),
  brandColors: z.array(z.string()).default([]),
  website: z.string().url().optional(),

  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  contactPerson: z.string().optional(),
  contactTitle: z.string().optional(),

  country: z.string().optional(),
  city: z.string().optional(),
  address: z.record(z.string(),z.any()).optional(),

  socialMedia: z.record(z.string(),z.any()).default({}),

  status: z
    .enum(["PENDING", "ACTIVE", "PAUSED", "COMPLETED", "CANCELLED", "EXPIRED"])
    .default("PENDING"),
  isActive: z.boolean().default(true),
  isVisible: z.boolean().default(true),
  verified: z.boolean().default(false),

  metadata: z.record(z.string(),z.any()).default({}),
  internalNotes: z.string().optional(),
});

// Partner update schema (all fields optional)
export const updatePartnerSchema = createPartnerSchema.partial();

// Partner filters schema
export const partnerFiltersSchema = z.object({
  type: z
    .enum([
      "SPONSOR",
      "MEDIA",
      "TECHNOLOGY",
      "FINANCIAL",
      "ESPORTS",
      "GAMING",
      "STREAMING",
      "EQUIPMENT",
      "FOOD_BEVERAGE",
      "FASHION",
      "TELECOM",
      "SOFTWARE",
      "HARDWARE",
      "PUBLISHER",
      "DISTRIBUTOR",
      "OTHER",
    ])
    .optional(),
  status: z
    .enum(["PENDING", "ACTIVE", "PAUSED", "COMPLETED", "CANCELLED", "EXPIRED"])
    .optional(),
  verified: z.boolean().optional(),
  isActive: z.boolean().optional(),
  isVisible: z.boolean().optional(),
  search: z.string().optional(),
  limit: z.number().int().positive().default(20),
  offset: z.number().int().nonnegative().default(0),
  sortBy: z
    .enum(["name", "createdAt", "viewCount", "totalInvestment"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// Type exports
export type CreatePartnerInput = z.infer<typeof createPartnerSchema>;
export type UpdatePartnerInput = z.infer<typeof updatePartnerSchema>;
export type PartnerFilters = z.infer<typeof partnerFiltersSchema>;
