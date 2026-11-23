import { describe, it, expect, vi, beforeEach } from "vitest";
import { normalizePhone, verifyWebhook } from "@/lib/notifications/channels/whatsapp";
import { renderTemplate } from "@/lib/notifications/templates";
import { generateVapidKeys } from "@/lib/notifications/channels/push";
import { areExternalNotificationsEnabled } from "@/lib/notifications/dispatcher";

describe("Notifications System", () => {
  describe("WhatsApp Channel Helpers", () => {
    it("normalizePhone removes spaces, dashes, and leading +", () => {
      expect(normalizePhone("+228 90 12 34 56")).toBe("22890123456");
      expect(normalizePhone("+33 6-12-34-56-78")).toBe("33612345678");
      expect(normalizePhone("0022890123456")).toBe("0022890123456");
      expect(normalizePhone("+1 (555) 234-5678")).toBe("15552345678");
    });

    it("verifyWebhook returns challenge when token matches", () => {
      process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN = "secret_gt_token_123";

      const valid = verifyWebhook({
        mode: "subscribe",
        token: "secret_gt_token_123",
        challenge: "challenge_string_xyz",
      });
      expect(valid).toBe("challenge_string_xyz");

      const invalidToken = verifyWebhook({
        mode: "subscribe",
        token: "wrong_token",
        challenge: "challenge_string_xyz",
      });
      expect(invalidToken).toBeNull();

      const invalidMode = verifyWebhook({
        mode: "unsubscribe",
        token: "secret_gt_token_123",
        challenge: "challenge_string_xyz",
      });
      expect(invalidMode).toBeNull();
    });
  });

  describe("Template Engine", () => {
    it("renders tournament registration confirmed template", () => {
      const template = renderTemplate("tournament_registration_confirmed", {
        tournamentName: "Champions League",
        editionName: "Saison 1",
        tournamentId: "t-123",
        editionId: "e-456",
        userName: "Alex",
      });

      expect(template.title).toContain("Inscription confirmée");
      expect(template.body).toContain("Champions League — Saison 1");
      expect(template.linkUrl).toContain("/tournaments/t-123/editions/e-456");
      expect(template.emailHtml).toContain("Alex");
      expect(template.emailHtml).toContain("Games Trafics");
    });

    it("renders payment deposit confirmed template", () => {
      const template = renderTemplate("payment_deposit_confirmed", {
        amount: "5000",
        currency: "FCFA",
        transactionId: "tx-789",
        userName: "Sara",
      });

      expect(template.title).toContain("Dépôt confirmé");
      expect(template.body).toContain("5000 FCFA");
      expect(template.linkUrl).toContain("/wallet");
      expect(template.emailHtml).toContain("tx-789");
    });

    it("renders payment transfer received template", () => {
      const template = renderTemplate("payment_transfer_received", {
        amount: "2500",
        senderName: "Malik",
        userName: "Koffi",
      });

      expect(template.title).toContain("Transfert reçu");
      expect(template.body).toContain("Malik");
      expect(template.body).toContain("2500");
    });

    it("renders tournament match result template", () => {
      const template = renderTemplate("tournament_match_result", {
        tournamentName: "Summer Cup",
        editionName: "Edition 2",
        result: "win",
        score: "3 - 1",
        tournamentId: "t-1",
        editionId: "e-1",
      });

      expect(template.title).toContain("Victoire");
      expect(template.body).toContain("3 - 1");
    });
  });

  describe("Web Push Channel", () => {
    it("generates valid VAPID keys with publicKey and privateKey", () => {
      const keys = generateVapidKeys();
      expect(keys).toBeDefined();
      expect(typeof keys.publicKey).toBe("string");
      expect(typeof keys.privateKey).toBe("string");
      expect(keys.publicKey.length).toBeGreaterThan(20);
      expect(keys.privateKey.length).toBeGreaterThan(20);
    });
  });

  describe("Global Notification Toggle", () => {
    const originalEnv = process.env.ENABLE_EXTERNAL_NOTIFICATIONS;

    beforeEach(() => {
      process.env.ENABLE_EXTERNAL_NOTIFICATIONS = originalEnv;
    });

    it("returns false when ENABLE_EXTERNAL_NOTIFICATIONS is not 'true'", () => {
      process.env.ENABLE_EXTERNAL_NOTIFICATIONS = "false";
      expect(areExternalNotificationsEnabled()).toBe(false);

      delete process.env.ENABLE_EXTERNAL_NOTIFICATIONS;
      expect(areExternalNotificationsEnabled()).toBe(false);
    });

    it("returns true when ENABLE_EXTERNAL_NOTIFICATIONS is 'true'", () => {
      process.env.ENABLE_EXTERNAL_NOTIFICATIONS = "true";
      expect(areExternalNotificationsEnabled()).toBe(true);
    });
  });
});
