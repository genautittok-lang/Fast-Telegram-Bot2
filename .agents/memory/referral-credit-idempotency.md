---
name: Referral credit idempotency
description: Why referral rewards must be gated on a fresh insert, not just "createReferral didn't throw".
---

# Referral crediting must be gated on an actual new insert

`ds_referrals` has a UNIQUE index on `referred_id` (one referral per referred user),
created idempotently at startup in `ensureTablesExist()` with a dedup-then-retry fallback.

`storage.createReferral` uses `onConflictDoNothing({ target: referredId }).returning(...)`
and returns a boolean `inserted`. Every credit path must grant rewards (+5 referred /
+2 referrer request bonus AND `grantReferralVpnDays`) ONLY when `inserted === true`, and
must always clear `pendingRefCode` regardless.

**Why:** crediting fires from three paths that can race for the same referred user —
bot first-check (`creditPendingReferral`), bot `/start ref_...`, and the website
check-credit path in routes. The old code swallowed duplicate-insert errors and returned
void, so concurrent callers all proceeded to grant, double-crediting bonuses and VPN days.

**How to apply:** if you add another place that credits a referral, call `createReferral`
and branch on its boolean return. Don't infer success from "no exception thrown". Keep
`grantReferralVpnDays` re-reading the referrer fresh before computing the milestone count
(`floor(referralCount/3) - vpnReferralDaysGranted`) so a stale snapshot can't re-grant.
