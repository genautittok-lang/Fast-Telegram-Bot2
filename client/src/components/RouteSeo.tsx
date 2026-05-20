import { useLocation } from "wouter";
import { Seo } from "./Seo";
import { resolveSeo } from "@/lib/seoConfig";

export function RouteSeo() {
  const [location] = useLocation();
  const cfg = resolveSeo(location);
  return (
    <Seo
      title={cfg.title}
      description={cfg.description}
      keywords={cfg.keywords}
      type={cfg.type}
      noindex={cfg.noindex}
      jsonLd={cfg.jsonLd}
      path={location}
      image="https://www.darkshare.store/og-image.png"
    />
  );
}
