---
name: Field-level encryption
description: AES-256-GCM encryption for sensitive DB columns; requires ENCRYPTION_KEY secret
---

# Field-level encryption

## The rule
`server/lib/encryption.ts` — `encrypt()`/`decrypt()` wrap sensitive fields before DB writes.

**Why:** totp_secret and VPN-related tokens were stored in plaintext. AES-256-GCM with a random 96-bit IV per value.

## Encoded format
`enc:v1:<ivHex>:<authTagHex>:<ciphertextHex>`

Backwards-compatible: values NOT starting with `enc:v1:` are returned as-is (plaintext passthrough).

## Currently encrypted
- `totp_secret` — encrypted on `/api/2fa/setup`, decrypted in `/api/2fa/verify`, `/api/2fa/disable`, `/api/2fa/login-verify`

## How to apply
- Import: `import { encrypt as encryptField, decrypt as decryptField } from "./lib/encryption";`
- Wrap any new sensitive field: `encryptField(value)` on write, `decryptField(stored)` on read
- Set `ENCRYPTION_KEY` = 64-char hex in Replit Secrets (`openssl rand -hex 32`)
- If key is absent, falls back to plaintext with a console.warn (app doesn't crash)
