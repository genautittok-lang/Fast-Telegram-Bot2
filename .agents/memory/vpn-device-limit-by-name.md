---
name: VPN device limit counted by name, not fingerprint row
description: Why VPN device-limit enforcement collapses rows by deviceName, and the 3 places that must stay in sync.
---

# VPN device limit is enforced by DISTINCT active device NAME

The VPN device limit (PRO=2, ENT/GROUPS=5) counts **distinct active `deviceName`s**, not
`ds_vpn_devices` rows.

**Why:** the fingerprint is UA-only (IP was dropped from the hash because mobile IP churn kept
minting new fingerprints for the same phone). A single physical device therefore leaves several
rows behind over time (UA tweaks, reinstalls, legacy IP-churn rows). Counting raw rows produced
false lockouts — paying users importing the subscription link into Happ got a 403 ("error") even
though they had only one real device. Collapsing by name frees those users immediately without a
destructive migration.

**How to apply:** the collapse-by-name logic must stay consistent in THREE places or counts
diverge (false lockouts or confusing "5 / 2 slots" in the UI):
1. Proxy enforcement (`server/vpnProxy.ts`) — limit check counts distinct active names; blocks an
   unknown name at capacity even if a revoked fingerprint row exists for it. Runs BEFORE the
   upsert, so a revoked device at capacity can't re-activate itself via `onConflictDoUpdate`.
2. `GET /api/alor-vpn/devices` (`server/alorVpnRoutes.ts`) — activeCount = distinct active names;
   device list collapsed by name.
3. Bot "Connected devices" screen (`renderVpnDevices` in `server/bot.ts`) — same collapse so the
   slot count + list match the proxy.

Normalize blank/null names to `"VPN client"` on BOTH sides of every comparison. `revokeVpnDevice`
revokes ALL rows sharing the deviceName for that user, so a name can't be left half-revoked.
