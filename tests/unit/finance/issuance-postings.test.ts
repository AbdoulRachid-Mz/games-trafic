import { describe, expect, it } from "vitest";
import {
  assertPostingsBalanced,
  normalizeLedgerPostings,
} from "@/lib/finance/core/postings";
import { buildIssuancePostings } from "@/lib/finance/transactions/issuance";

describe("T6-08 — émission GTC : aucun wallet admin débité", () => {
  it("débite SYSTEM_GTC_ISSUANCE et crédite le bénéficiaire, sans wallet admin", () => {
    const postings = buildIssuancePostings({
      issuanceAccountId: "issuance",
      recipientAccountId: "recipient",
      amount: 250,
    });

    expect(postings).toEqual([
      { accountId: "issuance", debit: 250 },
      { accountId: "recipient", credit: 250 },
    ]);
    expect(
      assertPostingsBalanced(normalizeLedgerPostings(postings))
    ).toEqual({ debit: 25_000, credit: 25_000 });

    const accountIds = postings.map((posting) => posting.accountId);
    expect(accountIds).not.toContain("admin-wallet");
    expect(accountIds).toContain("issuance");
    expect(accountIds).toContain("recipient");
  });

  it("équilibre une émission à virgule", () => {
    const postings = buildIssuancePostings({
      issuanceAccountId: "issuance",
      recipientAccountId: "recipient",
      amount: 12.34,
    });

    expect(
      assertPostingsBalanced(normalizeLedgerPostings(postings))
    ).toEqual({ debit: 1_234, credit: 1_234 });
  });
});