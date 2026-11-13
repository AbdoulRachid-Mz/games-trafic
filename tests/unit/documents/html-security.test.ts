// tests/unit/documents/html-security.test.ts
import { describe, it, expect } from "vitest";
import { escapeHtml, renderPrintableHtml } from "@/lib/documents/html";
import { buildStandingsDocument } from "@/lib/documents/builders/edition";
import type { DocumentModel } from "@/lib/documents/types";

describe("HTML escaping", () => {
  it("escapes dangerous characters", () => {
    expect(escapeHtml(`<script>alert("x")</script>`)).toBe(
      "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;",
    );
    expect(escapeHtml("a & b")).toBe("a &amp; b");
  });

  it("renderPrintableHtml does not inject raw user input", () => {
    const model = buildStandingsDocument({
      edition: {
        id: "e1",
        name: "<img src=x onerror=alert(1)>",
        editionNumber: 1,
        tournamentId: "t1",
        tournamentName: "T",
        game: null,
        format: null,
        status: null,
        startDate: null,
        endDate: null,
        organizerName: null,
        location: null,
      },
      scope: "edition",
      standings: [],
      context: { generatedBy: "<script>" },
    });
    const html = renderPrintableHtml(model);
    expect(html).not.toContain("<img src=x");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;img src=x");
  });
});
