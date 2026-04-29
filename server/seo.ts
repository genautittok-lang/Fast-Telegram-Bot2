import type { Express, Request, Response } from "express";

const SITE_URL = (process.env.WEB_DOMAIN || "https://www.darkshare.store").replace(/\/+$/, "");

const PAGES: Array<{ path: string; priority: number; changefreq: string }> = [
  { path: "/", priority: 1.0, changefreq: "daily" },
  { path: "/pricing", priority: 0.9, changefreq: "weekly" },
  { path: "/api-docs", priority: 0.9, changefreq: "weekly" },
  { path: "/guide", priority: 0.8, changefreq: "weekly" },
  { path: "/dashboard", priority: 0.7, changefreq: "weekly" },
  { path: "/teams", priority: 0.6, changefreq: "monthly" },
  { path: "/download", priority: 0.6, changefreq: "monthly" },
  { path: "/login", priority: 0.5, changefreq: "monthly" },
  { path: "/terms", priority: 0.3, changefreq: "yearly" },
  { path: "/privacy", priority: 0.3, changefreq: "yearly" },
  { path: "/aup", priority: 0.3, changefreq: "yearly" },
  { path: "/data-deletion", priority: 0.3, changefreq: "yearly" },
];

const LANGS = ["en", "uk", "ru", "es", "de"];

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
    const urls = PAGES.map((p) => {
      const loc = `${SITE_URL}${p.path === "/" ? "" : p.path}`;
      const alternates = LANGS.map(
        (l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${loc}?lang=${l}"/>`,
      ).join("\n");
      return [
        "  <url>",
        `    <loc>${loc}</loc>`,
        `    <lastmod>${today}</lastmod>`,
        `    <changefreq>${p.changefreq}</changefreq>`,
        `    <priority>${p.priority.toFixed(1)}</priority>`,
        alternates,
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${loc}"/>`,
        "  </url>",
      ].join("\n");
    }).join("\n");

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
