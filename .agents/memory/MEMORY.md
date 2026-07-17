# Project Memory — DARKSHARE

- [AlorVPN API limits](alorvpn-api.md) — external API only exposes create/status/toggle; no country/server/usage listing, so popularity rankings aren't possible.
- [AlorVPN upstream rotation](alor-upstream-rotation.md) — upstream expiry is fixed; "extend" = create new upstream token, keep the public alorVpnToken stable; upstream calls via upstreamAlorToken().
- [VPN tier device limits](vpn-device-limits.md) — vpnDeviceLimit("FREE")=0 means "no cap" in the proxy guard; FREE active-VPN users need an explicit cap.
- [Referral credit idempotency](referral-credit-idempotency.md) — gate all referral rewards on createReferral's boolean insert (unique referred_id), not on "no error"; 3 paths race.
- [SEO JSON-LD conventions](seo-jsonld-conventions.md) — sitewide schemas in index.html; route schemas (esp. FAQPage) only via seoConfig+Seo; one FAQPage per URL.
- [VPN device limit by name](vpn-device-limit-by-name.md) — limit counts DISTINCT active deviceName (not fp rows); collapse-by-name must stay in sync across proxy + /api/alor-vpn/devices + bot list.
- [OG image font shipping](og-image-fonts.md) — /og/*.png 503s in prod unless fonts load from cwd AND build.ts copies server/fonts→dist/fonts (Docker only ships dist/).
- [Field-level encryption](field-encryption.md) — AES-256-GCM in server/lib/encryption.ts; requires ENCRYPTION_KEY secret (64-char hex); backwards-compatible plaintext passthrough.
