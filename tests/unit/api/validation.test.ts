import { describe, expect, it } from "vitest";
import {
  formatValidationError,
  gameCreateSchema,
  gameUpdateSchema,
  gamesListQuerySchema,
  serviceCreateSchema,
  servicesListQuerySchema,
  usersListQuerySchema,
} from "@/lib/api/validation";
import { toPublicUser } from "@/lib/api/projections";

describe("S3-03 — validation Zod des routes API", () => {
  it("refuse un jeu sans nom ou avec un nom vide", () => {
    expect(gameCreateSchema.safeParse({}).success).toBe(false);
    expect(gameCreateSchema.safeParse({ name: "   " }).success).toBe(false);
  });

  it("accepte un jeu valide et conserve les colonnes métier", () => {
    const parsed = gameCreateSchema.safeParse({
      name: "  Valorant  ",
      slug: "valorant",
      publisher: "Riot",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.name).toBe("Valorant");
      expect((parsed.data as Record<string, unknown>).publisher).toBe("Riot");
    }
  });

  it("autorise une mise à jour partielle", () => {
    expect(gameUpdateSchema.safeParse({}).success).toBe(true);
    expect(gameUpdateSchema.safeParse({ name: "Apex" }).success).toBe(true);
    expect(gameUpdateSchema.safeParse({ name: "" }).success).toBe(false);
  });

  it("normalise les paramètres de liste et borne la pagination", () => {
    const defaults = gamesListQuerySchema.parse({});
    expect(defaults).toMatchObject({ page: 1, limit: 50, sortOrder: "desc" });

    const coerced = gamesListQuerySchema.parse({
      page: "2",
      limit: "100",
      sortOrder: "asc",
      includeDeleted: "true",
    });
    expect(coerced).toMatchObject({
      page: 2,
      limit: 100,
      sortOrder: "asc",
      includeDeleted: true,
    });

    expect(gamesListQuerySchema.safeParse({ limit: "101" }).success).toBe(
      false
    );
    expect(gamesListQuerySchema.safeParse({ sortOrder: "up" }).success).toBe(
      false
    );
  });

  it("exige titre et description pour un service", () => {
    expect(serviceCreateSchema.safeParse({ title: "Support" }).success).toBe(
      false
    );
    expect(
      serviceCreateSchema.safeParse({
        title: "Support",
        description: "Assistance 24/7",
      }).success
    ).toBe(true);
  });

  it("ignore les paramètres inconnus mais valide les booléens", () => {
    const parsed = servicesListQuerySchema.parse({
      includeDeleted: "1",
      includeInactive: "false",
    });
    expect(parsed.includeDeleted).toBe(true);
    expect(parsed.includeInactive).toBe(false);
    expect(
      servicesListQuerySchema.safeParse({ includeDeleted: "yes" }).success
    ).toBe(false);
  });

  it("valide la liste des niveaux admin et la recherche utilisateur", () => {
    expect(usersListQuerySchema.parse({}).limit).toBe(20);
    expect(
      usersListQuerySchema.safeParse({ level: "A,B,C" }).success
    ).toBe(true);
    expect(usersListQuerySchema.safeParse({ level: "D" }).success).toBe(false);
    expect(usersListQuerySchema.safeParse({ search: "a" }).success).toBe(false);
  });

  it("retourne une erreur de validation structurée", () => {
    const parsed = gameCreateSchema.safeParse({ name: "" });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const error = formatValidationError(parsed.error);
      expect(error.code).toBe("VALIDATION_ERROR");
      expect(error.fields.name?.length).toBeGreaterThan(0);
    }
  });
});

describe("S2-03 — projection d'énumération utilisateur", () => {
  it("ne renvoie jamais les champs sensibles", () => {
    const projected = toPublicUser({
      id: "u1",
      username: "alice",
      email: "alice@example.com",
      phone: "+237000000",
      passwordHash: "secret",
      twoFactorSecret: "totp",
      role: "user",
      level: "C",
      isAdmin: false,
    });

    expect(projected).toMatchObject({
      id: "u1",
      username: "alice",
      role: "user",
      level: "C",
    });
    const asRecord = projected as Record<string, unknown>;
    expect(asRecord.email).toBeUndefined();
    expect(asRecord.phone).toBeUndefined();
    expect(asRecord.passwordHash).toBeUndefined();
    expect(asRecord.twoFactorSecret).toBeUndefined();
  });

  it("remplit les champs absents par null", () => {
    const projected = toPublicUser({ id: "u2" });
    expect(projected.username).toBeNull();
    expect(projected.createdAt).toBeNull();
  });
});
