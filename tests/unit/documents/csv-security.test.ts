// tests/unit/documents/csv-security.test.ts
import { describe, it, expect } from "vitest";
import { escapeCsvCell, protectCsvFormula, serializeCsv } from "@/lib/documents/csv";

describe("CSV formula injection protection", () => {
  it("prefixes formula-triggering text with an apostrophe", () => {
    expect(protectCsvFormula("=1+1")).toBe("'=1+1");
    expect(protectCsvFormula("+cmd")).toBe("'+cmd");
    expect(protectCsvFormula("-1")).toBe("-1"); // numeric string stays numeric
    expect(protectCsvFormula("@SUM(A1)")).toBe("'@SUM(A1)");
  });

  it("leaves plain text and numbers untouched", () => {
    expect(protectCsvFormula("hello")).toBe("hello");
    expect(protectCsvFormula("42")).toBe("42");
    expect(protectCsvFormula("-3.5")).toBe("-3.5");
  });

  it("escapeCsvCell applies formula protection by default", () => {
    expect(escapeCsvCell("=HYPERLINK(\"x\")")).toBe("\"'=HYPERLINK(\"\"x\"\")\"");
  });

  it("serializeCsv neutralizes a formula in cell data", () => {
    const csv = serializeCsv(["Name", "Note"], [["Alice", "=2+2"]], {
      includeBom: false,
    });
    expect(csv).toContain("'=2+2");
    expect(csv).not.toContain(",=2+2");
  });

  it("quotes cells containing delimiters / newlines", () => {
    const csv = serializeCsv(["A", "B"], [["x,y", "line1\nline2"]], {
      includeBom: false,
    });
    expect(csv).toContain('"x,y"');
    expect(csv).toContain('"line1\nline2"');
  });
});
