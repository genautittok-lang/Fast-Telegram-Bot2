---
name: SEO JSON-LD conventions
description: Where each kind of structured data lives, and the one-FAQPage-per-URL rule.
---

# Structured-data (JSON-LD) placement rules

- **Sitewide schemas** (Organization, SoftwareApplication, WebSite, BreadcrumbList)
  live as static `<script type="application/ld+json">` blocks in `client/index.html`.
  They are fine to repeat on every SPA route.
- **Route-specific schemas** (FAQPage, Product, HowTo, TechArticle) live ONLY in
  `client/src/lib/seoConfig.ts` and are injected by the `Seo` component, which clears
  the previous route's `script[data-seo-jsonld="page"]` on each navigation.

**Why:** Google suppresses/garbles FAQ rich results when a single URL exposes more than
one `FAQPage`. The static homepage FAQ used to persist on every SPA route and collided
with the per-page FAQ on `/vpn`.

**How to apply:** never put a `FAQPage` in static `index.html`. Put the homepage FAQ in
`SEO_CONFIG["/"].jsonLd` and any page FAQ in that page's config. Keep at most one FAQPage
per URL. Keep plan pricing consistent everywhere ($9 / $30 / $45 for PRO/ENTERPRISE/GROUPS).
Use `Product` (not `SoftwareApplication`) for the VPN schema — don't mix
`operatingSystem`/`applicationCategory` into a `Product`.
