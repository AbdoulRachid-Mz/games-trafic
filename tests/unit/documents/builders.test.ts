// tests/unit/documents/builders.test.ts
import { describe, it, expect } from "vitest";
import {
  buildBracketDocument,
  buildEditionParticipantsDocument,
  buildEditionReportDocument,
  buildMatchSheetDocument,
  buildMatchesDocument,
  buildStandingsDocument,
} from "@/lib/documents/builders/edition";
import { buildTransactionReceiptDocument } from "@/lib/documents/builders/transaction";
import {
  buildShopClientsDocument,
  buildShopOrdersDocument,
  buildShopProductsDocument,
  buildShopWalletDocument,
} from "@/lib/documents/builders/shop";

const edition = {
  id: "e1",
  name: "Édition 1",
  editionNumber: 1,
  tournamentId: "t1",
  tournamentName: "Tournoi",
  game: "FIFA",
  format: "BRACKET",
  status: "ACTIVE",
  startDate: "2026-01-01",
  endDate: null,
  organizerName: "Org",
  location: "Tahoua, NG",
};

describe("edition document builders", () => {
  it("buildStandingsDocument produces a serializable model", () => {
    const model = buildStandingsDocument({
      edition,
      scope: "edition",
      standings: [
        {
          registrationId: "r1",
          position: 1,
          displayName: "Alice",
          teamName: null,
          groupName: null,
          matchesPlayed: 2,
          matchesWon: 2,
          matchesDrawn: 0,
          matchesLost: 0,
          scoreFor: 5,
          scoreAgainst: 1,
          scoreDifference: 4,
          points: 6,
          qualified: true,
        },
      ],
      context: { generatedBy: "tester" },
    });
    expect(model.meta.type).toBe("edition-standings");
    expect(model.primaryTable?.rows).toHaveLength(1);
    expect(JSON.stringify(model)).not.toContain("undefined");
  });

  it("buildBracketDocument keeps participant names", () => {
    const model = buildBracketDocument({
      edition,
      phaseName: "Playoffs",
      nodes: [
        {
          round: 1,
          nodeCode: "R1M1",
          matchNumber: 1,
          participant1Name: "Alice",
          participant2Name: "Bob",
          score1: 2,
          score2: 1,
          winnerName: "Alice",
          status: "COMPLETED",
          isCompleted: true,
          scheduledTime: null,
        },
      ],
      context: { generatedBy: "tester" },
    });
    expect(model.primaryTable?.rows[0].participant1Name).toBe("Alice");
  });

  it("buildEditionParticipantsDocument exposes no secret fields", () => {
    const model = buildEditionParticipantsDocument({
      edition,
      participants: [
        {
          registrationId: "r1",
          displayName: "Alice",
          username: "alice",
          email: "alice@example.com",
          teamName: null,
          status: "REGISTERED",
          registrationType: "SOLO",
          checkedIn: true,
          feePaid: true,
          registeredAt: "2026-01-01",
          matchesPlayed: 0,
          matchesWon: 0,
          matchesDrawn: 0,
          matchesLost: 0,
          points: 0,
          position: null,
        },
      ],
      context: { generatedBy: "tester" },
    });
    const serialized = JSON.stringify(model);
    expect(serialized).not.toContain("password");
    expect(serialized).not.toContain("token");
  });

  it("buildMatchesDocument and buildMatchSheetDocument run", () => {
    const matches = buildMatchesDocument({
      edition,
      matches: [],
      context: { generatedBy: "tester" },
    });
    expect(matches.meta.type).toBe("matches-list");

    const sheet = buildMatchSheetDocument({
      edition,
      match: {
        id: "m1",
        code: "M1",
        phaseName: "P1",
        groupName: null,
        round: 1,
        matchNumber: 1,
        participant1Name: "A",
        participant2Name: "B",
        score1: null,
        score2: null,
        winnerName: null,
        status: "PENDING",
        matchType: null,
        scheduledTime: null,
        actualStartTime: null,
        actualEndTime: null,
        duration: null,
      },
      context: { generatedBy: "tester" },
    });
    expect(sheet.meta.type).toBe("match-sheet");
  });

  it("buildEditionReportDocument aggregates sections", () => {
    const model = buildEditionReportDocument({
      edition,
      participants: [],
      matches: [],
      standings: [],
      prizePool: { amount: 100, currency: "GTC" },
      context: { generatedBy: "tester" },
    });
    expect(model.sections.length).toBeGreaterThan(0);
  });
});

describe("transaction receipt builder", () => {
  it("masks nothing sensitive and uses server amounts", () => {
    const model = buildTransactionReceiptDocument({
      transactionId: "tx-1",
      reference: "REF-1",
      type: "TOURNAMENT_PARTICIPATION",
      status: "COMPLETED",
      amount: 100,
      fees: 5,
      netAmount: 95,
      currency: "GTC",
      balanceAfter: 900,
      createdAt: "2026-01-01T00:00:00.000Z",
      completedAt: "2026-01-01T00:00:00.000Z",
      description: "Inscription",
      userName: "Alice",
      senderName: null,
      recipientName: null,
      metadata: null,
      entity: null,
    });
    const serialized = JSON.stringify(model);
    expect(serialized).not.toContain("password");
    expect(serialized).toContain("100");
  });
});

describe("shop document builders", () => {
  const shop = {
    id: "s1",
    name: "Boutique",
    ownerName: "Owner",
    country: "CI",
    website: null,
    verified: true,
    createdAt: "2026-01-01",
  };

  it("builds products/orders/clients/wallet models", () => {
    const products = buildShopProductsDocument({
      shop,
      products: [],
      context: { generatedBy: "tester" },
    });
    const orders = buildShopOrdersDocument({ shop, orders: [], context: { generatedBy: "tester" } });
    const clients = buildShopClientsDocument({ shop, clients: [], context: { generatedBy: "tester" } });
    const wallet = buildShopWalletDocument({
      shop,
      entries: [],
      balance: 0,
      currency: "GTC",
      context: { generatedBy: "tester" },
    });
    for (const model of [products, orders, clients, wallet]) {
      expect(model.brand.name).toBe("Games-Trafics");
      expect(JSON.stringify(model)).not.toContain("undefined");
    }
  });
});
