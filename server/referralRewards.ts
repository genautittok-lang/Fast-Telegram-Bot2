import { storage } from "./storage";
import { createAlorSubscription } from "./alorVpn";

type Lang = "uk" | "ru" | "es" | "de" | "en";

function normLang(code: string | null | undefined): Lang {
  const c = String(code || "").toLowerCase();
  if (c.startsWith("uk") || c === "ua") return "uk";
  if (c.startsWith("ru")) return "ru";
  if (c.startsWith("es")) return "es";
  if (c.startsWith("de")) return "de";
  return "en";
}

export type ReferralNotify = (tgId: string, message: string) => Promise<unknown>;

/**
 * Referral milestone reward — shared by the Telegram bot and the website so the
 * bonus rules stay identical across both surfaces. Every 3 successful invites
 * grants the referrer +1 free DARKSHARE VPN day, for ALL tiers. AlorVPN has no
 * token-preserving "extend" endpoint, so we (re)create a subscription covering
 * (remaining days + newly granted days). For paid users "remaining" is measured
 * from the EFFECTIVE expiry (later of VPN expiry and main-subscription expiry),
 * so their VPN access is never shortened.
 *
 * Pass `notify` to deliver a Telegram message (only attempted for numeric tgIds).
 * Returns the number of newly granted days (0 if none / on failure).
 */
export async function grantReferralVpnDays(referrer: any, notify?: ReferralNotify): Promise<number> {
  try {
    if (!referrer?.id) return 0;

    // Re-read the referrer so `already` and expiry reflect committed state, not a
    // possibly-stale snapshot passed by the caller (defense against double grants).
    try {
      const fresh = await storage.getUser(referrer.id);
      if (fresh) referrer = fresh;
    } catch {}

    const stats = await storage.getReferralStats(referrer.id);
    const eligible = Math.floor((stats.count || 0) / 3);
    const already = Number(referrer.vpnReferralDaysGranted || 0);
    const newDays = eligible - already;
    if (newDays <= 0) return 0;

    const vpnExpMs = referrer.alorVpnExpiresAt ? new Date(referrer.alorVpnExpiresAt).getTime() : 0;
    const subExpMs = referrer.subscriptionExpiresAt ? new Date(referrer.subscriptionExpiresAt).getTime() : 0;
    const expMs = Math.max(vpnExpMs, subExpMs);
    const remainingDays = expMs > Date.now() ? Math.ceil((expMs - Date.now()) / 86400000) : 0;
    const planDays = remainingDays + newDays;

    const sub = await createAlorSubscription(planDays);
    await storage.updateUser(referrer.id, {
      alorVpnToken: sub.token,
      alorVpnUuid: sub.uuid,
      alorVpnSubscriptionUrl: sub.subscription_url,
      alorVpnExpiresAt: new Date(sub.expires_at),
      vpnReferralDaysGranted: eligible,
      vpnTrialExpiryNotified: false,
    } as any);

    if (notify && referrer.tgId && /^\d+$/.test(String(referrer.tgId))) {
      const lang = normLang(referrer.lang);
      const pick = (o: Record<Lang, string>): string => o[lang] ?? o.en;
      const msg = pick({
        uk: `🎁 <b>+${newDays} день VPN!</b>\n\nДякуємо, що запрошуєш друзів. Тобі нараховано <b>+${newDays}</b> безкоштовний день DARKSHARE VPN.\n\nВідкрий меню VPN, щоб під'єднатися 🛡️`,
        ru: `🎁 <b>+${newDays} день VPN!</b>\n\nСпасибо, что приглашаешь друзей. Тебе начислено <b>+${newDays}</b> бесплатный день DARKSHARE VPN.\n\nОткрой меню VPN, чтобы подключиться 🛡️`,
        es: `🎁 <b>+${newDays} día de VPN!</b>\n\nGracias por invitar amigos. Recibiste <b>+${newDays}</b> día gratis de DARKSHARE VPN.\n\nAbre el menú VPN para conectarte 🛡️`,
        de: `🎁 <b>+${newDays} Tag VPN!</b>\n\nDanke, dass du Freunde einlädst. Du hast <b>+${newDays}</b> Gratis-Tag DARKSHARE VPN erhalten.\n\nÖffne das VPN-Menü zum Verbinden 🛡️`,
        en: `🎁 <b>+${newDays} VPN day!</b>\n\nThanks for inviting friends. You earned <b>+${newDays}</b> free day of DARKSHARE VPN.\n\nOpen the VPN menu to connect 🛡️`,
      });
      await notify(referrer.tgId, msg).catch(() => {});
    }

    console.log(`[VPN] Granted +${newDays} referral VPN day(s) to user ${referrer.id} (eligible=${eligible})`);
    return newDays;
  } catch (e) {
    console.error("[VPN] grantReferralVpnDays failed:", e);
    return 0;
  }
}
