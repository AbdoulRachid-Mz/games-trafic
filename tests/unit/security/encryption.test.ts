import { describe, it, expect, beforeAll } from "vitest";

describe("lib/encryption - Data Encryption & Decryption (TASK-SEC-11)", () => {
  beforeAll(() => {
    process.env.SEARCH_ENCRYPTION_KEY = "12345678901234567890123456789012";
  });

  it("should encrypt and decrypt a string round-trip correctly", async () => {
    const { encryptData, decryptData } = await import("@/lib/encryption");
    const secretText = "SuperSecretPassword123!";

    const encrypted = encryptData(secretText);
    expect(encrypted).toBeTruthy();
    expect(encrypted).not.toBe(secretText);
    expect(encrypted).toContain(":"); // format iv:authTag:encrypted

    const decrypted = decryptData(encrypted);
    expect(decrypted).toBe(secretText);
  });

  it("should produce different ciphertexts for the same plaintext due to random IV", async () => {
    const { encryptData } = await import("@/lib/encryption");
    const text = "ConsistentMessage";

    const enc1 = encryptData(text);
    const enc2 = encryptData(text);

    expect(enc1).not.toBe(enc2);
  });

  it("should return empty string if decryption fails or input is corrupted", async () => {
    const { decryptData } = await import("@/lib/encryption");
    const corrupted = "0000:1111:invalidhexcontent";

    const result = decryptData(corrupted);
    expect(result).toBe("");
  });
});