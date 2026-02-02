import crypto from "crypto";

const ALGO = "aes-256-gcm";

function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) throw new Error("ENCRYPTION_KEY missing");
  const buf = Buffer.from(key, key.length === 64 ? "hex" : "utf8");
  if (buf.length !== 32) throw new Error("ENCRYPTION_KEY must be 32 bytes");
  return buf;
}

export function encryptSecret(plain: string): { ciphertext: string; iv: string; tag: string } {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { ciphertext: enc.toString("base64"), iv: iv.toString("base64"), tag: tag.toString("base64") };
}

export function decryptSecret(ciphertext: string, iv: string, tag: string): string {
  const decipher = crypto.createDecipheriv(ALGO, getKey(), Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  const dec = Buffer.concat([decipher.update(Buffer.from(ciphertext, "base64")), decipher.final()]);
  return dec.toString("utf8");
}
