import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Shield, Bot, Menu, X } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "@/lib/i18n";

export function PublicHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [location] = useLocation();
  const { isAuthenticated } = useAuth();
  const { t, lang } = useTranslation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { href: "/pricing",  label: t("nav.pricing") || "Pricing" },
    { href: "/api-docs", label: t("nav.apiDocs") || "API Docs" },
    { href: "/guide",    label: t("nav.guide")   || "Guide" },
    { href: "/vpn",      label: t("nav.vpn")     || "VPN" },
    { href: "/trust",    label: "Trust" },
  ];

  const isActive = (href: string) =>
    href === "/" ? location === "/" : location.startsWith(href);

  const signInLabel =
    lang === "uk" ? "Увійти" :
    lang === "ru" ? "Войти" :
    lang === "es" ? "Entrar" :
    lang === "de" ? "Anmelden" : "Sign in";

  return (
    <>
      <header className={`sticky top-0 z-40 transition-all duration-300 ${scrolled ? "border-b border-white/[0.06] bg-[#09090B]/95 backdrop-blur-xl shadow-[0_1px_40px_rgba(0,0,0,0.4)]" : "border-b border-transparent bg-transparent backdrop-blur-none"}`}>
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-5">

          {/* ── Logo ── */}
          <Link href="/">
            <span className="flex cursor-pointer items-center gap-2.5" data-testid="link-logo">
              <div className="grid h-8 w-8 place-items-center rounded-lg border border-cyan-400/25 bg-cyan-500/10">
                <Shield className="h-4 w-4 text-cyan-300" />
              </div>
              <span className="text-[15px] font-semibold tracking-tight text-white">DarkShare</span>
            </span>
          </Link>

          {/* ── Desktop nav ── */}
          <nav className="hidden items-center md:flex" aria-label="Main navigation">
            {links.map((l) => (
              <Link key={l.href} href={l.href}>
                <span
                  className={`relative inline-flex cursor-pointer items-center rounded-md px-3 py-1.5 text-[13px] transition-all ${
                    isActive(l.href)
                      ? "text-white after:absolute after:bottom-0 after:left-3 after:right-3 after:h-[1.5px] after:rounded-full after:bg-cyan-400/70"
                      : "text-zinc-400 hover:bg-white/[0.04] hover:text-white"
                  }`}
                  data-testid={`link-nav-${l.href.replace("/", "")}`}
                >
                  {l.label}
                </span>
              </Link>
            ))}
          </nav>

          {/* ── Right actions ── */}
          <div className="flex items-center gap-1.5">
            <LanguageSwitcher />

            <a
              href="https://t.me/darkshare_bot"
              target="_blank"
              rel="noopener"
              className="hidden sm:inline-flex h-8 items-center gap-1.5 rounded-lg border border-cyan-400/20 bg-cyan-500/[0.08] px-2.5 text-[12.5px] font-medium text-cyan-200 transition-colors hover:bg-cyan-500/15"
              data-testid="link-header-bot"
              aria-label="Telegram bot"
            >
              <Bot className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">Bot</span>
            </a>

            {isAuthenticated ? (
              <Link href="/dashboard">
                <span
                  className="inline-flex h-8 cursor-pointer items-center rounded-lg bg-white px-3.5 text-[12.5px] font-semibold text-black transition-colors hover:bg-zinc-200"
                  data-testid="link-header-dashboard"
                >
                  Dashboard
                </span>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <span
                    className="hidden sm:inline-flex h-8 cursor-pointer items-center rounded-lg px-3 text-[12.5px] text-zinc-400 transition-colors hover:text-white"
                    data-testid="link-header-signin"
                  >
                    {signInLabel}
                  </span>
                </Link>
                <Link href="/pricing">
                  <span
                    className="inline-flex h-8 cursor-pointer items-center rounded-lg bg-white px-3.5 text-[12.5px] font-semibold text-black transition-colors hover:bg-zinc-100"
                    data-testid="link-header-pro"
                  >
                    PRO
                  </span>
                </Link>
              </>
            )}

            {/* ── Burger ── */}
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="ml-0.5 grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-zinc-400 transition-colors hover:border-white/20 hover:text-white md:hidden"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              data-testid="button-mobile-menu"
            >
              {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile drawer ── */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-30 md:hidden"
          onClick={() => setMenuOpen(false)}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-[6px]" />
          <nav
            className="absolute inset-x-0 top-14 overflow-hidden border-b border-white/[0.07] bg-[#0D0D0F] shadow-[0_20px_60px_rgba(0,0,0,0.7)]"
            onClick={(e) => e.stopPropagation()}
            aria-label="Mobile navigation"
          >
            <div className="p-3">
              {links.map((l) => (
                <Link key={l.href} href={l.href}>
                  <span
                    className={`flex cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-[14px] font-medium transition-colors ${
                      isActive(l.href)
                        ? "bg-white/[0.06] text-white"
                        : "text-zinc-300 hover:bg-white/[0.05] hover:text-white"
                    }`}
                    onClick={() => setMenuOpen(false)}
                  >
                    {l.label}
                  </span>
                </Link>
              ))}

              <div className="my-2 h-px bg-white/[0.07]" />

              <a
                href="https://t.me/darkshare_bot"
                target="_blank"
                rel="noopener"
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-[14px] font-medium text-cyan-300 transition-colors hover:bg-cyan-500/[0.07]"
                onClick={() => setMenuOpen(false)}
              >
                <Bot className="h-4 w-4" />
                Telegram Bot
              </a>

              <Link href={isAuthenticated ? "/dashboard" : "/login"}>
                <span
                  className="flex cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-[14px] font-medium text-zinc-300 transition-colors hover:bg-white/[0.05] hover:text-white"
                  onClick={() => setMenuOpen(false)}
                >
                  {isAuthenticated ? "Dashboard" : signInLabel}
                </span>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
