---
name: AlorVPN upstream rotation
description: Why/how VPN "extension" rotates the upstream subscription while the user's public token stays stable
---

**Rule:** AlorVPN upstream subscriptions have a FIXED expiry set at creation (API = create/status/toggle only, no extend). To "extend", create a NEW upstream subscription and update `alorVpnUuid` + `alorVpnSubscriptionUrl` + `alorVpnExpiresAt` — but NEVER overwrite an existing `alorVpnToken` (the public token in the user's `/vpn/sub/<token>` URL must stay stable forever).

**Why:** toggle(true) does not extend upstream; after upstream expiry the client app shows fake "Подписка истекла / Обновите подписку @alorvpnbot" entries even though local DB says active. Users import the sub URL into VPN apps once — changing the token silently breaks all their devices.

**How to apply:**
- All upstream status/toggle calls must use `upstreamAlorToken(user)` (parses the current upstream token from `alorVpnSubscriptionUrl`, falls back to `alorVpnToken`) — never the raw public token.
- Provisioning is serialized per user via an in-memory lock in autoProvisionAlorVpn to avoid duplicate upstream creates from overlapping payment/sync triggers.
- The proxy also strips upstream expiry-notice fake entries by remark keywords as defense in depth.
