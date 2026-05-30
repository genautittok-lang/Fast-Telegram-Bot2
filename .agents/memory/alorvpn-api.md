---
name: AlorVPN external API limits
description: What the AlorVPN external API can and cannot do — affects any country/server/usage feature.
---

The AlorVPN external API (`https://sub.alorvpn.fun/api/v1/external/...`, in `server/alorVpn.ts`) only exposes three endpoints: `subscription/create`, `subscription/status`, `subscription/toggle`. There is NO endpoint to list servers, countries, locations, or usage/popularity stats, and no "extend subscription" endpoint.

**Why:** Asked to build a "24/7 parsing Top-10 countries" feature. Investigated the API and found no data source for it. Country info exists only embedded in per-subscription `vless_links` remarks (parsed in `server/vpnProxy.ts` via `detectCountryKey`/`FLAG_BY_COUNTRY`, ~20+ countries) — there is no popularity/usage signal.

**How to apply:** Any feature needing country ranking or live server data is NOT feasible from AlorVPN directly. Options: enumerate available countries from `vless_links`, or maintain a curated/static Top-10 list. To "extend" a VPN, you must re-create a subscription for (remaining + new) days, not call an extend API (see `grantReferralVpnDays` in `server/bot.ts`).
