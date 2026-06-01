import type { Request, Response, Express } from "express";
import QRCode from "qrcode";
import { storage } from "./storage";
import { buildPublicSubUrl } from "./vpnProxy";

export interface AppDeepLink {
  id: string;
  name: string;
  platforms: ("ios" | "android" | "windows" | "macos" | "linux")[];
  deepLink: string;
  storeUrl: string;
  recommended?: boolean;
}

function b64(s: string): string {
  // Standard base64 WITH padding — for query-param ?url= clients that decode after URL-decoding
  return Buffer.from(s, "utf8").toString("base64");
}

function b64url(s: string): string {
  // RFC 4648 §5 base64url — no padding, "-"/"_" instead of "+"/"/".
  // Required for Happ (happ://add/<b64url>) and sub:// scheme so the link is valid
  // without any extra URL-encoding (which Happ does NOT decode and treats as invalid).
  return Buffer.from(s, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function buildDeepLinks(subUrl: string): AppDeepLink[] {
  const encoded = encodeURIComponent(subUrl);
  const subB64Url = b64url(subUrl);            // base64url, no padding — for custom schemes
  const subSchemeUniversal = `sub://${subB64Url}`;

  return [
    {
      id: "happ",
      name: "Happ",
      platforms: ["ios", "android", "windows", "macos"],
      // Happ expects raw base64url in the path (no percent-encoding, no padding).
      // Using standard base64 + encodeURIComponent produced %2F/%2B/%3D which Happ rejects as "invalid link".
      deepLink: `happ://add/${subB64Url}`,
      storeUrl: "https://happ.su",
      recommended: true,
    },
    {
      id: "v2rayng",
      name: "v2rayNG",
      platforms: ["android"],
      deepLink: `v2rayng://install-sub?url=${encoded}`,
      storeUrl: "https://play.google.com/store/apps/details?id=com.v2ray.ang",
    },
    {
      id: "shadowrocket",
      name: "Shadowrocket",
      platforms: ["ios"],
      deepLink: subSchemeUniversal,
      storeUrl: "https://apps.apple.com/app/shadowrocket/id932747118",
      recommended: true,
    },
    {
      id: "nekobox",
      name: "NekoBox",
      platforms: ["android", "windows"],
      deepLink: `sn://subscription?url=${encoded}`,
      storeUrl: "https://github.com/MatsuriDayo/NekoBoxForAndroid/releases",
    },
    {
      id: "clashverge",
      name: "Clash Verge",
      platforms: ["windows", "macos", "linux"],
      deepLink: `clash://install-config?url=${encoded}&name=DarkShare+VPN`,
      storeUrl: "https://github.com/clash-verge-rev/clash-verge-rev/releases",
    },
    {
      id: "v2rayn",
      name: "v2rayN",
      platforms: ["windows"],
      deepLink: subSchemeUniversal,
      storeUrl: "https://github.com/2dust/v2rayN/releases",
    },
  ];
}

// Simple in-memory rate limiter for QR endpoint (per IP). Light protection against compute abuse.
const qrHits = new Map<string, { count: number; resetAt: number }>();
function qrRateLimit(ip: string): boolean {
  const now = Date.now();
  const slot = qrHits.get(ip);
  if (!slot || slot.resetAt < now) {
    qrHits.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  slot.count += 1;
  return slot.count <= 30; // max 30 QR/min per IP
}

export function registerVpnDeepLinkRoutes(app: Express) {
  // HTTPS bridge that triggers a custom-scheme deep link.
  // Telegram inline keyboard URL buttons only accept http(s)/tg:// — so we hand off via a tiny HTML page.
  app.get("/vpn/open/:app/:token", async (req: Request, res: Response) => {
    try {
      const appId = String(req.params.app || "").trim();
      const token = String(req.params.token || "").trim();
      if (!appId || !token) return res.status(404).send("Not found");

      const subUrl = buildPublicSubUrl(req, token);
      const apps = buildDeepLinks(subUrl);
      const target = apps.find((a) => a.id === appId);
      if (!target) return res.status(404).send("Unknown app");

      // Resolve language: ?lang= from the bot link first, then the user record by token, else English.
      const supported = ["uk", "ru", "es", "de", "en"] as const;
      type Lang = (typeof supported)[number];
      let lang: Lang = "en";
      const qLang = String((req.query.lang as string) || "").toLowerCase();
      if ((supported as readonly string[]).includes(qLang)) {
        lang = qLang as Lang;
      } else {
        try {
          const u = await storage.getUserByAlorVpnToken(token);
          const uLang = String((u as any)?.lang || "").toLowerCase();
          if ((supported as readonly string[]).includes(uLang)) lang = uLang as Lang;
        } catch {}
      }
      const p = <T extends Record<Lang, string>>(o: T): string => o[lang] ?? o.en;

      const t = {
        title: p({
          uk: `Відкрити в ${target.name}`,
          ru: `Открыть в ${target.name}`,
          es: `Abrir en ${target.name}`,
          de: `In ${target.name} öffnen`,
          en: `Open in ${target.name}`,
        }),
        sub: p({
          uk: "Натисни кнопку — підписка DarkShare VPN імпортується в застосунок автоматично.",
          ru: "Нажми кнопку — подписка DarkShare VPN импортируется в приложение автоматически.",
          es: "Pulsa el botón — tu suscripción DarkShare VPN se importará a la app automáticamente.",
          de: "Tippe auf die Schaltfläche — dein DarkShare-VPN-Abo wird automatisch in die App importiert.",
          en: "Tap the button — your DarkShare VPN subscription imports into the app automatically.",
        }),
        openBtn: p({
          uk: `Відкрити в ${target.name}`,
          ru: `Открыть в ${target.name}`,
          es: `Abrir en ${target.name}`,
          de: `In ${target.name} öffnen`,
          en: `Open in ${target.name}`,
        }),
        retry: p({
          uk: "Не відкрилось? Натисни ще раз",
          ru: "Не открылось? Нажми ещё раз",
          es: "¿No se abrió? Pulsa de nuevo",
          de: "Nicht geöffnet? Erneut tippen",
          en: "Didn't open? Tap again",
        }),
        linkTitle: p({
          uk: "Твоє посилання підписки",
          ru: "Твоя ссылка подписки",
          es: "Tu enlace de suscripción",
          de: "Dein Abonnement-Link",
          en: "Your subscription link",
        }),
        copyHint: p({
          uk: "Тапни, щоб скопіювати",
          ru: "Тапни, чтобы скопировать",
          es: "Toca para copiar",
          de: "Zum Kopieren tippen",
          en: "Tap to copy",
        }),
        copied: p({
          uk: "✅ Скопійовано!",
          ru: "✅ Скопировано!",
          es: "✅ ¡Copiado!",
          de: "✅ Kopiert!",
          en: "✅ Copied!",
        }),
        copyManual: p({
          uk: "Виділи та скопіюй текст вище",
          ru: "Выдели и скопируй текст выше",
          es: "Selecciona y copia el texto de arriba",
          de: "Text oben markieren und kopieren",
          en: "Select and copy the text above",
        }),
        manualSteps: p({
          uk: "Або встав це посилання вручну: у застосунку → «Додати підписку» → «Імпорт з URL».",
          ru: "Или вставь эту ссылку вручную: в приложении → «Добавить подписку» → «Импорт по URL».",
          es: "O pega este enlace manualmente: en la app → «Añadir suscripción» → «Importar desde URL».",
          de: "Oder füge den Link manuell ein: in der App → „Abo hinzufügen“ → „Aus URL importieren“.",
          en: 'Or paste this link manually: in the app → "Add subscription" → "Import from URL".',
        }),
        noApp: p({
          uk: `Немає ${target.name}? Встановити`,
          ru: `Нет ${target.name}? Установить`,
          es: `¿No tienes ${target.name}? Instalar`,
          de: `Kein ${target.name}? Installieren`,
          en: `Don't have ${target.name}? Install`,
        }),
        notice: p({
          uk: "Якщо відкрив це з Telegram і кнопка не спрацювала — відкрий посилання у звичайному браузері або просто скопіюй його вище.",
          ru: "Если открыл это из Telegram и кнопка не сработала — открой ссылку в обычном браузере или просто скопируй её выше.",
          es: "Si abriste esto desde Telegram y el botón no funciona — abre el enlace en tu navegador normal o cópialo arriba.",
          de: "Wenn du dies aus Telegram geöffnet hast und die Schaltfläche nicht funktioniert — öffne den Link im normalen Browser oder kopiere ihn oben.",
          en: "If you opened this from Telegram and the button doesn't work — open the link in your normal browser or just copy it above.",
        }),
      };

      const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
      const escapedDeep = target.deepLink.replace(/"/g, "&quot;");
      const escapedStore = target.storeUrl.replace(/"/g, "&quot;");
      const escapedSubUrl = subUrl.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const html = `<!doctype html>
<html lang="${lang}"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="referrer" content="no-referrer">
<title>${esc(t.title)}</title>
<style>
  *{box-sizing:border-box}
  body{margin:0;background:#0a0a0c;color:#e5e7eb;font:15px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:20px}
  .card{max-width:400px;width:100%;background:#111114;border:1px solid #1f1f24;border-radius:18px;padding:28px 24px;text-align:center}
  .logo{font-size:13px;letter-spacing:.12em;color:#06b6d4;font-weight:700;margin:0 0 14px}
  h1{font-size:20px;margin:0 0 8px;color:#fff;font-weight:700}
  .sub{margin:0 0 22px;color:#9ca3af;font-size:13.5px;line-height:1.5}
  .btn{display:flex;align-items:center;justify-content:center;gap:8px;padding:14px 16px;border-radius:12px;font-weight:600;font-size:15px;text-decoration:none;margin:10px 0;transition:opacity .15s}
  .btn:active{opacity:.8}
  .primary{background:#06b6d4;color:#000}
  .install{display:inline-block;margin:14px 0 0;color:#71717a;font-size:12.5px;text-decoration:underline;text-underline-offset:3px}
  .divider{border:none;border-top:1px solid #1f1f24;margin:22px 0 18px}
  .link-title{font-size:12px;color:#71717a;margin:0 0 8px;text-transform:uppercase;letter-spacing:.05em}
  .copy-box{background:#18181b;border:1px solid #27272a;border-radius:10px;padding:13px;font-size:12px;color:#cbd5e1;word-break:break-all;cursor:pointer;text-align:left;user-select:all;-webkit-user-select:all}
  .copy-box:active{background:#222226;border-color:#06b6d4}
  .copy-hint{font-size:11px;color:#52525b;margin:7px 0 0}
  .steps{font-size:12px;color:#6b7280;margin:14px 0 0;line-height:1.5}
  .notice{font-size:11.5px;color:#52525b;margin-top:18px;line-height:1.5;border-top:1px solid #1f1f24;padding-top:16px}
</style></head><body>
<div class="card">
  <p class="logo">🛡️ DARKSHARE VPN</p>
  <h1>${esc(t.title)}</h1>
  <p class="sub">${esc(t.sub)}</p>
  <a class="btn primary" href="${escapedDeep}" id="go" onclick="onOpen()">▶ ${esc(t.openBtn)}</a>
  <a class="install" href="${escapedStore}" target="_blank" rel="noopener noreferrer">${esc(t.noApp)}</a>
  <hr class="divider">
  <p class="link-title">${esc(t.linkTitle)}</p>
  <div class="copy-box" onclick="copyUrl(this)" title="${esc(t.copyHint)}">${escapedSubUrl}</div>
  <p class="copy-hint" id="copy-status">${esc(t.copyHint)}</p>
  <p class="steps">${esc(t.manualSteps)}</p>
  <p class="notice">${esc(t.notice)}</p>
</div>
<script>
var I18N=${JSON.stringify({ retry: t.retry, copied: t.copied, manual: t.copyManual })};
function onOpen(){
  setTimeout(function(){
    var el=document.getElementById('go');
    if(el) el.textContent='▶ '+I18N.retry;
  },1800);
}
function copyUrl(el){
  var url=${JSON.stringify(subUrl)};
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(url).then(function(){
      document.getElementById('copy-status').textContent=I18N.copied;
    }).catch(function(){fallbackCopy(url)});
  } else { fallbackCopy(url); }
}
function fallbackCopy(url){
  try{
    var ta=document.createElement('textarea');
    ta.value=url;ta.style.position='fixed';ta.style.opacity='0';
    document.body.appendChild(ta);ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    document.getElementById('copy-status').textContent=I18N.copied;
  }catch(e){
    document.getElementById('copy-status').textContent=I18N.manual;
  }
}
</script>
</body></html>`;
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "no-store");
      return res.send(html);
    } catch (err: any) {
      console.error("[vpnDeepLinks] /open error:", err?.message || err);
      return res.status(500).send("Error");
    }
  });

  // QR code PNG of subscription URL — scannable by any V2Ray-compatible app
  app.get("/vpn/sub/:token/qr", async (req: Request, res: Response) => {
    const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip || "unknown";
    if (!qrRateLimit(ip)) return res.status(429).send("Too many requests");

    try {
      const token = String(req.params.token || "").trim();
      if (!token) return res.status(404).send("Not found");

      const subUrl = buildPublicSubUrl(req, token);
      const png = await QRCode.toBuffer(subUrl, {
        type: "png",
        errorCorrectionLevel: "M",
        margin: 2,
        width: 512,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });

      res.setHeader("Content-Type", "image/png");
      res.setHeader("Cache-Control", "public, max-age=300");
      return res.send(png);
    } catch (err: any) {
      console.error("[vpnDeepLinks] qr error:", err?.message || err);
      return res.status(500).send("QR error");
    }
  });

  // Note: /api/alor-vpn/deep-links removed — frontend gets `apps[]` + `qrUrl` from /api/alor-vpn/status,
  // and the bot calls buildDeepLinks() directly. No need for a duplicate endpoint with auth complexity.
}
