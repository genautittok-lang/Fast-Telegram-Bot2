---
name: VPN device-limit enforcement quirk
description: Why FREE-tier active VPN users need an explicit device cap in the proxy.
---

`vpnDeviceLimit(tier)` (`server/alorVpn.ts`) returns 0 for FREE. The proxy in `server/vpnProxy.ts` only enforces a cap when `limit > 0`, so a raw FREE value of 0 means "unlimited", not "blocked".

**Why:** FREE users can now hold an active VPN entitlement (free 1-day trial or referral days). Without special handling they'd get unlimited devices. Fix: when tier is FREE but the user has an active entitlement (`max(alorVpnExpiresAt, subscriptionExpiresAt) > now`), force `limit = 2`.

**How to apply:** Any change to device-limit logic must preserve an explicit cap for FREE users who currently have an active VPN — don't rely on `vpnDeviceLimit("FREE")` alone.
