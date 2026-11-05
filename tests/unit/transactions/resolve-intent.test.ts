import { describe, expect, it } from "vitest";
import { resolveTransactionIntent } from "@/lib/transactions/resolve-intent";

describe("T8-01/T8-02 — résolution d'intention de transaction", () => {
  it("renvoie MISSING_TYPE sans type", () => {
    const intent = resolveTransactionIntent(new URLSearchParams(""));
    expect(intent.type).toBeNull();
    expect(intent.issues).toContain("MISSING_TYPE");
  });

  it("renvoie INVALID_TYPE pour un type inconnu", () => {
    const intent = resolveTransactionIntent(
      new URLSearchParams("type=UNKNOWN_THING")
    );
    expect(intent.type).toBeNull();
    expect(intent.issues).toContain("INVALID_TYPE");
  });

  it("priorise editionId pour TOURNAMENT_PARTICIPATION", () => {
    const params = new URLSearchParams(
      "type=TOURNAMENT_PARTICIPATION&entityId=ent-1&editionId=ed-9&amount=50"
    );
    const intent = resolveTransactionIntent(params);
    expect(intent.type).toBe("TOURNAMENT_PARTICIPATION");
    expect(intent.entityId).toBe("ed-9");
    expect(intent.entityIdSource).toBe("editionId");
    expect(intent.amount).toBe(50);
  });

  it("utilise la priorité entityId > targetId > itemId > id", () => {
    const params = new URLSearchParams(
      "type=ORDER_PURCHASE&targetId=t-1&itemId=i-1&id=i-0"
    );
    const intent = resolveTransactionIntent(params);
    expect(intent.entityId).toBe("t-1");
    expect(intent.entityIdSource).toBe("targetId");
  });

  it("signale des entités contradictoires", () => {
    const params = new URLSearchParams(
      "type=ORDER_PURCHASE&entityId=a&targetId=b"
    );
    const intent = resolveTransactionIntent(params);
    expect(intent.issues).toContain("CONTRADICTORY_ENTITIES");
  });

  it("signale MISSING_ENTITY pour un achat nécessitant une entité", () => {
    const intent = resolveTransactionIntent(
      new URLSearchParams("type=ORDER_PURCHASE")
    );
    expect(intent.issues).toContain("MISSING_ENTITY");
  });

  it("valide le montant et rejette les valeurs invalides", () => {
    const ok = resolveTransactionIntent(
      new URLSearchParams("type=TRANSFER&amount=12.5")
    );
    expect(ok.amount).toBe(12.5);
    expect(ok.issues).not.toContain("INVALID_AMOUNT");

    const bad = resolveTransactionIntent(
      new URLSearchParams("type=TRANSFER&amount=abc")
    );
    expect(bad.amount).toBeNull();
    expect(bad.issues).toContain("INVALID_AMOUNT");
  });

  it("extrait les détails de paiement pour dépôt/retrait", () => {
    const intent = resolveTransactionIntent(
      new URLSearchParams(
        "type=DEPOSIT&paymentMethod=mobile_money&paymentProvider=mtn&paymentAccountId=06123456"
      )
    );
    expect(intent.paymentMethod).toBe("mobile_money");
    expect(intent.paymentProvider).toBe("mtn");
    expect(intent.paymentAccountId).toBe("06123456");
  });

  it("conserve l'imageUrl", () => {
    const intent = resolveTransactionIntent(
      new URLSearchParams("type=VIP_SUBSCRIPTION&image=https://x/y.png")
    );
    expect(intent.imageUrl).toBe("https://x/y.png");
  });
});