import type { Express, Request, Response } from "express";
import { PSEO_LANGS, langPrefix, findTool, findCountry, TOOL_TYPES, COUNTRIES, type Lang } from "./data";
import {
  renderToolPage,
  renderToolsHub,
  renderCountryPage,
  renderCountryHub,
  renderSharePage,
  render404,
} from "./render";

type RiskLevel = "low" | "medium" | "high" | "critical";

function send(res: Response, html: string, status = 200) {
  res.status(status).type("html").send(html);
}

function levelFromScore(score: number): RiskLevel {
  if (score >= 80) return "critical";
  if (score >= 55) return "high";
  if (score >= 30) return "medium";
  return "low";
}

export function registerPseoRoutes(app: Express) {
  for (const lang of PSEO_LANGS) {
    const p = langPrefix(lang);

    app.get(`${p}/tools`, (_req: Request, res: Response) => send(res, renderToolsHub(lang)));

    app.get(`${p}/tools/:slug`, (req: Request, res: Response) => {
      const tool = findTool(req.params.slug);
      if (!tool) return send(res, render404(lang), 404);
      send(res, renderToolPage(tool, lang));
    });

    app.get(`${p}/ip-reputation`, (_req: Request, res: Response) => send(res, renderCountryHub(lang)));

    app.get(`${p}/ip-reputation/:iso`, (req: Request, res: Response) => {
      const cn = findCountry(req.params.iso);
      if (!cn) return send(res, render404(lang), 404);
      send(res, renderCountryPage(cn, lang));
    });
  }

  // Shareable scan-result landing page (noindex; rich OG for social unfurl)
  app.get("/scan", (req: Request, res: Response) => {
    const lang = (PSEO_LANGS.includes(req.query.lang as Lang) ? req.query.lang : "en") as Lang;
    const type = String(req.query.type || "").toLowerCase().replace(/[^a-z]/g, "").slice(0, 16);
    const tool = TOOL_TYPES.find((t) => t.key === type);
    const typeLabel = tool ? tool[lang].name : type ? type.toUpperCase() : "Target";
    const score = Math.max(0, Math.min(100, parseInt(String(req.query.score || "0"), 10) || 0));
    const level = (["low", "medium", "high", "critical"].includes(String(req.query.level))
      ? (String(req.query.level) as RiskLevel)
      : levelFromScore(score));
    const target = (String(req.query.t || req.query.target || "").slice(0, 64) || "—");
    send(res, renderSharePage({ type, typeLabel, target, score, level, lang }));
  });
}

// ── Sitemap groups (one group per logical page, with per-lang URLs) ────
export interface PseoSitemapGroup {
  en: string;
  uk: string;
  priority: number;
  changefreq: string;
}

export function getPseoSitemapGroups(): PseoSitemapGroup[] {
  const groups: PseoSitemapGroup[] = [
    { en: "/tools", uk: "/uk/tools", priority: 0.8, changefreq: "weekly" },
    { en: "/ip-reputation", uk: "/uk/ip-reputation", priority: 0.7, changefreq: "weekly" },
  ];
  for (const t of TOOL_TYPES) {
    groups.push({ en: `/tools/${t.slug}`, uk: `/uk/tools/${t.slug}`, priority: 0.7, changefreq: "monthly" });
  }
  for (const c of COUNTRIES) {
    groups.push({ en: `/ip-reputation/${c.iso}`, uk: `/uk/ip-reputation/${c.iso}`, priority: 0.5, changefreq: "monthly" });
  }
  return groups;
}
