import { useEffect, useLayoutEffect } from "react";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

interface SeoProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  path?: string;
  type?: "website" | "article" | "product";
  noindex?: boolean;
  jsonLd?: Record<string, any> | Record<string, any>[];
}

const SITE = "DARKSHARE";
const ORIGIN = "https://www.darkshare.store";
const DEFAULT_IMAGE = `${ORIGIN}/logo.png`;

function setMeta(attr: "name" | "property", key: string, content: string | undefined) {
  if (typeof document === "undefined") return;
  if (!content) return;
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setLink(rel: string, href: string, hreflang?: string) {
  if (typeof document === "undefined") return;
  const sel = hreflang
    ? `link[rel="${rel}"][hreflang="${hreflang}"]`
    : `link[rel="${rel}"]:not([hreflang])`;
  let el = document.head.querySelector<HTMLLinkElement>(sel);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    if (hreflang) el.setAttribute("hreflang", hreflang);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function setJsonLd(blocks: Record<string, any> | Record<string, any>[] | undefined) {
  if (typeof document === "undefined") return;
  document.head
    .querySelectorAll('script[data-seo-jsonld="page"]')
    .forEach((el) => el.remove());
  if (!blocks) return;
  const arr = Array.isArray(blocks) ? blocks : [blocks];
  for (const obj of arr) {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute("data-seo-jsonld", "page");
    script.textContent = JSON.stringify(obj);
    document.head.appendChild(script);
  }
}

export function Seo(props: SeoProps) {
  const {
    title,
    description,
    keywords,
    image = DEFAULT_IMAGE,
    path,
    type = "website",
    noindex,
    jsonLd,
  } = props;

  useIsoLayoutEffect(() => {
    const fullTitle = title ? `${title} — ${SITE}` : `${SITE} — Security OSINT Platform`;
    document.title = fullTitle;

    const url = path ? `${ORIGIN}${path.startsWith("/") ? path : "/" + path}` : ORIGIN;

    setMeta("name", "description", description);
    setMeta("name", "keywords", keywords);
    setMeta("name", "robots", noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1");
    setMeta("name", "twitter:title", fullTitle);
    setMeta("name", "twitter:description", description);
    setMeta("name", "twitter:image", image);
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("property", "og:title", fullTitle);
    setMeta("property", "og:description", description);
    setMeta("property", "og:image", image);
    setMeta("property", "og:url", url);
    setMeta("property", "og:type", type);
    setMeta("property", "og:site_name", SITE);

    setLink("canonical", url);

    setJsonLd(jsonLd);
  }, [title, description, keywords, image, path, type, noindex, JSON.stringify(jsonLd || null)]);

  return null;
}
