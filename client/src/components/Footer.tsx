import { Shield, ExternalLink, Mail } from "lucide-react";
import { SiTelegram, SiInstagram } from "react-icons/si";
import { Link } from "wouter";
import { useTranslation } from "@/lib/i18n";

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="relative z-10 border-t border-white/[0.06]">
      <div className="absolute inset-0 bg-gradient-to-t from-[#030305] via-[#050508] to-transparent pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          <div className="lg:col-span-2 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl overflow-hidden border border-primary/30 shadow-[0_0_25px_rgba(34,197,94,0.25)] ring-1 ring-primary/10">
                <img src="/logo.png" alt="DARKSHARE" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col">
                <span className="font-display font-bold text-lg tracking-tight text-white">DARKSHARE</span>
                <span className="text-[10px] text-primary font-mono -mt-0.5 uppercase tracking-wider">v4.5 OSINT Platform</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
              {t('footer.description')}
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <a 
                href="https://t.me/DarkShare1Bot" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#229ED9]/10 border border-[#229ED9]/25 text-[#229ED9] text-sm font-medium hover:bg-[#229ED9]/20 hover:border-[#229ED9]/40 transition-all duration-300 shadow-[0_0_15px_rgba(34,158,217,0.1)]"
                data-testid="link-telegram-footer"
              >
                <SiTelegram className="w-4 h-4" />
                @DarkShare1Bot
                <ExternalLink className="w-3 h-3" />
              </a>
              <a 
                href="https://www.instagram.com/darkshare.store" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#E4405F]/10 border border-[#E4405F]/25 text-[#E4405F] text-sm font-medium hover:bg-[#E4405F]/20 hover:border-[#E4405F]/40 transition-all duration-300 shadow-[0_0_15px_rgba(228,64,95,0.1)]"
                data-testid="link-instagram-footer"
              >
                <SiInstagram className="w-4 h-4" />
                @darkshare.store
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-sm flex items-center gap-2 text-white">
              <Shield className="w-4 h-4 text-primary" />
              {t('footer.legal')}
            </h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <Link href="/terms">
                  <span className="hover:text-primary transition-colors flex items-center gap-1.5 cursor-pointer" data-testid="link-terms">
                    {t('footer.termsOfService')}
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/privacy">
                  <span className="hover:text-primary transition-colors flex items-center gap-1.5 cursor-pointer" data-testid="link-privacy">
                    {t('footer.privacyPolicy')}
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/support">
                  <span className="hover:text-primary transition-colors flex items-center gap-1.5 cursor-pointer" data-testid="link-contact">
                    <Mail className="w-3.5 h-3.5" />
                    {t('footer.contact')}
                  </span>
                </Link>
              </li>
              <li>
                <a href="mailto:darkshare.store@gmail.com" className="hover:text-primary transition-colors flex items-center gap-1.5" data-testid="link-support-email">
                  darkshare.store@gmail.com
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-sm text-white">
              {t('footer.disclaimer')}
            </h4>
            <p className="text-xs text-muted-foreground/80 leading-relaxed">
              {t('footer.disclaimerText')}
            </p>
          </div>
        </div>

        <div className="border-t border-white/[0.06] mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-xs text-muted-foreground/60 font-mono order-2 sm:order-1">
            © 2026 DARKSHARE. All rights reserved.
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground/70 order-1 sm:order-2">
            <Link href="/terms">
              <span className="hover:text-primary transition-colors cursor-pointer" data-testid="link-terms-bottom">
                {t('footer.terms')}
              </span>
            </Link>
            <span className="text-white/10">|</span>
            <Link href="/privacy">
              <span className="hover:text-primary transition-colors cursor-pointer" data-testid="link-privacy-bottom">
                {t('footer.privacy')}
              </span>
            </Link>
            <span className="text-white/10">|</span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
              {t('footer.systemsOnline')}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
