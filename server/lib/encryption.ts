/**
 * AES-256-GCM field-level encryption for sensitive DB columns.
 * Encoded format: `enc:v1:<iv_hex>:<authTag_hex>:<ciphertext_hex>`
 * Backwards-compatible: values NOT starting with `enc:v1:` are returned as-is.
 * If ENCRYPTION_KEY is not set, values are stored/returned in plaintext with a warning.
 */

import crypto from "crypto";

const KEY_HEX = process.env.ENCRYPTION_KEY || "";
const ALGO = "aes-256-gcm";

let KEY_BUF: Buffer | null = null;

function getKey(): Buffer | null {
  if (KEY_BUF) return KEY_BUF;
  if (!KEY_HEX) {
    console.warn("[encryption] ENCRYPTION_KEY not set — sensitive fields stored in plaintext. Set a 64-char hex key in Replit Secrets.");
    return null;
  }
  if (KEY_HEX.length !== 64) {
    console.error("[encryption] ENCRYPTION_KEY must be 64 hex characters (32 bytes). Got length:", KEY_HEX.length);
    return null;
  }
  KEY_BUF = Buffer.from(KEY_HEX, "hex");
  return KEY_BUF;
}

/** Encrypt a plaintext string. Returns encrypted token or original string if key missing. */
export function encrypt(plaintext: string | null | undefined): string | null {
  if (plaintext == null) return null;
  const key = getKey();
  if (!key) return plaintext; // No key — store plaintext (fallback)

  const iv = crypto.randomBytes(12); // 96-bit IV for GCM
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `enc:v1:${iv.toString("hex")}:${tag.toString("hex")}:${ct.toString("hex")}`;
}

/** Decrypt an encrypted token. Returns plaintext. Passes through non-encrypted values (backwards compat). */
export function decrypt(value: string | null | undefined): string | null {
  if (value == null) return null;
  if (!value.startsWith("enc:v1:")) return value; // Plaintext / not encrypted yet

  const key = getKey();
  if (!key) {
    console.error("[encryption] ENCRYPTION_KEY missing — cannot decrypt stored value.");
    return value; // Return raw rather than crash
  }

  try {
    const parts = value.split(":");
    // parts: ["enc", "v1", ivHex, tagHex, ctHex]
    if (parts.length < 5) throw new Error("Invalid encrypted format");
    const iv = Buffer.from(parts[2], "hex");
    const tag = Buffer.from(parts[3], "hex");
    const ct = Buffer.from(parts[4], "hex");
    const decipher = crypto.createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(tag);
    return decipher.update(ct) + decipher.final("utf8");
  } catch (err) {
    console.error("[encryption] Failed to decrypt value:", (err as Error).message);
    return value; // Return raw rather than crash the app
  }
}
