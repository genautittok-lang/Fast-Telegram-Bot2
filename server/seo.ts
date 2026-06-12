import type { Express, Request, Response } from "express";
import { getPseoSitemapGroups } from "./pseo";

const SITE_URL = (process.env.WEB_DOMAIN || "https://www.darkshare.store").replace(/\/+$/, "");

const PAGES: Array<{ path: string; priority: number; changefreq: string }> = [
  { path: "/", priority: 1.0, changefreq: "daily" },
  { path: "/pricing", priority: 0.9, changefreq: "weekly" },
  { path: "/api-docs", priority: 0.9, changefreq: "weekly" },
  { path: "/guide", priority: 0.8, changefreq: "weekly" },
  { path: "/wizard", priority: 0.8, changefreq: "weekly" },
  { path: "/takedown", priority: 0.8, changefreq: "weekly" },
  { path: "/threat-profile", priority: 0.8, changefreq: "weekly" },
  { path: "/exif", priority: 0.7, changefreq: "weekly" },
  { path: "/geoint", priority: 0.7, changefreq: "weekly" },
  { path: "/vpn", priority: 0.7, changefreq: "weekly" },
  { path: "/dashboard", priority: 0.7, changefreq: "weekly" },
  { path: "/trust", priority: 0.7, changefreq: "monthly" },
  { path: "/community", priority: 0.6, changefreq: "weekly" },
  { path: "/teams", priority: 0.6, changefreq: "monthly" },
  { path: "/download", priority: 0.6, changefreq: "monthly" },
  { path: "/referral", priority: 0.5, changefreq: "monthly" },
  { path: "/support", priority: 0.5, changefreq: "monthly" },
  { path: "/login", priority: 0.5, changefreq: "monthly" },
  { path: "/terms", priority: 0.3, changefreq: "yearly" },
  { path: "/privacy", priority: 0.3, changefreq: "yearly" },
  { path: "/aup", priority: 0.3, changefreq: "yearly" },
  { path: "/data-deletion", priority: 0.3, changefreq: "yearly" },
];

export function registerSeoRoutes(app: Express) {
  app.get("/robots.txt", (_req: Request, res: Response) => {
    const body = [
      "User-agent: *",
      "Allow: /",
      "Disallow: /admin",
      "Disallow: /account",
      "Disallow: /api/",
      "Disallow: /uploads/",
      "",
      `Sitemap: ${SITE_URL}/sitemap.xml`,
      "",
    ].join("\n");
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send(body);
  });

  app.get("/sitemap.xml", (_req: Request, res: Response) => {
    const today = new Date().toISOString().split("T")[0];
    // SPA pages: a single canonical URL serves all UI languages (client-side i18n),
    // so we emit one entry each — no contradictory ?lang= hreflang alternates.
    const spa = PAGES.map((p) => {
      const loc = `${SITE_URL}${p.path === "/" ? "" : p.path}`;
      return [
        "  <url>",
        `    <loc>${loc}</loc>`,
        `    <lastmod>${today}</lastmod>`,
        `    <changefreq>${p.changefreq}</changefreq>`,
        `    <priority>${p.priority.toFixed(1)}</priority>`,
        "  </url>",
      ].join("\n");
    });
    // Programmatic SEO pages: genuine per-language URLs (/… and /uk/…) with hreflang.
    const pseo: string[] = [];
    for (const g of getPseoSitemapGroups()) {
      const enLoc = `${SITE_URL}${g.en}`;
      const ukLoc = `${SITE_URL}${g.uk}`;
      const alternates = [
        `    <xhtml:link rel="alternate" hreflang="en" href="${enLoc}"/>`,
        `    <xhtml:link rel="alternate" hreflang="uk" href="${ukLoc}"/>`,
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${enLoc}"/>`,
      ].join("\n");
      for (const loc of [enLoc, ukLoc]) {
        pseo.push(
          [
            "  <url>",
            `    <loc>${loc}</loc>`,
            `    <lastmod>${today}</lastmod>`,
            `    <changefreq>${g.changefreq}</changefreq>`,
            `    <priority>${g.priority.toFixed(1)}</priority>`,
            alternates,
            "  </url>",
          ].join("\n"),
        );
      }
    }
    const urls = [...spa, ...pseo].join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>`;
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(xml);
  });

  app.get("/.well-known/security.txt", (_req: Request, res: Response) => {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.send(
      [
        `Contact: mailto:security@darkshare.store`,
        `Expires: ${new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()}`,
        `Preferred-Languages: en, uk, ru`,
        `Canonical: ${SITE_URL}/.well-known/security.txt`,
        "",
      ].join("\n"),
    );
  });
}
