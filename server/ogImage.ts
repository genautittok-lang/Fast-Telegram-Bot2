import type { Express, Request, Response } from "express";
import fs from "fs";
import path from "path";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";

// ── Fonts (loaded once) ──────────────────────────────────────────────
function loadFont(file: string): Buffer | null {
  // Resolved purely from cwd (project root in both dev/tsx and prod/node dist/index.cjs)
  // to stay safe under esbuild's CJS bundle, where import.meta is empty.
  const candidates = [
    path.resolve(process.cwd(), "server", "fonts", file),
    path.resolve(process.cwd(), "fonts", file),
    path.resolve(process.cwd(), "dist", "fonts", file),
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return fs.readFileSync(p);
    } catch {
      /* ignore */
    }
  }
  return null;
}

const FONT_REGULAR = loadFont("Inter-Regular.woff");
const FONT_BOLD = loadFont("Inter-Bold.woff");
const FONTS_OK = !!(FONT_REGULAR && FONT_BOLD);

const satoriFonts = FONTS_OK
  ? [
      { name: "Inter", data: FONT_REGULAR as Buffer, weight: 400 as const, style: "normal" as const },
      { name: "Inter", data: FONT_BOLD as Buffer, weight: 700 as const, style: "normal" as const },
    ]
  : [];

// ── Tiny satori element helper (no JSX needed) ───────────────────────
type SNode = any;
function h(style: Record<string, any>, children?: SNode): SNode {
  return { type: "div", props: { style: { display: "flex", ...style }, children } };
}
function txt(style: Record<string, any>, text: string): SNode {
  return { type: "div", props: { style: { display: "flex", ...style }, children: text } };
}

// ── Risk palette ─────────────────────────────────────────────────────
export type RiskLevel = "low" | "medium" | "high" | "critical";
function riskColor(level: RiskLevel): string {
  return { low: "#34d399", medium: "#fbbf24", high: "#fb923c", critical: "#f43f5e" }[level] || "#22d3ee";
}

type Lang = "en" | "uk" | "ru" | "es" | "de";
const RISK_LABEL: Record<RiskLevel, Record<Lang, string>> = {
  low: { en: "Low risk", uk: "Низький ризик", ru: "Низкий риск", es: "Riesgo bajo", de: "Geringes Risiko" },
  medium: { en: "Medium risk", uk: "Середній ризик", ru: "Средний риск", es: "Riesgo medio", de: "Mittleres Risiko" },
  high: { en: "High risk", uk: "Високий ризик", ru: "Высокий риск", es: "Riesgo alto", de: "Hohes Risiko" },
  critical: { en: "Critical risk", uk: "Критичний ризик", ru: "Критический риск", es: "Riesgo crítico", de: "Kritisches Risiko" },
};
const CTA: Record<Lang, string> = {
  en: "Check anything free · darkshare.store",
  uk: "Перевір будь-що безкоштовно · darkshare.store",
  ru: "Проверь что угодно бесплатно · darkshare.store",
  es: "Comprueba lo que sea gratis · darkshare.store",
  de: "Prüfe alles kostenlos · darkshare.store",
};
const SCORE_LABEL: Record<Lang, string> = {
  en: "Risk score", uk: "Оцінка ризику", ru: "Оценка риска", es: "Puntuación de riesgo", de: "Risiko-Score",
};

function levelFromScore(score: number): RiskLevel {
  if (score >= 80) return "critical";
  if (score >= 55) return "high";
  if (score >= 30) return "medium";
  return "low";
}

// ── Card builders ─────────────────────────────────────────────────────
function brandHeader(accent: string): SNode {
  return h({ alignItems: "center", justifyContent: "space-between", width: "100%" }, [
    h({ alignItems: "center", gap: "14px" }, [
      h({ width: "16px", height: "16px", borderRadius: "5px", backgroundColor: accent }),
      txt({ fontSize: 30, fontWeight: 700, color: "#ffffff", letterSpacing: "1px" }, "DARKSHARE"),
    ]),
    txt({ fontSize: 18, fontWeight: 700, color: "#52525b", letterSpacing: "3px" }, "OSINT · THREAT INTEL"),
  ]);
}

function scanCardNode(opts: { target: string; typeLabel: string; score: number; level: RiskLevel; lang: Lang }): SNode {
  const { target, typeLabel, score, level, lang } = opts;
  const accent = riskColor(level);
  const pct = Math.max(0, Math.min(100, score));
  return h(
    {
      width: "1200px",
      height: "630px",
      flexDirection: "column",
      justifyContent: "space-between",
      padding: "64px 72px",
      backgroundColor: "#08080a",
      backgroundImage: `radial-gradient(900px 500px at 90% -10%, ${accent}22, transparent), radial-gradient(700px 400px at -10% 110%, #22d3ee14, transparent)`,
      color: "#ffffff",
      fontFamily: "Inter",
      borderTop: `8px solid ${accent}`,
    },
    [
      brandHeader(accent),
      // main
      h({ flexDirection: "column", gap: "6px" }, [
        txt({ fontSize: 24, fontWeight: 700, color: "#71717a", letterSpacing: "2px", textTransform: "uppercase" }, SCORE_LABEL[lang]),
        h({ alignItems: "flex-end", gap: "10px" }, [
          txt({ fontSize: 150, fontWeight: 700, color: accent, lineHeight: "1" }, String(pct)),
          txt({ fontSize: 54, fontWeight: 700, color: "#3f3f46", paddingBottom: "20px" }, "/100"),
          txt({ fontSize: 40, fontWeight: 700, color: accent, paddingBottom: "26px", marginLeft: "24px" }, RISK_LABEL[level][lang]),
        ]),
        // risk bar
        h({ width: "100%", height: "14px", borderRadius: "7px", backgroundColor: "#18181b", marginTop: "14px" }, [
          h({ width: `${pct}%`, height: "14px", borderRadius: "7px", backgroundColor: accent }),
        ]),
      ]),
      // footer: target + cta
      h({ flexDirection: "column", gap: "14px" }, [
        h({ alignItems: "center", gap: "12px" }, [
          txt({ fontSize: 26, fontWeight: 700, color: "#e4e4e7", padding: "8px 18px", borderRadius: "10px", backgroundColor: "#141417", border: "1px solid #27272a" }, typeLabel),
          txt({ fontSize: 30, fontWeight: 400, color: "#a1a1aa" }, target),
        ]),
        txt({ fontSize: 24, fontWeight: 400, color: "#52525b" }, CTA[lang]),
      ]),
    ],
  );
}

function pageCardNode(opts: { title: string; subtitle?: string; badge?: string }): SNode {
  const accent = "#22d3ee";
  return h(
    {
      width: "1200px",
      height: "630px",
      flexDirection: "column",
      justifyContent: "space-between",
      padding: "64px 72px",
      backgroundColor: "#08080a",
      backgroundImage: `radial-gradient(900px 500px at 100% 0%, ${accent}1f, transparent), radial-gradient(700px 460px at 0% 100%, #6366f114, transparent)`,
      color: "#ffffff",
      fontFamily: "Inter",
      borderTop: `8px solid ${accent}`,
    },
    [
      brandHeader(accent),
      h({ flexDirection: "column", gap: "20px" }, [
        opts.badge
          ? txt({ fontSize: 22, fontWeight: 700, color: "#22d3ee", letterSpacing: "2px", textTransform: "uppercase", padding: "8px 18px", borderRadius: "999px", backgroundColor: "#0e2a30", border: "1px solid #155e6b", alignSelf: "flex-start" }, opts.badge)
          : h({}),
        txt({ fontSize: 64, fontWeight: 700, color: "#ffffff", lineHeight: "1.08", maxWidth: "1000px" }, opts.title),
        opts.subtitle ? txt({ fontSize: 30, fontWeight: 400, color: "#a1a1aa", maxWidth: "980px", lineHeight: "1.3" }, opts.subtitle) : h({}),
      ]),
      txt({ fontSize: 24, fontWeight: 400, color: "#52525b" }, "159+ OSINT sources · 14 leak databases · darkshare.store"),
    ],
  );
}

// ── Render + cache ────────────────────────────────────────────────────
async function toPng(node: SNode): Promise<Buffer> {
  const svg = await satori(node, { width: 1200, height: 630, fonts: satoriFonts });
  const png = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } }).render().asPng();
  return Buffer.from(png);
}

const cache = new Map<string, Buffer>();
const CACHE_MAX = 300;
function cacheGet(key: string): Buffer | undefined {
  const v = cache.get(key);
  if (v) {
    cache.delete(key);
    cache.set(key, v);
  }
  return v;
}
function cacheSet(key: string, buf: Buffer) {
  cache.set(key, buf);
  if (cache.size > CACHE_MAX) {
    const first = cache.keys().next().value;
    if (first !== undefined) cache.delete(first);
  }
}

function asLang(v: any): Lang {
  return (["en", "uk", "ru", "es", "de"].includes(v) ? v : "en") as Lang;
}

// ── Per-IP rate limit for fresh (uncached) renders ────────────────────
// Cache hits are cheap and not limited; only CPU-bound satori/resvg renders
// are capped, since these routes are unauthenticated.
const renderHits = new Map<string, { count: number; resetAt: number }>();
function renderRateLimited(ip: string, max = 20, windowMs = 60000): boolean {
  const now = Date.now();
  const e = renderHits.get(ip);
  if (!e || now > e.resetAt) {
    renderHits.set(ip, { count: 1, resetAt: now + windowMs });
    return false;
  }
  e.count++;
  return e.count > max;
}
setInterval(() => {
  const now = Date.now();
  for (const [k, e] of Array.from(renderHits.entries())) if (now > e.resetAt) renderHits.delete(k);
}, 300000).unref?.();

function clientIp(req: Request): string {
  const xf = req.headers["x-forwarded-for"];
  if (xf) return String(xf).split(",")[0].trim();
  return req.ip || "anon";
}

export function registerOgRoutes(app: Express) {
  // Shareable scan-result card
  app.get("/og/scan.png", async (req: Request, res: Response) => {
    try {
      if (!FONTS_OK) return res.status(503).end();
      const lang = asLang(req.query.lang);
      const score = Math.max(0, Math.min(100, parseInt(String(req.query.score || "0"), 10) || 0));
      const level = (["low", "medium", "high", "critical"].includes(String(req.query.level))
        ? String(req.query.level)
        : levelFromScore(score)) as RiskLevel;
      const target = String(req.query.target || "").slice(0, 64) || "—";
      const typeLabel = String(req.query.type || "Target").slice(0, 28);
      const key = `scan|${lang}|${score}|${level}|${target}|${typeLabel}`;
      let png = cacheGet(key);
      if (!png) {
        if (renderRateLimited(clientIp(req))) return res.status(429).end();
        png = await toPng(scanCardNode({ target, typeLabel, score, level, lang }));
        cacheSet(key, png);
      }
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Cache-Control", "public, max-age=86400, immutable");
      res.end(png);
    } catch (err: any) {
      console.error("og/scan error:", err?.message || err);
      res.status(500).end();
    }
  });

  // Generic page card (programmatic SEO pages)
  app.get("/og/page.png", async (req: Request, res: Response) => {
    try {
      if (!FONTS_OK) return res.status(503).end();
      const title = String(req.query.title || "DARKSHARE").slice(0, 120);
      const subtitle = req.query.subtitle ? String(req.query.subtitle).slice(0, 180) : undefined;
      const badge = req.query.badge ? String(req.query.badge).slice(0, 40) : undefined;
      const key = `page|${title}|${subtitle || ""}|${badge || ""}`;
      let png = cacheGet(key);
      if (!png) {
        if (renderRateLimited(clientIp(req))) return res.status(429).end();
        png = await toPng(pageCardNode({ title, subtitle, badge }));
        cacheSet(key, png);
      }
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Cache-Control", "public, max-age=604800, immutable");
      res.end(png);
    } catch (err: any) {
      console.error("og/page error:", err?.message || err);
      res.status(500).end();
    }
  });
}

export { levelFromScore };
