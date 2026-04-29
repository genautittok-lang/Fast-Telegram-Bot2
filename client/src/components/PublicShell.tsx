import { Link, useLocation } from "wouter";
import { Shield } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/lib/auth";

interface Props {
  children: React.ReactNode;
}

export function PublicShell({ children }: Props) {
  const [location] = useLocation();
  const { isAuthenticated } = useAuth();

  const links: { href: string; label: string }[] = [
    { href: "/", label: "Home" },
    { href: "/pricing", label: "Pricing" },
    { href: "/api-docs", label: "API" },
    { href: "/guide", label: "Guide" },
    { href: "/vpn", label: "VPN" },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#0A0A0A]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <Link href="/">
            <span className="inline-flex cursor-pointer items-center gap-2" data-testid="link-public-logo">
              <span className="grid h-8 w-8 place-items-center rounded-lg border border-cyan-500/30 bg-cyan-500/10">
                <Shield className="h-4 w-4 text-cyan-300" />
              </span>
              <span className="text-[15px] font-semibold tracking-tight">DarkShare</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {links.map((l) => {
              const active = location === l.href || (l.href !== "/" && location.startsWith(l.href));
              return (
                <Link key={l.href} href={l.href}>
                  <span
                    className={`inline-flex cursor-pointer items-center rounded-md px-3 py-1.5 text-[13px] transition-colors ${
                      active
                        ? "bg-white/[0.04] text-white"
                        : "text-zinc-400 hover:text-white"
                    }`}
                    data-testid={`link-public-${l.label.toLowerCase()}`}
                  >
                    {l.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <LanguageSwitcher variant="minimal" />
            {isAuthenticated ? (
              <Link href="/dashboard">
                <span className="inline-flex h-9 cursor-pointer items-center rounded-lg bg-white px-3.5 text-[13px] font-medium text-black transition-colors hover:bg-zinc-200" data-testid="link-public-dashboard">
                  Dashboard
                </span>
              </Link>
            ) : (
              <Link href="/login">
                <span className="inline-flex h-9 cursor-pointer items-center rounded-lg bg-white px-3.5 text-[13px] font-medium text-black transition-colors hover:bg-zinc-200" data-testid="link-public-signin">
                  Sign in
                </span>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main>{children}</main>

      <Footer />
    </div>
  );
}
