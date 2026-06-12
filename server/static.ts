import express, { type Express } from "express";
import fs from "fs";
import path from "path";

function escapeAttr(v: string): string {
  return v.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Search-engine verification tokens are injected from env vars at serve time so
// no placeholder tokens ship in the repo. Only relevant on the production domain.
export function buildVerificationMeta(): string {
  const tags: string[] = [];
  const add = (name: string, val?: string) => {
    if (val && val.trim()) tags.push(`<meta name="${name}" content="${escapeAttr(val.trim())}" />`);
  };
  add("google-site-verification", process.env.GOOGLE_SITE_VERIFICATION);
  add("msvalidate.01", process.env.BING_SITE_VERIFICATION);
  add("yandex-verification", process.env.YANDEX_VERIFICATION);
  add("facebook-domain-verification", process.env.FACEBOOK_DOMAIN_VERIFICATION);
  add("p:domain_verify", process.env.PINTEREST_VERIFICATION);
  return tags.join("\n    ");
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Read index.html once and inject verification meta tags from env.
  const indexPath = path.resolve(distPath, "index.html");
  const indexHtml = fs
    .readFileSync(indexPath, "utf-8")
    .replace("<!--SEO_VERIFICATION-->", buildVerificationMeta());

  // Serve assets but let "/" fall through to the injected HTML below.
  app.use(express.static(distPath, { index: false }));

  // SPA fallback — serve the verification-injected index.html.
  app.use("*", (_req, res) => {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(indexHtml);
  });
}
